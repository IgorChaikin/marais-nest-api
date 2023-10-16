import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  parseExtractDataValues,
  parseRemapProps,
  parseRemoveMeta,
} from '../../../utils/payload-parsers';

@Injectable()
export class ParseAccountInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (!response) {
          return response;
        }
        const { msAccount, pgAccount } = response;

        return parseRemapProps(
          {
            ...parseRemoveMeta(msAccount),
            ...parseExtractDataValues(pgAccount),
          },
          {
            first_name: 'legalTitle',
            'shipping.address1': 'actualAddress',
            'shipping.city': 'shipping.city.name',
            'shipping.state': 'shipping.state.name',
            shipping: null,
            password: null,
            password_reset_key: null,
          },
        );
      }),
    );
  }
}
