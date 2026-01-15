import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { CreateCityDto } from './dto/create-city.dto';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  async create(dto: CreateCityDto): Promise<City> {
    const city = this.cityRepo.create(dto);
    return this.cityRepo.save(city);
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
