import { Module } from '@nestjs/common';
import { postgresqlProviders } from './postgresql.providers';
import { PostgresqlService } from './postgresql.service';

@Module({
  providers: [...postgresqlProviders, PostgresqlService],
  exports: [PostgresqlService],
})
export class PostgresqlModule {}
