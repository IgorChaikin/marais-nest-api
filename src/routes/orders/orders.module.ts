import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { PostgresqlModule } from '../../common/services/postgresql/postgresql.module';
import { MoyskladModule } from '../../common/services/moysklad/moysklad.module';
import { AgendaModule } from '../../common/services/agenda/agenda.module';

@Module({
  imports: [PostgresqlModule, MoyskladModule, AgendaModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
