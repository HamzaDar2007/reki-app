import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { VenueCategory } from '../../venues/entities/venue.entity';
import { BusynessLevel, VibeType } from '../../venues/entities/venue-live-state.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'simple-array', nullable: true })
  preferredCategories: VenueCategory[];

  @Column({ type: 'enum', enum: BusynessLevel, nullable: true })
  minBusyness: BusynessLevel;

  @Column({ type: 'simple-array', nullable: true })
  preferredVibes: VibeType[];

  @Column({ name: 'notifications_enabled', default: true })
  notificationsEnabled: boolean;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'offer_notifications', default: true })
  offerNotifications: boolean;

  @Column({ name: 'busyness_notifications', default: false })
  busynessNotifications: boolean;
}