import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AccountsModule } from './routes/accounts/accounts.module';
import { PgTransactionMiddleware } from './common/middleware/pg-transaction.middleware';
import { PostgresqlModule } from './common/services/postgresql/postgresql.module';
import { PgTransactionExceptionFilter } from './common/exception-filters/pg-transaction-exception.filter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PgTransactionInterceptor } from './common/interceptors/pg-transaction.interceptor';
import { PgAccountOptionsMiddleware } from './common/middleware/pg-account-options.middleware';
import { ShipmentServicesModule } from './routes/shipment-services/shipment-services.module';
import { MoyskladModule } from './common/services/moysklad/moysklad.module';
import { OrdersModule } from './routes/orders/orders.module';

@Module({
  imports: [
    AccountsModule,
    ShipmentServicesModule,
    OrdersModule,

    PostgresqlModule,
    MoyskladModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: PgTransactionExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PgTransactionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PgAccountOptionsMiddleware).forRoutes('accounts');
    consumer.apply(PgTransactionMiddleware).forRoutes('accounts', 'services');
  }
}
