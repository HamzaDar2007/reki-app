import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  getHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'REKI MVP API is running',
    };
  }

  getHealthStatus(): {
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    environment: string;
  } {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
