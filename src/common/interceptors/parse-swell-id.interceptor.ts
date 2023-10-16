import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parseRemapProps } from '../../../utils/payload-parsers';

@Injectable()
export class ParseSwellIdInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const reqProp = req.method === 'GET' ? 'query' : 'body';
    req[reqProp] = parseRemapProps(req[reqProp], { swell_id: 'id', id: null });

    return next
      .handle()
      .pipe(map((data) => parseRemapProps(data, { id: 'swell_id' })));
  }
}
