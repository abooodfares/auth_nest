import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // لو كان HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let extractedMessage =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;

      // لو array (مثل validation errors)
      if (Array.isArray(extractedMessage)) {
        extractedMessage = extractedMessage.join(', ');
      }

      message = isProduction ? 'Something went wrong' : extractedMessage;
    } 
    
    // لو كان Error عادي
    else if (exception instanceof Error) {
      const extractedMessage = exception.message;

      message = isProduction ? 'Something went wrong' : extractedMessage;
    }

    const errorResponse: ApiResponse = {
      success: false,
      statusCode: status,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
