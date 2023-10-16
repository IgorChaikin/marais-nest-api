import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Injectable()
export class PgAccountOptionsMiddleware implements NestMiddleware {
  use(req, res: FastifyReply['raw'], next: () => void) {
    req.pgAccountInclude = {
      association: 'shipping',
      attributes: ['id'],
      required: false,
      include: [
        { association: 'city', required: false, attributes: ['name'] },
        { association: 'state', required: false, attributes: ['name'] },
      ],
    };

    req.pgAccountAttributes = [
      'id',
      'swell_id',
      'average_size',
      'moysklad_id',
      'subscribed',
    ];

    next();
  }
}
