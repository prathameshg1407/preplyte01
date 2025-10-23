import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    this.logger.log(`Validating token for client: ${client.id}, Token: ${token ? 'Present' : 'Missing'}`);

    if (!token) {
      this.logger.error(`Client ${client.id} missing authentication token`);
      throw new WsException('Authentication token missing');
    }

    try {
      const payload = await this.authService.validateToken(token);
      this.logger.log(`Token validated for user: ${payload.sub}`);
      client.data.user = payload;
      return true;
    } catch (error) {
      this.logger.error(`Token validation failed for client ${client.id}: ${error.message}`);
      throw new WsException('Invalid token');
    }
  }
}