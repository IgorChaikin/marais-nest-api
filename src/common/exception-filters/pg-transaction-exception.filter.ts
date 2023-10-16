import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { PostgresqlService } from '../services/postgresql/postgresql.service';
import IHttpExceptionData from '../interfaces/http-exception-data.interface';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { MoyskladService } from '../services/moysklad/moysklad.service';

@Catch(HttpException)
export class PgTransactionExceptionFilter implements ExceptionFilter {
  constructor(
    private postgresqlService: PostgresqlService,
    private moyskladService: MoyskladService,
  ) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp(),
      res: FastifyReply = ctx.getResponse<FastifyReply>(),
      req = ctx.getRequest(),
      status: number = exception.getStatus(),
      message: string = exception.message;

    if (!!req.raw?.transaction) {
      await this.postgresqlService.rejectTransaction(req.raw.transaction);
    }

    const exceptionData: IHttpExceptionData = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    console.error(exceptionData);
    res.status(status).send(exceptionData);
  }
}
