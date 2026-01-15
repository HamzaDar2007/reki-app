import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('friday-evening')
  @ApiOperation({ summary: 'Simulate Friday evening - all venues BUSY/PARTY' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  async simulateFridayEvening() {
    return this.demoService.simulateFridayEvening();
  }

  @Post('quiet-monday')
  @ApiOperation({ summary: 'Simulate Monday morning - all venues QUIET/CHILL' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  async simulateQuietMonday() {
    return this.demoService.simulateQuietMonday();
  }

  @Post('mixed-busyness')
  @ApiOperation({ summary: 'Simulate mixed venue states for variety' })
  @ApiResponse({ status: 200, description: 'Simulation applied successfully' })
  async simulateMixedBusyness() {
    return this.demoService.simulateMixedBusyness();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all venues to default state' })
  @ApiResponse({ status: 200, description: 'Demo reset successfully' })
  async resetDemo() {
    return this.demoService.resetToDefault();
  }
}
