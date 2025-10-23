import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health') // This will create the route /health
export class HealthController {
  @Get('ping') // This will create the sub-route /health/ping
  check() {
    return {
      status: 'ok',
      message: 'Hello from the NestJS server!',
      timestamp: new Date().toISOString(),
    };
  }
}