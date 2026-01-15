import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Offer } from './offer.entity';
import { Venue } from '../../venues/entities/venue.entity';

@Entity('offer_redemptions')
export class OfferRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Offer, (offer) => offer.redemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  @Index()
  offer: Offer;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  @Index()
  venue: Venue;

  @Column({ length: 32, default: 'DEMO' })
  source: string;

  @CreateDateColumn({ name: 'redeemed_at', type: 'timestamptz' })
  redeemedAt: Date;
}
