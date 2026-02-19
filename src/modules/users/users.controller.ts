import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { VenueResponseDto } from '../venues/dto/venue-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updatePreferences(
    @GetUser() user: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!dto) {
        throw new BadRequestException('Invalid preferences data');
      }
      this.logger.log(`Updating preferences for user: ${user.id}`);
      return await this.usersService.updatePreferences(user.id, dto);
    } catch (error) {
      this.logger.error('Failed to update preferences:', error);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<UserResponseDto[]> {
    try {
      this.logger.log('Fetching all users');
      const users = await this.usersService.findAll();
      if (!users) {
        return [];
      }
      return users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch all users:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('User ID is required');
      }
      this.logger.log(`Fetching user by ID: ${id}`);
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('User ID is required');
      }
      if (!dto) {
        throw new BadRequestException('Update data is required');
      }
      this.logger.log(`Updating user: ${id}`);
      const user = await this.usersService.update(id, dto);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('User ID is required');
      }
      this.logger.log(`Deleting user: ${id}`);
      await this.usersService.delete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/venues')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all venues owned by a user' })
  @ApiResponse({ status: 200, type: [VenueResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserVenues(@Param('id') userId: string): Promise<VenueResponseDto[]> {
    try {
      if (!userId || userId.trim() === '') {
        throw new BadRequestException('User ID is required');
      }
      this.logger.log(`Fetching venues for user: ${userId}`);
      const venues = await this.usersService.findVenuesByUserId(userId);

      if (!venues) {
        return [];
      }

      return venues.map((v) => {
        const activeOffersCount = (v.offers || []).filter(
          (o) => o.isActive,
        ).length;

        return {
          id: v.id,
          name: v.name,
          category: v.category,
          address: v.address,
          postcode: v.postcode,
          lat: v.lat ? Number(v.lat) : undefined,
          lng: v.lng ? Number(v.lng) : undefined,
          coverImageUrl: v.coverImageUrl,
          galleryImages: v.galleryImages,
          logoUrl: v.logoUrl,
          description: v.description,
          isActive: v.isActive,
          ownerId: v.ownerId,
          busyness: v.liveState?.busyness,
          vibe: v.liveState?.vibe,
          busynessUpdatedAt: v.liveState?.busynessUpdatedAt,
          vibeUpdatedAt: v.liveState?.vibeUpdatedAt,
          activeOffersCount,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch venues for user ${userId}:`, error);
      throw error;
    }
  }
}
