import { Controller, Get, Patch, Delete, Param, UseGuards, Post, Body } from '@nestjs/common';
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
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getMyNotifications(@GetUser() user: User) {
    return this.notificationsService.findByUser(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@GetUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true, message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return { success: true, message: 'Notification deleted' };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test notification creation' })
  @ApiResponse({ status: 200, description: 'Test notification created' })
  async testNotification(@GetUser() user: User) {
    await this.notificationsService.create(
      user.id,
      'Test Notification',
      'This is a test notification',
      'SYSTEM' as any,
      { test: true },
    );
    return { success: true, message: 'Test notification created' };
  }
}

