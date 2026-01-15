import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      metadata,
    });
    return this.notificationRepo.save(notification);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepo.update(id, { isRead: true });
  }

  async notifyAll(
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any,
  ): Promise<void> {
    // For demo purposes, we fetch all active users using the manager
    const users = await this.notificationRepo.manager.query(
      'SELECT id FROM users WHERE "isActive" = true',
    );

    for (const user of users) {
      await this.create(
        user.id,
        title,
        message,
        type,
        metadata as Record<string, any>,
      );
    }
  }
}
