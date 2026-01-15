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
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiBearerAuth,
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

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(
    private readonly venuesService: VenuesService,
    private readonly liveStateService: VenueLiveStateService,
    private readonly vibeScheduleService: VenueVibeScheduleService,
  ) {}

  @Get()
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'minBusyness', required: false })
  @ApiQuery({ name: 'preferredVibes', required: false, type: [String] })
  @ApiOkResponse({ type: [VenueResponseDto] })
  async findVenues(
    @Query('cityId') cityId?: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius?: number,
    @Query('categories') categories?: string[],
    @Query('minBusyness') minBusyness?: string,
    @Query('preferredVibes') preferredVibes?: string[],
  ): Promise<VenueResponseDto[]> {
    let venues: Venue[];

    if (lat && lng) {
      venues = await this.venuesService.findNearby(lat, lng, radius || 5);
    } else if (cityId) {
      venues = await this.venuesService.findByCity(cityId);
    } else {
      throw new Error('Either cityId or lat/lng coordinates are required');
    }

    // Apply preference-based filtering
    if (categories && categories.length > 0) {
      venues = venues.filter((v: Venue) => categories.includes(v.category));
    }
    if (minBusyness) {
      venues = venues.filter((v: Venue) => {
        const busynessLevels = ['QUIET', 'MODERATE', 'BUSY'];
        const currentLevel = busynessLevels.indexOf(v.liveState.busyness);
        const minLevel = busynessLevels.indexOf(minBusyness);
        return currentLevel >= minLevel;
      });
    }
    if (preferredVibes && preferredVibes.length > 0) {
      venues = venues.filter((v: Venue) =>
        preferredVibes.includes(v.liveState.vibe),
      );
    }

    return venues.map((v: Venue) => {
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
        busyness: v.liveState?.busyness,
        vibe: v.liveState?.vibe,
        busynessUpdatedAt: v.liveState?.busynessUpdatedAt,
        vibeUpdatedAt: v.liveState?.vibeUpdatedAt,
        activeOffersCount,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      } as VenueResponseDto;
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: VenueResponseDto })
  async findById(@Param('id') id: string): Promise<VenueResponseDto> {
    const v = await this.venuesService.findById(id);
    const activeOffersCount = (v.offers || []).filter((o) => o.isActive).length;

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
      busyness: v.liveState?.busyness,
      vibe: v.liveState?.vibe,
      busynessUpdatedAt: v.liveState?.busynessUpdatedAt,
      vibeUpdatedAt: v.liveState?.vibeUpdatedAt,
      activeOffersCount,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: VenueResponseDto })
  async create(
    @Body() dto: CreateVenueDto,
    @GetUser() user: User,
  ): Promise<VenueResponseDto> {
    const venue = await this.venuesService.create(dto, user.id);
    const fullVenue = await this.venuesService.findById(venue.id);

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
      busyness: fullVenue.liveState?.busyness,
      vibe: fullVenue.liveState?.vibe,
      busynessUpdatedAt: fullVenue.liveState?.busynessUpdatedAt,
      vibeUpdatedAt: fullVenue.liveState?.vibeUpdatedAt,
      activeOffersCount: 0,
      createdAt: fullVenue.createdAt,
      updatedAt: fullVenue.updatedAt,
    };
  }

  @Patch(':id/live-state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Live state updated' })
  async updateLiveState(
    @Param('id') venueId: string,
    @Body() dto: UpdateVenueLiveStateDto,
    @GetUser() user: User,
  ) {
    const venue = await this.venuesService.findById(venueId);
    if (venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this venue');
    }
    const updated = await this.liveStateService.update(venueId, dto);
    return {
      venueId,
      busyness: updated.busyness,
      vibe: updated.vibe,
      busynessUpdatedAt: updated.busynessUpdatedAt,
      vibeUpdatedAt: updated.vibeUpdatedAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Post(':id/vibe-schedules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Vibe schedule created' })
  async createVibeSchedule(
    @Param('id') venueId: string,
    @Body() dto: CreateVibeScheduleDto,
    @GetUser() user: User,
  ) {
    const venue = await this.venuesService.findById(venueId);
    if (venue.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this venue');
    }
    const created = await this.vibeScheduleService.create(venueId, dto);
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
  }

  @Get(':id/vibe-schedules')
  @ApiOkResponse({ description: 'Vibe schedules for venue' })
  async getVibeSchedules(@Param('id') venueId: string) {
    const schedules = await this.vibeScheduleService.findByVenue(venueId);
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
  }

  @Get(':id/current-vibe')
  @ApiOkResponse({ description: 'Computed current vibe based on schedule' })
  async computeCurrentVibe(@Param('id') venueId: string): Promise<{
    vibe: VibeType | null;
    nextChange?: {
      vibe: VibeType;
      startsAt: string;
      dayOfWeek: number;
    } | null;
  }> {
    const vibe = await this.vibeScheduleService.computeCurrentVibe(venueId);
    const nextChange =
      await this.vibeScheduleService.getNextVibeChange(venueId);

    return { vibe, nextChange };
  }
}
