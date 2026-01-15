import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Venue } from '../../venues/entities/venue.entity';
import { BusynessLevel } from '../../venues/entities/venue-live-state.entity';
import { OfferRedemption } from './offer-redemption.entity';

export enum OfferType {
  PERCENT_OFF = 'PERCENT_OFF',
  BOGO = 'BOGO',
  FREE_ITEM = 'FREE_ITEM',
  HAPPY_HOUR = 'HAPPY_HOUR',
  ENTRY_DEAL = 'ENTRY_DEAL',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venue, (venue) => venue.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  @Index()
  venue: Venue;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'offer_type', type: 'enum', enum: OfferType })
  offerType: OfferType;

  @Column({
    name: 'min_busyness',
    type: 'enum',
    enum: BusynessLevel,
    default: BusynessLevel.QUIET,
  })
  minBusyness: BusynessLevel;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  @Index()
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  @Index()
  endsAt: Date;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

  @Column({ name: 'redeem_count', default: 0 })
  redeemCount: number;

  @OneToMany(() => OfferRedemption, (redemption) => redemption.offer)
  redemptions: OfferRedemption[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
