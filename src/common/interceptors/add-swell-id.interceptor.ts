import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as bson from 'bson';

const { ObjectId } = bson;

@Injectable()
export class AddSwellIdInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();

    const swell_id = new ObjectId().toString();
    req.body = { ...req.body, swell_id };

    return next.handle();
  }
}
