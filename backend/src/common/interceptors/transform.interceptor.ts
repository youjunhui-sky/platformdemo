import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If already formatted (e.g., pagination), wrap it
        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          return {
            code: 0,
            message: 'success',
            data: data.items,
            meta: {
              total: (data as any).total,
              page: (data as any).page,
              pageSize: (data as any).pageSize,
              totalPages: (data as any).totalPages,
            },
            timestamp: new Date().toISOString(),
            requestId: request.correlationId || 'unknown',
          };
        }

        return {
          code: 0,
          message: 'success',
          data,
          timestamp: new Date().toISOString(),
          requestId: request.correlationId || 'unknown',
        };
      }),
    );
  }
}
