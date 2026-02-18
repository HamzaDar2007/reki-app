import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { CreateCityDto } from './dto/create-city.dto';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  async create(dto: CreateCityDto): Promise<City> {
    try {
      // Check for existing city with same name and country code
      const existing = await this.cityRepo.findOne({
        where: { name: dto.name, countryCode: dto.countryCode },
      });

      if (existing) {
        throw new ConflictException(
          `City "${dto.name}" in ${dto.countryCode} already exists`,
        );
      }

      const city = this.cityRepo.create(dto);
      const savedCity = await this.cityRepo.save(city);
      this.logger.log(
        `City created: ${savedCity.name} (${savedCity.countryCode})`,
      );
      return savedCity;
    } catch (error) {
      if ((error as any).status === 409) {
        throw error;
      }
      this.logger.error(`Failed to create city: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<City[]> {
    return this.cityRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<City> {
    const city = await this.cityRepo.findOne({
      where: { id, isActive: true },
      relations: ['venues'],
    });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async findByName(name: string, countryCode?: string): Promise<City> {
    const where: Record<string, any> = { name, isActive: true };
    if (countryCode) where.countryCode = countryCode;

    const city = await this.cityRepo.findOne({ where });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }
}
