// // src/common/filters/http-exception.filter.ts
// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   HttpStatus,
//   Logger,
// } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// interface ErrorResponse {
//   statusCode: number;
//   timestamp: string;
//   path: string;
//   method: string;
//   message: string | string[];
//   error?: string;
//   stack?: string;
//   requestId?: string;
// }

// @Catch()
// export class AllExceptionsFilter implements ExceptionFilter {
//   private readonly logger = new Logger(AllExceptionsFilter.name);

//   constructor(private readonly configService: ConfigService) {}

//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     const errorResponse = this.handleException(exception, request);

//     // Log error
//     this.logError(exception, request, errorResponse);

//     // Send response
//     response.status(errorResponse.statusCode).json(errorResponse);
//   }

//   private handleException(exception: unknown, request: Request): ErrorResponse {
//     const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
//     const timestamp = new Date().toISOString();
//     const path = request.url;
//     const method = request.method;
//     const requestId = request.headers['x-request-id'] as string;

//     // HTTP Exception
//     if (exception instanceof HttpException) {
//       const status = exception.getStatus();
//       const exceptionResponse = exception.getResponse();

//       return {
//         statusCode: status,
//         timestamp,
//         path,
//         method,
//         message: this.extractMessage(exceptionResponse),
//         error: exception.name,
//         ...(isDevelopment && { stack: exception.stack }),
//         requestId,
//       };
//     }

//     // Prisma Errors
//     if (exception instanceof PrismaClientKnownRequestError) {
//       return this.handlePrismaError(exception, timestamp, path, method, requestId, isDevelopment);
//     }

//     // Validation Errors
//     if (this.isValidationError(exception)) {
//       return {
//         statusCode: HttpStatus.BAD_REQUEST,
//         timestamp,
//         path,
//         method,
//         message: this.extractValidationMessages(exception),
//         error: 'Validation Error',
//         requestId,
//       };
//     }

//     // Unknown Error
//     return {
//       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//       timestamp,
//       path,
//       method,
//       message: isDevelopment
//         ? (exception as Error)?.message || 'Internal server error'
//         : 'Internal server error',
//       error: 'Internal Server Error',
//       ...(isDevelopment && { stack: (exception as Error)?.stack }),
//       requestId,
//     };
//   }

//   private handlePrismaError(
//     exception: PrismaClientKnownRequestError,
//     timestamp: string,
//     path: string,
//     method: string,
//     requestId: string,
//     isDevelopment: boolean,
//   ): ErrorResponse {
//     const baseResponse = {
//       timestamp,
//       path,
//       method,
//       requestId,
//       ...(isDevelopment && { stack: exception.stack }),
//     };

//     switch (exception.code) {
//       case 'P2002':
//         return {
//           ...baseResponse,
//           statusCode: HttpStatus.CONFLICT,
//           message: 'A record with this value already exists',
//           error: 'Unique Constraint Violation',
//         };

//       case 'P2025':
//         return {
//           ...baseResponse,
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Record not found',
//           error: 'Not Found',
//         };

//       case 'P2003':
//         return {
//           ...baseResponse,
//           statusCode: HttpStatus.BAD_REQUEST,
//           message: 'Foreign key constraint failed',
//           error: 'Bad Request',
//         };

//       case 'P2014':
//         return {
//           ...baseResponse,
//           statusCode: HttpStatus.BAD_REQUEST,
//           message: 'Invalid relation',
//           error: 'Bad Request',
//         };

//       default:
//         return {
//           ...baseResponse,
//           statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//           message: isDevelopment ? exception.message : 'Database error occurred',
//           error: 'Database Error',
//         };
//     }
//   }

//   private extractMessage(exceptionResponse: string | object): string | string[] {
//     if (typeof exceptionResponse === 'string') {
//       return exceptionResponse;
//     }

//     if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
//       if ('message' in exceptionResponse) {
//         return (exceptionResponse as any).message;
//       }
//       if ('error' in exceptionResponse) {
//         return (exceptionResponse as any).error;
//       }
//     }

//     return 'An error occurred';
//   }

//   private isValidationError(exception: unknown): boolean {
//     return (
//       exception instanceof Error &&
//       (exception.name === 'ValidationError' ||
//         exception.message.includes('validation'))
//     );
//   }

//   private extractValidationMessages(exception: unknown): string[] {
//     const error = exception as any;
//     if (error.errors && Array.isArray(error.errors)) {
//       return error.errors.map((e: any) => e.message || e);
//     }
//     return [error.message || 'Validation failed'];
//   }

//   private logError(exception: unknown, request: Request, errorResponse: ErrorResponse) {
//     const { statusCode, message, error, requestId } = errorResponse;
//     const { method, url, ip, headers } = request;

//     const logContext = {
//       statusCode,
//       method,
//       url,
//       ip,
//       userAgent: headers['user-agent'],
//       requestId,
//       error,
//       message,
//     };

//     if (statusCode >= 500) {
//       this.logger.error(
//         `Internal Server Error: ${JSON.stringify(logContext)}`,
//         exception instanceof Error ? exception.stack : undefined,
//       );
//     } else if (statusCode >= 400) {
//       this.logger.warn(`Client Error: ${JSON.stringify(logContext)}`);
//     }
//   }
// }

// // src/common/filters/ws-exception.filter.ts
// import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
// import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

// @Catch()
// export class WsExceptionFilter extends BaseWsExceptionFilter {
//   private readonly logger = new Logger(WsExceptionFilter.name);

//   catch(exception: unknown, host: ArgumentsHost) {
//     const client = host.switchToWs().getClient();
//     const error = exception instanceof WsException ? exception.getError() : exception;

//     this.logger.error('WebSocket error:', error);

//     client.emit('error', {
//       event: 'error',
//       data: {
//         message: error instanceof Error ? error.message : 'An error occurred',
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }
// }