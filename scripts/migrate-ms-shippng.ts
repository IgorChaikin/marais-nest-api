import getPgConnection from '../tools/remote-connections/postgres/connection';
import getAccountModels from '../tools/remote-connections/postgres/models/accounts';
import * as dotenv from 'dotenv';
import { ModelCtor } from 'sequelize';
import getMsShippingModels from '../tools/remote-connections/postgres/models/ms-shipping';
import getPaymentModels from '../tools/remote-connections/postgres/models/payments';
import makeAssociations from '../tools/remote-connections/postgres/models/associations/get-associations';
import { createClient } from 'swell-node';
import { splitWithTypeCast } from '../utils/string-parsers';
import { msOrderOptions } from '../src/constants';

dotenv.config();

const database = process.env.POSTGRES_DB,
  user = process.env.POSTGRES_USER,
  password = process.env.POSTGRES_PASSWORD,
  port = Number(process.env.POSTGRES_PORT),
  host = process.env.POSTGRES_HOST;

const swellStoreId = process.env.SWELL_STORE_ID,
  swellSecretKey = process.env.SWELL_SECRET_KEY;

const {
  SHIPPING_MOSCOW_DAY_MS_ID,
  SHIPPING_MOSCOW_EVENING_MS_ID,
  SHIPPING_MO_LESS20_MS_ID,
  SHIPPING_MO_MORE20_MS_ID,
  SHIPPING_SDEK_MS_ID,

  MOSKOW_SHIPMENT_SERVICE_NAME,
  MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME,
  SANKT_PETERBURG_SHIPMENT_SERVICE_NAME,
  MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME,
} = msOrderOptions;

const EVENING_INTERVAL = '18 - 22';

const DELIVERY_DAY_PRICE = 300,
  DELIVERY_EVENING_PRICE = 500,
  DELIVERY_EVENING_TIME = 22;

const swellClient = createClient(swellStoreId, swellSecretKey);

async function bulkCreateWithMapping(
  model,
  records,
  transaction,
  keyField: ((result: any) => string) | string = 'name',
) {
  const results = await model.bulkCreate(records, {
    transaction,
    returning: true,
  });

  const resultsMap = {};
  results.forEach((result) => {
    const key =
      keyField instanceof Function ? keyField(result) : result[keyField];
    resultsMap[key] = result.id;
  });

  return resultsMap;
}

async function migrateKindsOfShipping(
  kindOfShippingModel: ModelCtor<any>,
  transaction,
) {
  const records = [
    { id: 1, name: 'Доставка курьером' },
    { id: 2, name: 'До 20км от МКАД' },
    { id: 3, name: 'Более 20км от МКАД' },
    { id: 4, name: 'СДЭК' },
  ];
  await kindOfShippingModel.destroy({ truncate: true, cascade: true });
  await kindOfShippingModel.bulkCreate(records, { transaction });
}

async function migrateShipmentTimes(
  shipmentTimeModel: ModelCtor<any>,
  transaction,
) {
  const [{ options: swellData }] = await swellClient.get(
    '/:content/custom.admin.order-fields/fields',
  );

  const notNullIntervals = swellData.map((element) => {
    const [start_interval, finish_interval] = splitWithTypeCast(element);
    return {
      start_interval,
      finish_interval,
      price:
        finish_interval >= DELIVERY_EVENING_TIME
          ? DELIVERY_EVENING_PRICE
          : DELIVERY_DAY_PRICE,
    };
  });

  const records = [
    ...notNullIntervals,
    {
      start_interval: null,
      finish_interval: null,
      price: 0,
    },
  ];

  await shipmentTimeModel.destroy({ truncate: true, cascade: true });
  return await bulkCreateWithMapping(
    shipmentTimeModel,
    records,
    transaction,
    (result) => `${result.start_interval} - ${result.finish_interval}`,
  );
}

async function migrateMoyskladShipmentServices(
  moyskladShipmentServiceModel: ModelCtor<any>,
  transaction,
) {
  const records = [
    {
      id: 1,
      moysklad_id: SHIPPING_MO_LESS20_MS_ID,
      kind_of_shipping_id: 2,
    },
    {
      id: 2,
      moysklad_id: SHIPPING_MO_MORE20_MS_ID,
      kind_of_shipping_id: 3,
    },
    {
      id: 3,
      moysklad_id: SHIPPING_MOSCOW_EVENING_MS_ID,
      kind_of_shipping_id: 1,
    },
    {
      id: 4,
      moysklad_id: SHIPPING_MOSCOW_DAY_MS_ID,
      kind_of_shipping_id: 1,
    },
    {
      id: 5,
      moysklad_id: SHIPPING_SDEK_MS_ID,
      kind_of_shipping_id: 4,
    },
  ];
  await moyskladShipmentServiceModel.destroy({ truncate: true, cascade: true });
  await moyskladShipmentServiceModel.bulkCreate(records, { transaction });
}

async function migrateMoyskladShipmentServicesShipmentTimes(
  moyskladShipmentServicesShipmentTimesModel: ModelCtor<any>,
  transaction,
  idsMap = {},
) {
  const intervalIds = Object.values(idsMap),
    eveningIntervalId = idsMap[EVENING_INTERVAL],
    dayIntervalIds = intervalIds.filter((id) => id !== eveningIntervalId);

  const records = [
    {
      MoyskladShipmentServiceId: 3,
      ShipmentTimeId: eveningIntervalId,
    },
    ...dayIntervalIds.map((id) => ({
      MoyskladShipmentServiceId: 4,
      ShipmentTimeId: id,
    })),
    ...intervalIds.map((id) => ({
      MoyskladShipmentServiceId: 1,
      ShipmentTimeId: id,
    })),
    ...intervalIds.map((id) => ({
      MoyskladShipmentServiceId: 2,
      ShipmentTimeId: id,
    })),
    ...intervalIds.map((id) => ({
      MoyskladShipmentServiceId: 5,
      ShipmentTimeId: id,
    })),
  ];
  await moyskladShipmentServicesShipmentTimesModel.destroy({
    truncate: true,
    cascade: true,
  });
  await moyskladShipmentServicesShipmentTimesModel.bulkCreate(records, {
    transaction,
  });
}

async function migrateMoyskladShipmentServicesShipmentServices(
  moyskladShipmentServicesShipmentServicesModel: ModelCtor<any>,
  shipmentServiceModel: ModelCtor<any>,
  transaction,
) {
  const shipmentServicesData = await shipmentServiceModel.findAll({
    attributes: ['id', 'name'],
  });
  const shipmentServicesMap = shipmentServicesData.reduce(
    (accumulator, shipmentService) => ({
      ...accumulator,
      [shipmentService.name]: shipmentService.id,
    }),
    {},
  );
  const sdekShipmentServiceIds = Object.keys(shipmentServicesMap)
    .filter(
      (key) =>
        ![
          MOSKOW_SHIPMENT_SERVICE_NAME,
          MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME,
          SANKT_PETERBURG_SHIPMENT_SERVICE_NAME,
          MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME,
        ].includes(key),
    )
    .map((key) => shipmentServicesMap[key]);

  const records = [
    {
      MoyskladShipmentServiceId: 3,
      ShipmentServiceId: shipmentServicesMap[MOSKOW_SHIPMENT_SERVICE_NAME],
    },
    {
      MoyskladShipmentServiceId: 3,
      ShipmentServiceId:
        shipmentServicesMap[SANKT_PETERBURG_SHIPMENT_SERVICE_NAME],
    },

    {
      MoyskladShipmentServiceId: 4,
      ShipmentServiceId: shipmentServicesMap[MOSKOW_SHIPMENT_SERVICE_NAME],
    },
    {
      MoyskladShipmentServiceId: 4,
      ShipmentServiceId:
        shipmentServicesMap[SANKT_PETERBURG_SHIPMENT_SERVICE_NAME],
    },

    {
      MoyskladShipmentServiceId: 1,
      ShipmentServiceId:
        shipmentServicesMap[MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME],
    },

    {
      MoyskladShipmentServiceId: 2,
      ShipmentServiceId:
        shipmentServicesMap[MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME],
    },

    ...sdekShipmentServiceIds.map((id) => ({
      MoyskladShipmentServiceId: 5,
      ShipmentServiceId: id,
    })),
  ];
  await moyskladShipmentServicesShipmentServicesModel.destroy({
    truncate: true,
    cascade: true,
  });
  await moyskladShipmentServicesShipmentServicesModel.bulkCreate(records, {
    transaction,
  });
}

async function main() {
  const sequelize = await getPgConnection({
      database,
      user,
      password,
      port,
      host,
    }),
    transaction = await sequelize.transaction(),
    models = {
      ...getAccountModels(sequelize),
      ...getMsShippingModels(sequelize),
      ...getPaymentModels(sequelize),
    };
  makeAssociations(models);

  try {
    await migrateKindsOfShipping(models['KindOfShipping'], transaction);
    const intervalIdsMap = await migrateShipmentTimes(
      models['ShipmentTime'],
      transaction,
    );
    await migrateMoyskladShipmentServices(
      models['MoyskladShipmentService'],
      transaction,
    );
    await migrateMoyskladShipmentServicesShipmentTimes(
      models['MoyskladShipmentServicesShipmentTimes'],
      transaction,
      intervalIdsMap,
    );
    await migrateMoyskladShipmentServicesShipmentServices(
      models['MoyskladShipmentServicesShipmentServices'],
      models['ShipmentService'],
      transaction,
    );
    await transaction.commit();
  } catch (error) {
    console.error(`DB migration error: ${error}`);
    await transaction.rollback();
  }
}

main();
