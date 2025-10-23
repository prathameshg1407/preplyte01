import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MockDriveAttemptService } from './mock-drive-attempt.service';

@Injectable()
export class MockDriveTasksService {
  private readonly logger = new Logger(MockDriveTasksService.name);

  constructor(
    private readonly attemptService: MockDriveAttemptService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkExpiredAttempts() {
    try {
      await this.attemptService.expireOldAttempts();
    } catch (error) {
      this.logger.error('Failed to expire old attempts:', error);
    }
  }
}