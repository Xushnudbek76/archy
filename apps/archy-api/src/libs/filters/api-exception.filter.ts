import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const publicErrors: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'Invalid request' },
  401: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  403: { code: 'FORBIDDEN', message: 'Access denied' },
  404: { code: 'NOT_FOUND', message: 'Resource not found' },
  409: {
    code: 'CONFLICT',
    message: 'Request conflicts with the current state',
  },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Request payload is too large' },
  415: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Unsupported request format',
  },
  429: { code: 'RATE_LIMITED', message: 'Too many requests' },
};

function httpStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();

  // Express parsers use http-errors rather than Nest's HttpException.
  if (
    exception instanceof Error &&
    'status' in exception &&
    'statusCode' in exception &&
    'expose' in exception &&
    typeof exception.expose === 'boolean' &&
    typeof exception.status === 'number' &&
    Number.isInteger(exception.status) &&
    exception.status >= 400 &&
    exception.status <= 599 &&
    exception.statusCode === exception.status
  )
    return exception.status;

  return 500;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = httpStatus(exception);
    const requestId = response.getHeader('x-request-id');
    const error = publicErrors[status] ?? {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
    if (status >= 500)
      this.logger.error({ event: 'request_failed', status, requestId });
    response.status(status).json({ ...error, requestId });
  }
}
