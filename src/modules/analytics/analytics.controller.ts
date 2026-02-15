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

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly venuesService: VenuesService,
  ) {}

  @Get('owner/dashboard')
  @ApiOkResponse({ description: 'Owner dashboard analytics' })
  async getOwnerDashboard(@GetUser() user: User) {
    return this.analyticsService.getOwnerDashboard(user.id);
  }

  @Get('venues/:venueId')
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
    // Verify ownership
    const venue = await this.venuesService.findById(venueId);
    if (venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this venue');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getVenueAnalytics(venueId, start, end);
  }

  @Get('offers/:offerId')
  @ApiOkResponse({ description: 'Offer analytics' })
  async getOfferAnalytics(@Param('offerId') offerId: string) {
    // Note: In production, should verify offer belongs to user's venue
    return this.analyticsService.getOfferAnalytics(offerId);
  }

  @Get('platform/engagement')
  @ApiOkResponse({ description: 'Platform-wide user engagement analytics' })
  async getPlatformEngagement() {
    // Note: In production, this should be admin-only
    return this.analyticsService.getUserEngagementAnalytics();
  }
}
