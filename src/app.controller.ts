import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({ summary: 'API health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): { status: string; message: string } {
    return this.appService.getHealth();
  }

  @Get('/health')
  @ApiOperation({ summary: 'Detailed health status' })
  @ApiResponse({ status: 200, description: 'Full health information' })
  getHealthStatus(): {
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    environment: string;
  } {
    return this.appService.getHealthStatus();
  }
}
