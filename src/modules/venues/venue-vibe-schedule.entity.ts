import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Venue } from './venue.entity';
import { VibeType } from './venue-live-state.entity';

@Entity('venue_vibe_schedule')
@Index(['venue', 'dayOfWeek'])
export class VenueVibeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venue, (venue) => venue.vibeSchedules, { onDelete: 'CASCADE' })
  venue: Venue;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: VibeType })
  vibe: VibeType;

  @Column({ default: 0 })
  priority: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}