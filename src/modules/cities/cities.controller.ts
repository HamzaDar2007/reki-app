import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CityResponseDto } from './dto/city-response.dto';
import { CreateCityDto } from './dto/create-city.dto';

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOkResponse({ type: [CityResponseDto] })
  async findAll(): Promise<CityResponseDto[]> {
    const cities = await this.citiesService.findAll();
    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      timezone: c.timezone,
      isActive: c.isActive,
      centerLat: c.centerLat,
      centerLng: c.centerLng,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  @Get(':id')
  @ApiOkResponse({ type: CityResponseDto })
  async findById(@Param('id') id: string): Promise<CityResponseDto> {
    const c = await this.citiesService.findById(id);
    return {
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      timezone: c.timezone,
      isActive: c.isActive,
      centerLat: c.centerLat,
      centerLng: c.centerLng,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  @Get('by-name/:name')
  @ApiOkResponse({ type: CityResponseDto })
  async findByName(@Param('name') name: string): Promise<CityResponseDto> {
    const c = await this.citiesService.findByName(name);
    return {
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      timezone: c.timezone,
      isActive: c.isActive,
      centerLat: c.centerLat,
      centerLng: c.centerLng,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  @Post()
  @ApiCreatedResponse({ type: CityResponseDto })
  async create(@Body() dto: CreateCityDto): Promise<CityResponseDto> {
    const c = await this.citiesService.create(dto);
    return {
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      timezone: c.timezone,
      isActive: c.isActive,
      centerLat: c.centerLat,
      centerLng: c.centerLng,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
