import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Offer } from './offer.entity';
import { Venue } from '../venues/venue.entity';

@Entity('offer_redemptions')
export class OfferRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Offer, { onDelete: 'CASCADE' })
  offer: Offer;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  venue: Venue;

  @Column({ length: 32, default: 'DEMO' })
  source: string;

  @CreateDateColumn({ name: 'redeemed_at', type: 'timestamptz' })
  redeemedAt: Date;
}