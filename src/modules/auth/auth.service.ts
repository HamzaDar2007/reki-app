import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly prefsRepo: Repository<UserPreferences>,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash: hash,
    });

    const savedUser = await this.userRepo.save(user);

    // Create default preferences for new user
    const prefs = this.prefsRepo.create({ user: savedUser });
    await this.prefsRepo.save(prefs);

    const tokens = await this.generateTokens(savedUser);

    // Save refresh token
    savedUser.refreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.userRepo.save(savedUser);

    return {
      user: savedUser,
      ...tokens,
    };
  }

  async login(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokens = await this.generateTokens(user);

    // Save refresh token
    user.refreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.userRepo.save(user);

    return tokens;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      // Update refresh token
      user.refreshToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.userRepo.save(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Explicitly set refreshToken to null to invalidate all sessions
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken: () => 'NULL' })
      .where('id = :id', { id: userId })
      .execute();
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepo.save(user);

    // In a real app, send email with resetToken
    // For now, we'll log it (in production, never log this!)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let targetUser: User | null = null;

    for (const user of await this.userRepo.find()) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (
          isValid &&
          user.passwordResetExpires &&
          user.passwordResetExpires > new Date()
        ) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Update password
    targetUser.passwordHash = await bcrypt.hash(newPassword, 10);
    targetUser.passwordResetToken = undefined;
    targetUser.passwordResetExpires = undefined;
    targetUser.refreshToken = undefined; // Invalidate all sessions
    await this.userRepo.save(targetUser);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.refreshToken = undefined; // Invalidate all sessions
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
