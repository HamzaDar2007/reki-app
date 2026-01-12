import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Venue } from './venue.entity';

export enum BusynessLevel {
  QUIET = 'QUIET',
  MODERATE = 'MODERATE',
  BUSY = 'BUSY',
}

export enum VibeType {
  CHILL = 'CHILL',
  SOCIAL = 'SOCIAL',
  PARTY = 'PARTY',
  ROMANTIC = 'ROMANTIC',
  LATE_NIGHT = 'LATE_NIGHT',
}

@Entity('venue_live_state')
export class VenueLiveState {
  @PrimaryColumn('uuid', { name: 'venue_id' })
  venueId: string;

  @OneToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ type: 'enum', enum: BusynessLevel, default: BusynessLevel.QUIET })
  busyness: BusynessLevel;

  @Column({ type: 'enum', enum: VibeType, default: VibeType.CHILL })
  vibe: VibeType;

  @Column({ name: 'busyness_updated_at', type: 'timestamptz', default: () => 'now()' })
  busynessUpdatedAt: Date;

  @Column({ name: 'vibe_updated_at', type: 'timestamptz', default: () => 'now()' })
  vibeUpdatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}