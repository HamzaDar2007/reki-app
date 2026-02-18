import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { InternalServerErrorException } from '@nestjs/common';

@ApiTags('health')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({ summary: 'API health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getHello(): { status: string; message: string } {
    try {
      this.logger.log('Health check requested');
      return this.appService.getHealth();
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Health check failed');
    }
  }

  @Get('/health')
  @ApiOperation({ summary: 'Detailed health status' })
  @ApiResponse({ status: 200, description: 'Full health information' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getHealthStatus(): {
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    environment: string;
  } {
    try {
      this.logger.log('Detailed health check requested');
      return this.appService.getHealthStatus();
    } catch (error) {
      this.logger.error('Detailed health check failed', error);
      throw new InternalServerErrorException('Detailed health check failed');
    }
  }
}
