import { Expose, Type } from 'class-transformer';
import { UserPreferences } from '../entities/user-preferences.entity';
import { UserRole } from '../../../common/enums/roles.enum';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  phone: string;

  @Expose()
  role: UserRole;

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
