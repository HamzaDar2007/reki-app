import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VenuesService } from '../../modules/venues/venues.service';
import { UserRole } from '../enums/roles.enum';

@Injectable()
export class VenueOwnershipGuard implements CanActivate {
  constructor(private venuesService: VenuesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const venueId = request.params.id || request.params.venueId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can access any venue
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Business users can only access their own venues
    if (user.role === UserRole.BUSINESS) {
      const venue = await this.venuesService.findById(venueId);
      
      if (!venue) {
        throw new ForbiddenException('Venue not found');
      }

      if (venue.ownerId !== user.id) {
        throw new ForbiddenException('You do not own this venue');
      }

      return true;
    }

    // Regular users cannot access business operations
    throw new ForbiddenException('Insufficient permissions');
  }
}
