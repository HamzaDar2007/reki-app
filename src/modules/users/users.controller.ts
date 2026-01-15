import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'JWT token' })
  async login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.login(dto);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getProfile(@GetUser() user: User): Promise<UserResponseDto> {
    const fullUser = await this.usersService.findById(user.id);
    return {
      id: fullUser.id,
      email: fullUser.email,
      isActive: fullUser.isActive,
      preferences: fullUser.preferences,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200 })
  async updatePreferences(
    @GetUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    return this.usersService.updatePreferences(user.id, dto);
  }
}
