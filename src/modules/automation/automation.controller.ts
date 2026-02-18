import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(AutomationController.name);

  constructor(private readonly automationService: AutomationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get automation status' })
  @ApiResponse({ status: 200, description: 'Automation status' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatus() {
    try {
      this.logger.log('Fetching automation status');
      return await this.automationService.getAutomationStatus();
    } catch (error) {
      this.logger.error('Failed to fetch automation status:', error);
      throw new InternalServerErrorException(
        'Failed to fetch automation status',
      );
    }
  }

  @Post('demo/scenario')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger demo scenario (for testing)' })
  @ApiResponse({ status: 200, description: 'Demo scenario triggered' })
  @ApiResponse({ status: 400, description: 'Invalid scenario type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async triggerDemo(
    @Body()
    body: {
      scenario: 'quiet_to_busy' | 'busy_to_quiet' | 'vibe_shift';
    },
  ) {
    try {
      if (!body || !body.scenario) {
        throw new BadRequestException('Scenario is required');
      }
      const validScenarios = ['quiet_to_busy', 'busy_to_quiet', 'vibe_shift'];
      if (!validScenarios.includes(body.scenario)) {
        throw new BadRequestException(
          `Invalid scenario. Valid options: ${validScenarios.join(', ')}`,
        );
      }
      this.logger.log(`Triggering demo scenario: ${body.scenario}`);
      return await this.automationService.triggerDemoScenario(body.scenario);
    } catch (error) {
      this.logger.error('Failed to trigger demo scenario:', error);
      throw error;
    }
  }

  @Post('update-vibes')
  @ApiOperation({ summary: 'Manually trigger vibe schedule update' })
  @ApiResponse({ status: 200, description: 'Vibes updated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateVibes() {
    try {
      this.logger.log('Triggering vibe schedule update');
      await this.automationService.updateVibesFromSchedules();
      return { message: 'Vibe update triggered successfully' };
    } catch (error) {
      this.logger.error('Failed to update vibes:', error);
      throw new InternalServerErrorException('Failed to update vibes');
    }
  }

  @Post('update-busyness')
  @ApiOperation({ summary: 'Manually trigger busyness simulation' })
  @ApiResponse({ status: 200, description: 'Busyness updated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateBusyness() {
    try {
      this.logger.log('Triggering busyness simulation');
      await this.automationService.simulateBusynessChanges();
      return { message: 'Busyness simulation triggered successfully' };
    } catch (error) {
      this.logger.error('Failed to simulate busyness:', error);
      throw new InternalServerErrorException('Failed to simulate busyness');
    }
  }
}
