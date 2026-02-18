import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Post,
  Body,
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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMyNotifications(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Fetching notifications for user: ${user.id}`);
      return await this.notificationsService.findByUser(user.id);
    } catch (error) {
      this.logger.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUnreadCount(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Fetching unread count for user: ${user.id}`);
      const count = await this.notificationsService.getUnreadCount(user.id);
      return { count: count || 0 };
    } catch (error) {
      this.logger.error('Failed to fetch unread count:', error);
      throw error;
    }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  @ApiResponse({ status: 400, description: 'Invalid notification ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAsRead(@Param('id') id: string) {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Notification ID is required');
      }
      this.logger.log(`Marking notification as read: ${id}`);
      await this.notificationsService.markAsRead(id);
      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      this.logger.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAllAsRead(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Marking all notifications as read for user: ${user.id}`);
      await this.notificationsService.markAllAsRead(user.id);
      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 400, description: 'Invalid notification ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteNotification(@Param('id') id: string) {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Notification ID is required');
      }
      this.logger.log(`Deleting notification: ${id}`);
      await this.notificationsService.deleteNotification(id);
      return {
        success: true,
        message: 'Notification deleted',
      };
    } catch (error) {
      this.logger.error(`Failed to delete notification ${id}:`, error);
      throw error;
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test notification creation' })
  @ApiResponse({ status: 200, description: 'Test notification created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async testNotification(@GetUser() user: User) {
    try {
      if (!user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Creating test notification for user: ${user.id}`);
      await this.notificationsService.create(
        user.id,
        'Test Notification',
        'This is a test notification',
        'SYSTEM' as any,
        { test: true },
      );
      return {
        success: true,
        message: 'Test notification created',
      };
    } catch (error) {
      this.logger.error('Failed to create test notification:', error);
      throw error;
    }
  }
}
