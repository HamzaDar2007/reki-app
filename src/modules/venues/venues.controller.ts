import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
  Request,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { VenueLiveStateService } from './venue-live-state.service';
import { VenueVibeScheduleService } from './venue-vibe-schedule.service';
import { VenueResponseDto } from './dto/venue-response.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueLiveStateDto } from './dto/update-venue-live-state.dto';
import { CreateVibeScheduleDto } from './dto/create-vibe-schedule.dto';
import { Venue } from './entities/venue.entity';
import { VibeType } from './entities/venue-live-state.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VenueOwnershipGuard } from '../../common/guards/venue-ownership.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  private readonly logger = new Logger(VenuesController.name);

  constructor(
    private readonly venuesService: VenuesService,
    private readonly liveStateService: VenueLiveStateService,
    private readonly vibeScheduleService: VenueVibeScheduleService,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepo: Repository<UserPreferences>,
  ) {}

  @Get()
  @ApiOkResponse({ type: [VenueResponseDto] })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findVenues(): Promise<VenueResponseDto[]> {
    try {
      this.logger.log('Fetching all venues');
      const venues = await this.venuesService.findAll();

      // Map to response DTOs
      const venueResponses = venues.map((v: Venue) => {
        const activeOffersCount = (v.offers || []).filter(
          (o) => o.isActive,
        ).length;

        const response: VenueResponseDto = {
          id: v.id,
          name: v.name,
          category: v.category,
          address: v.address,
          postcode: v.postcode,
          lat: v.lat ? Number(v.lat) : undefined,
          lng: v.lng ? Number(v.lng) : undefined,
          coverImageUrl: v.coverImageUrl,
          galleryImages: v.galleryImages,
          logoUrl: v.logoUrl,
          description: v.description,
          isActive: v.isActive,
          ownerId: v.ownerId,
          busyness: v.liveState?.busyness,
          vibe: v.liveState?.vibe,
          busynessUpdatedAt: v.liveState?.busynessUpdatedAt,
          vibeUpdatedAt: v.liveState?.vibeUpdatedAt,
          activeOffersCount,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };

        return response;
      });

      return venueResponses;
    } catch (error) {
      this.logger.error('Failed to fetch venues:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: VenueResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid venue ID' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string): Promise<VenueResponseDto> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      this.logger.log(`Fetching venue by ID: ${id}`);
      const v = await this.venuesService.findById(id);
      if (!v) {
        throw new NotFoundException(`Venue with ID ${id} not found`);
      }
      const activeOffersCount = (v.offers || []).filter(
        (o) => o.isActive,
      ).length;

      return {
        id: v.id,
        name: v.name,
        category: v.category,
        address: v.address,
        postcode: v.postcode,
        lat: v.lat ? Number(v.lat) : undefined,
        lng: v.lng ? Number(v.lng) : undefined,
        coverImageUrl: v.coverImageUrl,
        description: v.description,
        isActive: v.isActive,
        ownerId: v.ownerId,
        busyness: v.liveState?.busyness,
        vibe: v.liveState?.vibe,
        busynessUpdatedAt: v.liveState?.busynessUpdatedAt,
        vibeUpdatedAt: v.liveState?.vibeUpdatedAt,
        activeOffersCount,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch venue ${id}:`, error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: VenueResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(
    @Body() dto: CreateVenueDto,
    @GetUser() user: User,
  ): Promise<VenueResponseDto> {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!dto || !dto.name) {
        throw new BadRequestException('Venue name is required');
      }
      this.logger.log(`Creating venue for user: ${user.id}`);
      const venue = await this.venuesService.create(dto, user.id);
      if (!venue) {
        throw new Error('Failed to create venue');
      }
      const fullVenue = await this.venuesService.findById(venue.id);
      if (!fullVenue) {
        throw new NotFoundException('Created venue not found');
      }

      return {
        id: fullVenue.id,
        name: fullVenue.name,
        category: fullVenue.category,
        address: fullVenue.address,
        postcode: fullVenue.postcode,
        lat: fullVenue.lat ? Number(fullVenue.lat) : undefined,
        lng: fullVenue.lng ? Number(fullVenue.lng) : undefined,
        coverImageUrl: fullVenue.coverImageUrl,
        description: fullVenue.description,
        isActive: fullVenue.isActive,
        ownerId: fullVenue.ownerId,
        busyness: fullVenue.liveState?.busyness,
        vibe: fullVenue.liveState?.vibe,
        busynessUpdatedAt: fullVenue.liveState?.busynessUpdatedAt,
        vibeUpdatedAt: fullVenue.liveState?.vibeUpdatedAt,
        activeOffersCount: 0,
        createdAt: fullVenue.createdAt,
        updatedAt: fullVenue.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to create venue:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard, VenueOwnershipGuard)
  @Patch(':id/live-state')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Live state updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateLiveState(
    @Param('id') venueId: string,
    @Body() dto: UpdateVenueLiveStateDto,
    @GetUser() user: User,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      if (!dto) {
        throw new BadRequestException('Update data is required');
      }
      this.logger.log(`Updating live state for venue: ${venueId}`);
      // VenueOwnershipGuard already checked ownership, so we can proceed
      const updated = await this.liveStateService.update(venueId, dto);
      if (!updated) {
        throw new NotFoundException(`Venue with ID ${venueId} not found`);
      }
      return {
        venueId,
        busyness: updated.busyness,
        vibe: updated.vibe,
        busynessUpdatedAt: updated.busynessUpdatedAt,
        vibeUpdatedAt: updated.vibeUpdatedAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update live state for ${venueId}:`, error);
      throw error;
    }
  }

  @Post(':id/vibe-schedules')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueOwnershipGuard)
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Vibe schedule created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createVibeSchedule(
    @Param('id') venueId: string,
    @Body() dto: CreateVibeScheduleDto,
    @GetUser() user: User,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      if (!dto) {
        throw new BadRequestException('Vibe schedule data is required');
      }
      this.logger.log(`Creating vibe schedule for venue: ${venueId}`);
      // VenueOwnershipGuard already checked ownership, so we can proceed
      const created = await this.vibeScheduleService.create(venueId, dto);
      if (!created) {
        throw new Error('Failed to create vibe schedule');
      }
      return {
        id: created.id,
        venueId,
        dayOfWeek: created.dayOfWeek,
        startTime: created.startTime,
        endTime: created.endTime,
        vibe: created.vibe,
        priority: created.priority,
        isActive: created.isActive,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create vibe schedule for ${venueId}:`,
        error,
      );
      throw error;
    }
  }

  @Get(':id/vibe-schedules')
  @ApiOkResponse({ description: 'Vibe schedules for venue' })
  @ApiResponse({ status: 400, description: 'Invalid venue ID' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getVibeSchedules(@Param('id') venueId: string) {
    try {
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      this.logger.log(`Fetching vibe schedules for venue: ${venueId}`);
      const schedules = await this.vibeScheduleService.findByVenue(venueId);
      if (!schedules) {
        return [];
      }
      return schedules.map((s) => ({
        id: s.id,
        venueId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        vibe: s.vibe,
        priority: s.priority,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch vibe schedules for ${venueId}:`, error);
      throw error;
    }
  }

  @Get(':id/current-vibe')
  @ApiOkResponse({ description: 'Computed current vibe based on schedule' })
  @ApiResponse({ status: 400, description: 'Invalid venue ID' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async computeCurrentVibe(@Param('id') venueId: string): Promise<{
    vibe: VibeType | null;
    nextChange?: {
      vibe: VibeType;
      startsAt: string;
      dayOfWeek: number;
    } | null;
  }> {
    try {
      if (!venueId || venueId.trim() === '') {
        throw new BadRequestException('Venue ID is required');
      }
      this.logger.log(`Computing current vibe for venue: ${venueId}`);
      const vibe = await this.vibeScheduleService.computeCurrentVibe(venueId);
      const nextChange = await this.vibeScheduleService.getNextVibeChange(
        venueId,
      );

      return { vibe, nextChange };
    } catch (error) {
      this.logger.error(`Failed to compute current vibe for ${venueId}:`, error);
      throw error;
    }
  }
}
