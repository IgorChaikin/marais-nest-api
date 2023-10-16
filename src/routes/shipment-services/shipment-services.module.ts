import { Module } from '@nestjs/common';
import { ShipmentServicesController } from './shipment-services.controller';
import { PostgresqlModule } from '../../common/services/postgresql/postgresql.module';
import { AgendaModule } from '../../common/services/agenda/agenda.module';

@Module({
  imports: [PostgresqlModule, AgendaModule],
  controllers: [ShipmentServicesController],
})
export class ShipmentServicesModule {}
