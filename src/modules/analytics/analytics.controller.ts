import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { VenuesService } from '../venues/venues.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { OffersService } from '../offers/offers.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly venuesService: VenuesService,
    private readonly offersService: OffersService,
  ) {}

  @Get('owner/dashboard')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOkResponse({ description: 'Owner dashboard analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOwnerDashboard(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Fetching owner dashboard for user: ${user.id}`);
      return await this.analyticsService.getOwnerDashboard(user.id);
    } catch (error) {
      this.logger.error('Failed to fetch owner dashboard:', error);
      throw error;
    }
  }

  @Get('venues/:venueId')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'ISO date string for filtering',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'ISO date string for filtering',
  })
  @ApiOkResponse({ description: 'Venue analytics' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getVenueAnalytics(
    @Param('venueId') venueId: string,
    @GetUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }

      this.logger.log(`Fetching analytics for venue: ${venueId}`);

      // Verify ownership (admins can access any venue)
      const venue = await this.venuesService.findById(venueId);
      if (!venue) {
        throw new NotFoundException(`Venue with ID ${venueId} not found`);
      }

      if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
        throw new ForbiddenException('You do not own this venue');
      }

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      if (start && isNaN(start.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }
      if (end && isNaN(end.getTime())) {
        throw new BadRequestException('Invalid endDate format');
      }

      return await this.analyticsService.getVenueAnalytics(venueId, start, end);
    } catch (error) {
      this.logger.error(`Failed to fetch venue analytics for ${venueId}:`, error);
      throw error;
    }
  }

  @Get('offers/:offerId')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOkResponse({ description: 'Offer analytics' })
  @ApiResponse({ status: 400, description: 'Invalid offer ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOfferAnalytics(
    @Param('offerId') offerId: string,
    @GetUser() user: User,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!offerId || offerId.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }

      this.logger.log(`Fetching analytics for offer: ${offerId}`);

      // Verify offer belongs to user's venue
      const offer = await this.offersService.findById(offerId);
      if (!offer) {
        throw new NotFoundException(`Offer with ID ${offerId} not found`);
      }

      const venue = await this.venuesService.findById(offer.venue.id);
      if (!venue) {
        throw new NotFoundException('Associated venue not found');
      }

      if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
        throw new ForbiddenException('You do not own this offer');
      }

      return await this.analyticsService.getOfferAnalytics(offerId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch offer analytics for ${offerId}:`,
        error,
      );
      throw error;
    }
  }

  @Get('platform/engagement')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Platform-wide user engagement analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPlatformEngagement(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Admin access required');
      }

      this.logger.log('Fetching platform engagement analytics');
      return await this.analyticsService.getUserEngagementAnalytics();
    } catch (error) {
      this.logger.error('Failed to fetch platform engagement:', error);
      throw error;
    }
  }
}
