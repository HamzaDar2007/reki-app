import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get automation status' })
  @ApiResponse({ status: 200, description: 'Automation status' })
  async getStatus() {
    return this.automationService.getAutomationStatus();
  }

  @Post('demo/scenario')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger demo scenario (for testing)' })
  @ApiResponse({ status: 200, description: 'Demo scenario triggered' })
  async triggerDemo(
    @Body()
    body: {
      scenario: 'quiet_to_busy' | 'busy_to_quiet' | 'vibe_shift';
    },
  ) {
    return this.automationService.triggerDemoScenario(body.scenario);
  }

  @Post('update-vibes')
  @ApiOperation({ summary: 'Manually trigger vibe schedule update' })
  @ApiResponse({ status: 200, description: 'Vibes updated' })
  async updateVibes() {
    await this.automationService.updateVibesFromSchedules();
    return { message: 'Vibe update triggered' };
  }

  @Post('update-busyness')
  @ApiOperation({ summary: 'Manually trigger busyness simulation' })
  @ApiResponse({ status: 200, description: 'Busyness updated' })
  async updateBusyness() {
    await this.automationService.simulateBusynessChanges();
    return { message: 'Busyness simulation triggered' };
  }
}
