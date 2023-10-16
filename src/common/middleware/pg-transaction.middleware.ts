import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { PostgresqlService } from '../services/postgresql/postgresql.service';

@Injectable()
export class PgTransactionMiddleware implements NestMiddleware {
  constructor(private postgresqlService: PostgresqlService) {}

  async use(req, res: FastifyReply['raw'], next: () => void) {
    req.transaction = await this.postgresqlService.getTransaction();
    next();
  }
}
