import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
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
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly venuesService: VenuesService,
    private readonly offersService: OffersService,
  ) {}

  @Get('owner/dashboard')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOkResponse({ description: 'Owner dashboard analytics' })
  async getOwnerDashboard(@GetUser() user: User) {
    return this.analyticsService.getOwnerDashboard(user.id);
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
  async getVenueAnalytics(
    @Param('venueId') venueId: string,
    @GetUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Verify ownership (admins can access any venue)
    const venue = await this.venuesService.findById(venueId);
    if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this venue');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getVenueAnalytics(venueId, start, end);
  }

  @Get('offers/:offerId')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOkResponse({ description: 'Offer analytics' })
  async getOfferAnalytics(
    @Param('offerId') offerId: string,
    @GetUser() user: User,
  ) {
    // Verify offer belongs to user's venue
    const offer = await this.offersService.findById(offerId);
    const venue = await this.venuesService.findById(offer.venue.id);
    if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this offer');
    }
    return this.analyticsService.getOfferAnalytics(offerId);
  }

  @Get('platform/engagement')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Platform-wide user engagement analytics' })
  async getPlatformEngagement() {
    // Admin-only endpoint
    return this.analyticsService.getUserEngagementAnalytics();
  }
}
