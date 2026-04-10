import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { tap } from 'rxjs/operators';
import { AuditLog } from '../../entities/platform/audit-log.entity';
import { CryptoUtil } from '../utils/crypto';

@Injectable()
export class AuditInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async intercept(context: any, next: any) {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    if (method === 'GET' && !url.includes('/audit')) {
      return next.handle();
    }

    const startTime = Date.now();
    let responseCode = 200;
    let errorMessage: string | null = null;

    const pathParts = url.replace('/api/v1/', '').split('/');
    const module = pathParts[0] || 'unknown';
    const action = pathParts[1] || method;

    return next.handle().pipe(
      tap({
        next: (data) => {
          responseCode = 200;
          this.saveAuditLog(request, module, action, responseCode, errorMessage, startTime);
        },
        error: (err) => {
          responseCode = err.status || 500;
          errorMessage = err.message || 'Unknown error';
          this.saveAuditLog(request, module, action, responseCode, errorMessage, startTime);
        },
      }),
    );
  }

  async saveAuditLog(
    request: any,
    module: string,
    action: string,
    responseCode: number,
    errorMessage: string | null,
    startTime: number,
  ) {
    try {
      const user = request.user;
      const durationMs = Date.now() - startTime;
      const requestBody = request.body
        ? JSON.stringify(CryptoUtil.maskSensitiveData(request.body))
        : null;

      const auditLog = this.auditRepo.create({
        username: (user?.name || request.body?.username || 'anonymous') as any,
        realName: user?.realName || null,
        module,
        action: `${request.method} ${action}`,
        requestMethod: request.method,
        requestUrl: request.url,
        requestParams: request.query ? JSON.stringify(request.query) : null,
        requestBody: requestBody,
        responseCode,
        ipAddress: (request.ip || request.connection?.remoteAddress || null) as any,
        userAgent: request.get('user-agent') || null,
        durationMs,
        errorMessage,
      });

      await this.auditRepo.save(auditLog);
    } catch (err) {
      this.logger.error(`Failed to save audit log: ${err.message}`);
    }
  }
}