import { Req, Get, Controller, UseInterceptors } from '@nestjs/common';
import { PostgresqlService } from '../../common/services/postgresql/postgresql.service';
import { ParseSwellIdInterceptor } from '../../common/interceptors/parse-swell-id.interceptor';
import { parseExtractDataValues } from '../../../utils/payload-parsers';

@Controller('shipment-services')
@UseInterceptors(ParseSwellIdInterceptor)
export class ShipmentServicesController {
  constructor(private postgresqlService: PostgresqlService) {}

  @Get()
  async get(@Req() req): Promise<any> {
    const {
      raw: { transaction },
    }: { raw: any } = req;

    const pgServices = await this.postgresqlService.models[
      'ShipmentService'
    ].findAll({
      where: { enabled: true },
      transaction,
    });

    return parseExtractDataValues(pgServices);
  }
}
