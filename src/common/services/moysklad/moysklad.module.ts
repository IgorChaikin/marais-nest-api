import { Module } from '@nestjs/common';
import { MoyskladService } from './moysklad.service';

@Module({
  providers: [MoyskladService],
  exports: [MoyskladService],
})
export class MoyskladModule {}
