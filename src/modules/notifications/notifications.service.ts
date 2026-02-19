import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    // Initialize email transporter
    const emailEnabled = this.configService.get('NOTIFICATION_ENABLED');
    if (emailEnabled === 'true') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
      });
    }
  }

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

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(id: string): Promise<void> {
    await this.notificationRepo.delete(id);
  }

  async notifyOfferAvailable(
    offerId: string,
    venueId: string,
    venueName: string,
    offerTitle: string,
    offerDescription: string,
  ): Promise<void> {
    try {
      this.logger.log(`=== NOTIFY OFFER AVAILABLE CALLED ===`);
      this.logger.log(`Offer: ${offerTitle} at ${venueName}`);

      const users = await this.userRepo.find({
        where: { isActive: true },
        relations: ['preferences'],
      });

      this.logger.log(`Found ${users.length} active users`);

      // For now, notify ALL active users (simplified for debugging)
      for (const user of users) {
        this.logger.log(`Creating notification for user: ${user.id}`);

        await this.create(
          user.id,
          `New Offer at ${venueName}`,
          offerDescription,
          NotificationType.OFFER_AVAILABLE,
          { offerId, venueId, venueName },
        );

        this.logger.log(`Notification created for user: ${user.id}`);
      }

      this.logger.log(`Completed notifying ${users.length} users`);
    } catch (error) {
      this.logger.error(
        `Failed to notify users about offer ${offerId}: ${error.message}`,
      );
      this.logger.error(error.stack);
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email transporter not configured');
        return;
      }

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Password Reset - REKI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #777; line-height: 1.6;">You requested to reset your password. Use the token below:</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <code style="font-size: 16px; color: #333;">${resetToken}</code>
            </div>
            <p style="color: #777; line-height: 1.6;">This token will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error.message}`,
      );
      throw error;
    }
  }

  private async sendOfferEmail(
    email: string,
    venueName: string,
    offerTitle: string,
    offerDescription: string,
  ): Promise<void> {
    try {
      if (!this.transporter) {
        return;
      }

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: `New Offer at ${venueName} - REKI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Offer Available!</h2>
            <h3 style="color: #555;">${venueName}</h3>
            <h4 style="color: #666;">${offerTitle}</h4>
            <p style="color: #777; line-height: 1.6;">${offerDescription}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This is an automated notification from REKI. 
              You can manage your notification preferences in the app.
            </p>
          </div>
        `,
      });

      this.logger.log(`Offer email sent to ${email}`);
    } catch (error) {
      this.logger.warn(`Failed to send email to ${email}: ${error.message}`);
    }
  }

  async notifyBusynessChange(
    venueId: string,
    venueName: string,
    newBusyness: string,
  ): Promise<void> {
    try {
      const users = await this.userRepo.find({
        where: {
          isActive: true,
          preferences: {
            notificationsEnabled: true,
            busynessNotifications: true,
          },
        },
        relations: ['preferences'],
      });

      for (const user of users) {
        await this.create(
          user.id,
          `${venueName} is now ${newBusyness}`,
          `The crowd level at ${venueName} has changed to ${newBusyness}`,
          NotificationType.BUSYNESS_UPDATE,
          { venueId, venueName, busyness: newBusyness },
        );
      }

      this.logger.log(
        `Notified ${users.length} users about busyness change at ${venueName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to notify busyness change: ${error.message}`);
    }
  }
}
