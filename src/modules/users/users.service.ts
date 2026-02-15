import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefsRepo: Repository<UserPreferences>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash: hash,
    });

    const savedUser = await this.userRepo.save(user);

    // Create default preferences
    const prefs = this.prefsRepo.create({ user: savedUser });
    await this.prefsRepo.save(prefs);

    const createdUser = await this.userRepo.findOne({
      where: { id: savedUser.id },
      relations: ['preferences'],
    });
    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }
    return createdUser;
  }

  async login(dto: LoginDto): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['preferences'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['preferences'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    const prefs = await this.prefsRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!prefs) throw new Error('Preferences not found');

    Object.assign(prefs, dto);
    return this.prefsRepo.save(prefs);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['preferences'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email already exists');
      user.email = dto.email;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    return this.userRepo.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepo.remove(user);
  }
}
