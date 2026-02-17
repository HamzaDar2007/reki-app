import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserPreferences } from './user-preferences.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetExpires?: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => UserPreferences, { cascade: true })
  @JoinColumn()
  preferences: UserPreferences;

  @OneToMany(() => Venue, (venue) => venue.owner)
  venues: Venue[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
