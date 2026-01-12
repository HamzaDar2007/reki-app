import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Venue } from '../venues/venue.entity';

@Entity('cities')
@Index(['name', 'countryCode'], { unique: true })
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'country_code', length: 2 })
  countryCode: string;

  @Column({ length: 64, default: 'Europe/London' })
  timezone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'center_lat', type: 'numeric', precision: 9, scale: 6, nullable: true })
  centerLat?: number;

  @Column({ name: 'center_lng', type: 'numeric', precision: 9, scale: 6, nullable: true })
  centerLng?: number;

  @OneToMany(() => Venue, (venue) => venue.city)
  venues: Venue[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}