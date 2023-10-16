import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PostgresqlService } from '../services/postgresql/postgresql.service';

@Injectable()
export class PgTransactionInterceptor implements NestInterceptor {
  constructor(private postgresqlService: PostgresqlService) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async () => {
        const { transaction } = req.raw;
        !!transaction &&
          (await this.postgresqlService.resolveTransaction(transaction));
      }),
    );
  }
}
