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
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiResponse,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  private readonly logger = new Logger(OffersController.name);

  constructor(
    private readonly offersService: OffersService,
    private readonly venuesService: VenuesService,
  ) {}

  @Get()
  @ApiOkResponse({ type: [OfferResponseDto] })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAvailableOffers(): Promise<OfferResponseDto[]> {
    try {
      this.logger.log('Fetching all offers');
      const offers = await this.offersService.findAll();

      if (!offers) {
        return [];
      }

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
    } catch (error) {
      this.logger.error('Failed to fetch offers:', error);
      throw error;
    }
  }

  @Get('by-venue/:venueId')
  @ApiOkResponse({ type: [OfferResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid venue ID' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOffersByVenue(
    @Param('venueId') venueId: string,
  ): Promise<OfferResponseDto[]> {
    try {
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      this.logger.log(`Fetching offers for venue: ${venueId}`);
      const offers = await this.offersService.findByVenue(venueId);

      if (!offers) {
        return [];
      }

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
    } catch (error) {
      this.logger.error(
        `Failed to fetch offers for venue ${venueId}:`,
        error,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: OfferResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid  offer ID' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOffer(@Param('id') id: string): Promise<OfferResponseDto> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }
      this.logger.log(`Fetching offer by ID: ${id}`);
      const o = await this.offersService.findById(id);
      if (!o) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }

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
    } catch (error) {
      this.logger.error(`Failed to fetch offer ${id}:`, error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: OfferResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(
    @Body() dto: CreateOfferDto,
    @GetUser() user: User,
  ): Promise<OfferResponseDto> {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!dto || !dto.venueId) {
        throw new BadRequestException('Venue ID is required');
      }
      if (!dto.title || !dto.description) {
        throw new BadRequestException('Offer title and description are required');
      }
      this.logger.log(`Creating offer for venue: ${dto.venueId}`);
      const venue = await this.venuesService.findById(dto.venueId);
      if (!venue) {
        throw new NotFoundException(`Venue with ID ${dto.venueId} not found`);
      }
      // Check ownership unless admin
      if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
        throw new ForbiddenException('You do not own this venue');
      }
      const offer = await this.offersService.create(dto);
      if (!offer) {
        throw new Error('Failed to create offer');
      }
      const fullOffer = await this.offersService.findById(offer.id);
      if (!fullOffer) {
        throw new NotFoundException('Created offer not found');
      }

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
    } catch (error) {
      this.logger.error('Failed to create offer:', error);
      throw error;
    }
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Offer redemption result' })
  @ApiResponse({ status: 400, description: 'Invalid redemption data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async redeem(@Body() dto: RedeemOfferDto, @GetUser() user: User) {
    try {
      if (!dto || !dto.offerId) {
        throw new BadRequestException('Offer ID is required');
      }
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Redeeming offer ${dto.offerId} for user ${user.id}`);
      return await this.offersService.redeem({ ...dto, userId: user.id });
    } catch (error) {
      this.logger.error('Failed to redeem offer:', error);
      throw error;
    }
  }

  @Patch(':id/view')
  @ApiOkResponse({ description: 'View count incremented' })
  @ApiResponse({ status: 400, description: 'Invalid offer ID' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async incrementView(@Param('id') offerId: string) {
    try {
      if (!offerId || offerId.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }
      this.logger.log(`Incrementing view count for offer: ${offerId}`);
      await this.offersService.incrementViewCount(offerId);
      return { success: true, message: 'View count incremented' };
    } catch (error) {
      this.logger.error(`Failed to increment view count for ${offerId}:`, error);
      throw error;
    }
  }

  @Patch(':id/click')
  @ApiOkResponse({ description: 'Click count incremented' })
  @ApiResponse({ status: 400, description: 'Invalid offer ID' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async incrementClick(@Param('id') offerId: string) {
    try {
      if (!offerId || offerId.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }
      this.logger.log(`Incrementing click count for offer: ${offerId}`);
      await this.offersService.incrementClickCount(offerId);
      return { success: true, message: 'Click count incremented' };
    } catch (error) {
      this.logger.error(`Failed to increment click count for ${offerId}:`, error);
      throw error;
    }
  }

  @Get(':id/stats')
  @ApiOkResponse({ description: 'Offer analytics statistics' })
  @ApiResponse({ status: 400, description: 'Invalid offer ID' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStats(@Param('id') offerId: string) {
    try {
      if (!offerId || offerId.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }
      this.logger.log(`Fetching stats for offer: ${offerId}`);
      const stats = await this.offersService.getOfferStats(offerId);
      if (!stats) {
        throw new NotFoundException(`Stats for offer ${offerId} not found`);
      }
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch stats for offer ${offerId}:`, error);
      throw error;
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Offer status updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOfferStatusDto,
    @GetUser() user: User,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!id || id.trim() === '') {
        throw new BadRequestException('Offer ID is required');
      }
      if (dto.isActive === undefined) {
        throw new BadRequestException('isActive status is required');
      }
      this.logger.log(`Updating offer status: ${id}`);
      const offer = await this.offersService.findById(id);
      if (!offer) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }
      const venue = await this.venuesService.findById(offer.venue.id);
      if (!venue) {
        throw new NotFoundException('Associated venue not found');
      }
      // Check ownership unless admin
      if (user.role !== UserRole.ADMIN && venue.ownerId !== user.id) {
        throw new ForbiddenException('You do not own this offer');
      }
      return await this.offersService.updateStatus(id, dto.isActive);
    } catch (error) {
      this.logger.error(`Failed to update offer status ${id}:`, error);
      throw error;
    }
  }
}
