import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '[Public] Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async register(@Body() dto: RegisterDto) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }
      if (dto.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }
      this.logger.log(`Registration attempt for email: ${dto.email}`);
      const result = await this.authService.register(dto);
      this.logger.log(`User registered successfully: ${dto.email}`);
      return result;
    } catch (error) {
      // Handle duplicate email error with user-friendly message
      if ((error as any)?.code === '23505' || (error as any)?.status === 409) {
        this.logger.warn(`Registration failed - duplicate email: ${dto.email}`);
        throw new ConflictException(
          'This email address is already registered. Please use a different email or try logging in.',
        );
      }

      this.logger.error(`Registration failed for ${dto.email}:`, error);
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: '[Public] User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT tokens',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(@Body() dto: LoginDto) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }
      this.logger.log(`Login attempt for email: ${dto.email}`);
      const user = await this.usersService.login(dto);
      return this.authService.login(user);
    } catch (error) {
      this.logger.error(`Login failed:`, error);
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '[Public] Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token provided' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      if (!dto.refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }
      this.logger.log('Token refresh requested');
      return await this.authService.refreshToken(dto.refreshToken);
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: '[Public] Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      if (!dto.email) {
        throw new BadRequestException('Email is required');
      }
      this.logger.log(`Password reset requested for: ${dto.email}`);
      return await this.authService.forgotPassword(dto.email);
    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      throw error;
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: '[Public] Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      if (!dto.token || !dto.newPassword) {
        throw new BadRequestException('Token and new password are required');
      }
      this.logger.log('Password reset initiated');
      return await this.authService.resetPassword(dto.token, dto.newPassword);
    } catch (error) {
      this.logger.error('Password reset failed:', error);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Customer] Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async logout(@Request() req) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token || !req.user?.id) {
        throw new UnauthorizedException('Invalid token');
      }
      this.logger.log(`Logout for user: ${req.user.id}`);
      return await this.authService.logout(req.user.id, token);
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Customer] Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid old password',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!dto.oldPassword || !dto.newPassword) {
        throw new BadRequestException('Old and new passwords are required');
      }
      this.logger.log(`Password change for user: ${req.user.id}`);
      return await this.authService.changePassword(req.user.id, dto);
    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Customer] Get current user info' })
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMe(@Request() req) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      this.logger.log(`Fetching user info for: ${req.user.id}`);
      const user = await this.usersService.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const {
        passwordHash,
        refreshToken,
        passwordResetToken,
        passwordResetExpires,
        ...result
      } = user;
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch current user:', error);
      throw error;
    }
  }
}
