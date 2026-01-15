import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { VenuesService } from '../venues/venues.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { RedeemOfferDto } from './dto/redeem-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly venuesService: VenuesService,
  ) {}

  @Get()
  @ApiQuery({ name: 'venueId', required: true })
  @ApiOkResponse({ type: [OfferResponseDto] })
  async getAvailableOffers(
    @Query('venueId') venueId: string,
  ): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.getAvailableOffers(venueId);

    return offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      offerType: o.offerType,
      minBusyness: o.minBusyness,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      isActive: o.isActive,
      viewCount: o.viewCount,
      clickCount: o.clickCount,
      redeemCount: o.redeemCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      venue: {
        id: o.venue.id,
        name: o.venue.name,
        category: o.venue.category,
        address: o.venue.address,
      },
    }));
  }

  @Get('by-venue/:venueId')
  @ApiOkResponse({ type: [OfferResponseDto] })
  async getOffersByVenue(
    @Param('venueId') venueId: string,
  ): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findByVenue(venueId);

    return offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      offerType: o.offerType,
      minBusyness: o.minBusyness,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      isActive: o.isActive,
      viewCount: o.viewCount,
      clickCount: o.clickCount,
      redeemCount: o.redeemCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      venue: {
        id: o.venue.id,
        name: o.venue.name,
        category: o.venue.category,
        address: o.venue.address,
      },
    }));
  }

  @Get(':id')
  @ApiOkResponse({ type: OfferResponseDto })
  async getOffer(@Param('id') id: string): Promise<OfferResponseDto> {
    const o = await this.offersService.findById(id);

    return {
      id: o.id,
      title: o.title,
      description: o.description,
      offerType: o.offerType,
      minBusyness: o.minBusyness,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      isActive: o.isActive,
      viewCount: o.viewCount,
      clickCount: o.clickCount,
      redeemCount: o.redeemCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      venue: {
        id: o.venue.id,
        name: o.venue.name,
        category: o.venue.category,
        address: o.venue.address,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: OfferResponseDto })
  async create(
    @Body() dto: CreateOfferDto,
    @GetUser() user: User,
  ): Promise<OfferResponseDto> {
    const venue = await this.venuesService.findById(dto.venueId);
    if (venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this venue');
    }
    const offer = await this.offersService.create(dto);
    const fullOffer = await this.offersService.findById(offer.id);

    return {
      id: fullOffer.id,
      title: fullOffer.title,
      description: fullOffer.description,
      offerType: fullOffer.offerType,
      minBusyness: fullOffer.minBusyness,
      startsAt: fullOffer.startsAt,
      endsAt: fullOffer.endsAt,
      isActive: fullOffer.isActive,
      viewCount: fullOffer.viewCount,
      clickCount: fullOffer.clickCount,
      redeemCount: fullOffer.redeemCount,
      createdAt: fullOffer.createdAt,
      updatedAt: fullOffer.updatedAt,
      venue: {
        id: fullOffer.venue.id,
        name: fullOffer.venue.name,
        category: fullOffer.venue.category,
        address: fullOffer.venue.address,
      },
    };
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Offer redemption result' })
  async redeem(@Body() dto: RedeemOfferDto) {
    return this.offersService.redeem(dto);
  }

  @Patch(':id/view')
  @ApiOkResponse({ description: 'View count incremented' })
  async incrementView(@Param('id') offerId: string) {
    await this.offersService.incrementViewCount(offerId);
    return { success: true, message: 'View count incremented' };
  }

  @Patch(':id/click')
  @ApiOkResponse({ description: 'Click count incremented' })
  async incrementClick(@Param('id') offerId: string) {
    await this.offersService.incrementClickCount(offerId);
    return { success: true, message: 'Click count incremented' };
  }

  @Get(':id/stats')
  @ApiOkResponse({ description: 'Offer analytics statistics' })
  async getStats(@Param('id') offerId: string) {
    return this.offersService.getOfferStats(offerId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Offer status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOfferStatusDto,
    @GetUser() user: User,
  ) {
    const offer = await this.offersService.findById(id);
    const venue = await this.venuesService.findById(offer.venue.id);
    if (venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this offer');
    }
    return this.offersService.updateStatus(id, dto.isActive);
  }
}
