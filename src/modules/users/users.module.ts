import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { Venue } from '../venues/entities/venue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreferences, Venue])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
