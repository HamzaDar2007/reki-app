import {
  Controller,
  Post,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  constructor(private readonly demoService: DemoService) {}

  @Post('friday-evening')
  @ApiOperation({ summary: 'Simulate Friday evening - all venues BUSY/PARTY' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async simulateFridayEvening() {
    try {
      this.logger.log('Simulating Friday evening scenario');
      return await this.demoService.simulateFridayEvening();
    } catch (error) {
      this.logger.error('Failed to simulate Friday evening:', error);
      throw new InternalServerErrorException(
        'Failed to simulate Friday evening',
      );
    }
  }

  @Post('quiet-monday')
  @ApiOperation({ summary: 'Simulate Monday morning - all venues QUIET/CHILL' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async simulateQuietMonday() {
    try {
      this.logger.log('Simulating quiet Monday scenario');
      return await this.demoService.simulateQuietMonday();
    } catch (error) {
      this.logger.error('Failed to simulate quiet Monday:', error);
      throw new InternalServerErrorException('Failed to simulate quiet Monday');
    }
  }

  @Post('mixed-busyness')
  @ApiOperation({ summary: 'Simulate mixed venue states for variety' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async simulateMixedBusyness() {
    try {
      this.logger.log('Simulating mixed busyness scenario');
      return await this.demoService.simulateMixedBusyness();
    } catch (error) {
      this.logger.error('Failed to simulate mixed busyness:', error);
      throw new InternalServerErrorException(
        'Failed to simulate mixed busyness',
      );
    }
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all venues to default state' })
  @ApiResponse({ status: 200, description: 'Demo reset successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resetDemo() {
    try {
      this.logger.log('Resetting demo to default state');
      return await this.demoService.resetToDefault();
    } catch (error) {
      this.logger.error('Failed to reset demo:', error);
      throw new InternalServerErrorException('Failed to reset demo');
    }
  }
}
