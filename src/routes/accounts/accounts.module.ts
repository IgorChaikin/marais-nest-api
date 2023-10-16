import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { PostgresqlModule } from '../../common/services/postgresql/postgresql.module';
import { MoyskladModule } from '../../common/services/moysklad/moysklad.module';
import { AgendaModule } from '../../common/services/agenda/agenda.module';

@Module({
  imports: [PostgresqlModule, MoyskladModule, AgendaModule],
  controllers: [AccountsController],
})
export class AccountsModule {}
