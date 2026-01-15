import { Expose, Type } from 'class-transformer';
import { UserPreferences } from '../entities/user-preferences.entity';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => UserPreferences)
  preferences: UserPreferences;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}