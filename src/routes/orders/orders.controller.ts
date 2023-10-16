import { Controller, Get, Post, Req } from '@nestjs/common';
import * as _ from 'lodash';
import { MoyskladService } from '../../common/services/moysklad/moysklad.service';
import { AgendaService } from '../../common/services/agenda/agenda.service';
import {
  getMsAttributes,
  getMsOrderResponse,
  getMsOrdersPosition,
  getMsOrderTemplate,
} from '../../../utils/ms-entities-parsers';
import { PostgresqlService } from '../../common/services/postgresql/postgresql.service';
import {
  getMsEntityUrl,
  splitWithTypeCast,
} from '../../../utils/string-parsers';
import { parseRemapProps } from '../../../utils/payload-parsers';

@Controller('orders')
export class OrdersController {
  constructor(
    private moyskladService: MoyskladService,
    private postgresqlService: PostgresqlService,
    private agendaService: AgendaService,
  ) {}

  @Post()
  async post(@Req() req): Promise<any> {
    const {
      order_number,
      items,
      shipping,
      billingMethodId,
      comments,
      account_id,
    } = Object(req.body);

    const promises = items.map(
      (item) =>
        new Promise(async (resolve, reject) => {
          const { product_sku, variant_name } = item;
          const [msCode, entityName] =
            variant_name && variant_name !== 'default'
              ? [`${product_sku.trim()}-${variant_name}`, 'variant']
              : [product_sku.trim(), 'product'];

          try {
            const [{ id: msProductId }] = await this.moyskladService.get(
              `/entity/${entityName}`,
              { filter: { code: msCode } },
            );
            if (!!msProductId) {
              resolve(getMsOrdersPosition(item, msProductId, entityName));
            } else {
              reject(msCode);
            }
          } catch (err) {
            reject(msCode);
          }
        }),
    );
    const results = await Promise.allSettled(promises);

    const [fulfilledResults, rejectedResults] = _.partition(
      results,
      (result) => result['status'] === 'fulfilled',
    );
    const positions = fulfilledResults.map((result) => result['value']);
    const rejectedCodes = rejectedResults.map((result) => result['reason']);

    const description = rejectedCodes?.length
      ? `Не удалось найти товары: ${rejectedCodes.join(', ')}`
      : '';

    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      // validate
      where: {
        swell_id: account_id,
        //id: +account_id
      },
    });
    const { moysklad_id: msAccountId } = Object(pgAccount);

    // const { service_id, time } = shipping;
    const { service_name, time } = shipping;
    const [start_interval, finish_interval] = splitWithTypeCast(time);
    const pgMsShipmentService = await this.postgresqlService.models[
      'MoyskladShipmentService'
    ].findOne({
      attributes: ['moysklad_id'],
      where: {
        '$shipment_times.start_interval$': start_interval,
        '$shipment_times.finish_interval$': finish_interval,

        //'$shipment_services.id$': service_id,
        '$shipment_services.name$': service_name,
      },
      include: [
        { association: 'kind_of_shipping', attributes: ['name'] },
        {
          association: 'shipment_times',
          attributes: ['start_interval', 'finish_interval'],
          required: true,
          duplicating: false,
        },
        {
          association: 'shipment_services',
          attributes: ['name'],
          required: true,
          duplicating: false,
        },
      ],
    });
    const {
      moysklad_id: shipmentId = null,
      kind_of_shipping: { name: kindOfShipping = null },
    } = Object(pgMsShipmentService);

    if (shipmentId) {
      positions.push(getMsOrdersPosition(shipping, shipmentId, 'service'));
    }

    const pgPaymentMethod = await this.postgresqlService.models[
      'PaymentMethod'
    ].findOne({
      where: {
        // id: billingMethodId,
        swell_id: billingMethodId,
      },
      include: {
        association: 'moysklad_payment',
        attributes: ['name'],
        required: false,
      },
    });
    const {
      moysklad_payment: { name: paymentMethod = '' },
    } = Object(pgPaymentMethod);

    const msOrder = await this.moyskladService.edit(
      'POST',
      'entity/customerorder',
      getMsOrderTemplate(
        positions,
        msAccountId,
        description,
        getMsAttributes(
          comments,
          order_number,
          shipping,
          kindOfShipping,
          paymentMethod,
        ),
      ),
      {
        expand: 'positions,positions.assortment,positions.assortment.product',
      },
    );
    return getMsOrderResponse(msOrder);
  }

  @Get('list')
  async get(@Req() req): Promise<any> {
    const { account_id, limit = 0 } = Object(req.query);
    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      where: {
        swell_id: account_id,
        //id: +account_id
      },
    });
    const { moysklad_id: msAccountId } = Object(pgAccount);

    const msOrders = await this.moyskladService.get('/entity/customerorder', {
      expand: 'state',
      filter: { agent: getMsEntityUrl(`counterparty/${msAccountId}`) },
      limit,
      order: 'created,desc',
    });

    return parseRemapProps(
      msOrders.map((order) => getMsOrderResponse(order)),
      {
        status: 'state.name',
        date_created: 'created',
        date_updated: 'updated',
        state: null,
        created: null,
        updated: null,
      },
    );
  }

  /*@Get(':id')
  async getById(@Req() req): Promise<any> {
    return;
  }*/
}
