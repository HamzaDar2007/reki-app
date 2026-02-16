import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { City } from '../../cities/entities/city.entity';
import { User } from '../../users/entities/user.entity';
import { VenueLiveState } from './venue-live-state.entity';
import { VenueVibeSchedule } from './venue-vibe-schedule.entity';
import { Offer } from '../../offers/entities/offer.entity';

export enum VenueCategory {
  BAR = 'BAR',
  CLUB = 'CLUB',
  RESTAURANT = 'RESTAURANT',
  CASINO = 'CASINO',
}

@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => City, (city) => city.venues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  @Index()
  city: City;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'enum', enum: VenueCategory })
  @Index()
  category: VenueCategory;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 32, nullable: true })
  postcode?: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  lat?: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  lng?: number;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;

  @Column({ name: 'gallery_images', type: 'text', array: true, nullable: true })
  galleryImages?: string[];

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToOne(() => VenueLiveState, (state) => state.venue)
  liveState: VenueLiveState;

  @OneToMany(() => VenueVibeSchedule, (schedule) => schedule.venue)
  vibeSchedules: VenueVibeSchedule[];

  @OneToMany(() => Offer, (offer) => offer.venue)
  offers: Offer[];

  @ManyToOne(() => User, (user) => user.venues, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'owner_id' })
  @Index()
  owner: User;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
