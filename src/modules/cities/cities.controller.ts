import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CityResponseDto } from './dto/city-response.dto';
import { CreateCityDto } from './dto/create-city.dto';

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {
  private readonly logger = new Logger(CitiesController.name);

  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOkResponse({ type: [CityResponseDto] })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<CityResponseDto[]> {
    try {
      this.logger.log('Fetching all cities');
      const cities = await this.citiesService.findAll();
      if (!cities) {
        return [];
      }
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
    } catch (error) {
      this.logger.error('Failed to fetch cities:', error);
      throw new InternalServerErrorException('Failed to fetch cities');
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: CityResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid city ID' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string): Promise<CityResponseDto> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('City ID is required');
      }
      this.logger.log(`Fetching city by ID: ${id}`);
      const c = await this.citiesService.findById(id);
      if (!c) {
        throw new NotFoundException(`City with ID ${id} not found`);
      }
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
    } catch (error) {
      this.logger.error(`Failed to fetch city ${id}:`, error);
      throw error;
    }
  }

  @Get('by-name/:name')
  @ApiOkResponse({ type: CityResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid city name' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByName(@Param('name') name: string): Promise<CityResponseDto> {
    try {
      if (!name || name.trim() === '') {
        throw new BadRequestException('City name is required');
      }
      this.logger.log(`Fetching city by name: ${name}`);
      const c = await this.citiesService.findByName(name);
      if (!c) {
        throw new NotFoundException(`City with name ${name} not found`);
      }
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
    } catch (error) {
      this.logger.error(`Failed to fetch city ${name}:`, error);
      throw error;
    }
  }

  @Post()
  @ApiCreatedResponse({ type: CityResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'City already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateCityDto): Promise<CityResponseDto> {
    try {
      if (!dto || !dto.name) {
        throw new BadRequestException('City name is required');
      }
      this.logger.log(`Creating new city: ${dto.name}`);
      const c = await this.citiesService.create(dto);
      if (!c) {
        throw new Error('Failed to create city');
      }
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
    } catch (error) {
      this.logger.error('Failed to create city:', error);
      throw error;
    }
  }
}
