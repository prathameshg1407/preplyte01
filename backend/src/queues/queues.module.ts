// // src/queues/queues.module.ts
// import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bull';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { SessionCleanupProcessor } from './processors/session-cleanup.processor';
// import { TokenCleanupProcessor } from './processors/token-cleanup.processor';
// import { EmailQueueProcessor } from './processors/email-queue.processor';
// import { QueuesService } from './queues.service';

// @Module({
//   imports: [
//     BullModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: async (configService: ConfigService) => ({
//         redis: {
//           host: configService.get('REDIS_HOST', 'localhost'),
//           port: configService.get('REDIS_PORT', 6379),
//           password: configService.get('REDIS_PASSWORD'),
//           db: configService.get('REDIS_QUEUE_DB', 1),
//         },
//         defaultJobOptions: {
//           removeOnComplete: 100,
//           removeOnFail: 50,
//           attempts: 3,
//           backoff: {
//             type: 'exponential',
//             delay: 2000,
//           },
//         },
//       }),
//       inject: [ConfigService],
//     }),
//     BullModule.registerQueue(
//       { name: 'session-cleanup' },
//       { name: 'token-cleanup' },
//       { name: 'email-queue' },
//       { name: 'analytics' },
//     ),
//   ],
//   providers: [
//     SessionCleanupProcessor,
//     TokenCleanupProcessor,
//     EmailQueueProcessor,
//     QueuesService,
//   ],
//   exports: [QueuesService, BullModule],
// })
// export class QueuesModule {}

