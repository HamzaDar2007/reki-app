import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Venue } from '../venues/entities/venue.entity';
import { Offer } from '../offers/entities/offer.entity';
import { OfferRedemption } from '../offers/entities/offer-redemption.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferRedemption)
    private readonly redemptionRepo: Repository<OfferRedemption>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Get comprehensive analytics for a venue owner
   */
  async getVenueAnalytics(
    venueId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    venue: {
      id: string;
      name: string;
      category: string;
    };
    offers: {
      total: number;
      active: number;
      expired: number;
    };
    performance: {
      totalViews: number;
      totalClicks: number;
      totalRedemptions: number;
      overallConversionRate: number;
    };
    topOffers: Array<{
      id: string;
      title: string;
      views: number;
      clicks: number;
      redemptions: number;
      conversionRate: number;
    }>;
    recentRedemptions: Array<{
      id: string;
      offerTitle: string;
      redeemedAt: Date;
    }>;
  }> {
    const venue = await this.venueRepo.findOne({
      where: { id: venueId },
      select: ['id', 'name', 'category'],
    });

    if (!venue) {
      throw new Error('Venue not found');
    }

    // Offer counts
    const dateFilter =
      startDate && endDate ? { createdAt: Between(startDate, endDate) } : {};

    const allOffers = await this.offerRepo.find({
      where: { venue: { id: venueId }, ...dateFilter },
      order: { redeemCount: 'DESC' },
    });

    const now = new Date();
    const activeOffers = allOffers.filter(
      (o) => o.isActive && o.startsAt <= now && o.endsAt >= now,
    );
    const expiredOffers = allOffers.filter((o) => o.endsAt < now);

    // Performance metrics
    const totalViews = allOffers.reduce((sum, o) => sum + o.viewCount, 0);
    const totalClicks = allOffers.reduce((sum, o) => sum + o.clickCount, 0);
    const totalRedemptions = allOffers.reduce(
      (sum, o) => sum + o.redeemCount,
      0,
    );
    const overallConversionRate =
      totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;

    // Top offers
    const topOffers = allOffers.slice(0, 5).map((o) => ({
      id: o.id,
      title: o.title,
      views: o.viewCount,
      clicks: o.clickCount,
      redemptions: o.redeemCount,
      conversionRate: o.viewCount > 0 ? (o.redeemCount / o.viewCount) * 100 : 0,
    }));

    // Recent redemptions
    const redemptions = await this.redemptionRepo.find({
      where: { venue: { id: venueId } },
      relations: ['offer'],
      order: { redeemedAt: 'DESC' },
      take: 10,
    });

    const recentRedemptions = redemptions.map((r) => ({
      id: r.id,
      offerTitle: r.offer?.title || 'Unknown Offer',
      redeemedAt: r.redeemedAt,
    }));

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        category: venue.category,
      },
      offers: {
        total: allOffers.length,
        active: activeOffers.length,
        expired: expiredOffers.length,
      },
      performance: {
        totalViews,
        totalClicks,
        totalRedemptions,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      },
      topOffers,
      recentRedemptions,
    };
  }

  /**
   * Get analytics for a specific offer
   */
  async getOfferAnalytics(offerId: string): Promise<{
    offer: {
      id: string;
      title: string;
      description: string;
      isActive: boolean;
      startsAt: Date;
      endsAt: Date;
    };
    metrics: {
      views: number;
      clicks: number;
      redemptions: number;
      clickThroughRate: number;
      conversionRate: number;
    };
    timeline: {
      date: string;
      views: number;
      redemptions: number;
    }[];
  }> {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['venue'],
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    const clickThroughRate =
      offer.viewCount > 0 ? (offer.clickCount / offer.viewCount) * 100 : 0;
    const conversionRate =
      offer.viewCount > 0 ? (offer.redeemCount / offer.viewCount) * 100 : 0;

    // Get redemption timeline (grouped by day)
    const redemptions = await this.redemptionRepo
      .createQueryBuilder('redemption')
      .where('redemption.offer_id = :offerId', { offerId })
      .select("DATE_TRUNC('day', redemption.redeemedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    const timeline = redemptions.map((r: { date: string; count: string }) => ({
      date: r.date,
      views: 0, // Note: We don't track view timestamps, only counts
      redemptions: parseInt(r.count, 10),
    }));

    return {
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description || '',
        isActive: offer.isActive,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
      },
      metrics: {
        views: offer.viewCount,
        clicks: offer.clickCount,
        redemptions: offer.redeemCount,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      timeline,
    };
  }

  /**
   * Get user engagement analytics across the platform
   */
  async getUserEngagementAnalytics(): Promise<{
    notifications: {
      totalSent: number;
      totalRead: number;
      readRate: number;
    };
    offers: {
      totalOffers: number;
      totalViews: number;
      totalRedemptions: number;
      averageConversionRate: number;
    };
    venues: {
      totalVenues: number;
      activeVenues: number;
    };
  }> {
    // Notification metrics
    const totalNotifications = await this.notificationRepo.count();
    const readNotifications = await this.notificationRepo.count({
      where: { isRead: true },
    });
    const readRate =
      totalNotifications > 0
        ? (readNotifications / totalNotifications) * 100
        : 0;

    // Offer metrics
    const offers = await this.offerRepo.find();
    const totalOffers = offers.length;
    const totalViews = offers.reduce((sum, o) => sum + o.viewCount, 0);
    const totalRedemptions = offers.reduce((sum, o) => sum + o.redeemCount, 0);
    const averageConversionRate =
      totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;

    // Venue metrics
    const totalVenues = await this.venueRepo.count();
    const activeVenues = await this.venueRepo.count({
      where: { isActive: true },
    });

    return {
      notifications: {
        totalSent: totalNotifications,
        totalRead: readNotifications,
        readRate: Math.round(readRate * 100) / 100,
      },
      offers: {
        totalOffers,
        totalViews,
        totalRedemptions,
        averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      },
      venues: {
        totalVenues,
        activeVenues,
      },
    };
  }

  /**
   * Get analytics for all venues owned by a user
   */
  async getOwnerDashboard(userId: string): Promise<{
    venues: Array<{
      id: string;
      name: string;
      category: string;
      totalOffers: number;
      activeOffers: number;
      totalViews: number;
      totalRedemptions: number;
      conversionRate: number;
    }>;
    summary: {
      totalVenues: number;
      totalOffers: number;
      totalViews: number;
      totalRedemptions: number;
      overallConversionRate: number;
    };
  }> {
    const venues = await this.venueRepo.find({
      where: { ownerId: userId },
      relations: ['offers'],
    });

    const venueAnalytics = venues.map((venue) => {
      const offers = venue.offers || [];
      const now = new Date();
      const activeOffers = offers.filter(
        (o) => o.isActive && o.startsAt <= now && o.endsAt >= now,
      );
      const totalViews = offers.reduce((sum, o) => sum + o.viewCount, 0);
      const totalRedemptions = offers.reduce(
        (sum, o) => sum + o.redeemCount,
        0,
      );
      const conversionRate =
        totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;

      return {
        id: venue.id,
        name: venue.name,
        category: venue.category,
        totalOffers: offers.length,
        activeOffers: activeOffers.length,
        totalViews,
        totalRedemptions,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    });

    const summary = {
      totalVenues: venues.length,
      totalOffers: venueAnalytics.reduce((sum, v) => sum + v.totalOffers, 0),
      totalViews: venueAnalytics.reduce((sum, v) => sum + v.totalViews, 0),
      totalRedemptions: venueAnalytics.reduce(
        (sum, v) => sum + v.totalRedemptions,
        0,
      ),
      overallConversionRate:
        venueAnalytics.reduce((sum, v) => sum + v.totalViews, 0) > 0
          ? (venueAnalytics.reduce((sum, v) => sum + v.totalRedemptions, 0) /
              venueAnalytics.reduce((sum, v) => sum + v.totalViews, 0)) *
            100
          : 0,
    };

    return {
      venues: venueAnalytics,
      summary: {
        ...summary,
        overallConversionRate:
          Math.round(summary.overallConversionRate * 100) / 100,
      },
    };
  }
}
