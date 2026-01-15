import { IsUUID, IsOptional, IsString, Length } from 'class-validator';

export class RedeemOfferDto {
  @IsUUID()
  offerId: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  source?: string; // DEMO, INVESTOR, INTERNAL, etc.
}
