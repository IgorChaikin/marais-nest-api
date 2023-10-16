import getPgConnection from '../tools/remote-connections/postgres/connection';
import getAccountModels from '../tools/remote-connections/postgres/models/accounts';
import * as dotenv from 'dotenv';
import { ModelCtor } from 'sequelize';
import getMsShippingModels from '../tools/remote-connections/postgres/models/ms-shipping';
import getPaymentModels from '../tools/remote-connections/postgres/models/payments';
import makeAssociations from '../tools/remote-connections/postgres/models/associations/get-associations';
import { msOrderOptions } from '../src/constants';

dotenv.config();

const database = process.env.POSTGRES_DB;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const port = Number(process.env.POSTGRES_PORT);
const host = process.env.POSTGRES_HOST;

const {
  MOSKOW_SHIPMENT_SERVICE_NAME,
  MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME,
  SANKT_PETERBURG_SHIPMENT_SERVICE_NAME,
  MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME,
} = msOrderOptions;

async function migrateMoyskladPayments(
  moyskladPaymentsModel: ModelCtor<any>,
  transaction,
) {
  const records = [
    { id: 1, name: 'Ha caйте' },
    { id: 2, name: 'Наличными' },
  ];

  await moyskladPaymentsModel.destroy({ truncate: true, cascade: true });
  await moyskladPaymentsModel.bulkCreate(records, { transaction });
}

async function migratePaymentMethods(
  paymentMethodModel: ModelCtor<any>,
  transaction,
) {
  const records = [
    {
      id: 1,
      moysklad_payment_id: 1,
      swell_id: 'alpha_bank_online',
      name: 'Банковской картой онлайн',
    },
    {
      id: 2,
      moysklad_payment_id: 2,
      swell_id: 'cash',
      name: 'Наличными или банковской картой при получении',
    },
  ];

  await paymentMethodModel.destroy({ truncate: true, cascade: true });
  await paymentMethodModel.bulkCreate(records, { transaction });
}

async function migrateShipmentServicesPaymentMethods(
  shipmentServicesPaymentMethodsMethodModel: ModelCtor<any>,
  shipmentServiceModel: ModelCtor<any>,
  transaction,
) {
  const shipmentServicesData = await shipmentServiceModel.findAll({
    attributes: ['id', 'name'],
  });
  const multiPaymentServicesData = shipmentServicesData.filter(
    (shipmentService) =>
      [
        MOSKOW_SHIPMENT_SERVICE_NAME,
        MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME,
        SANKT_PETERBURG_SHIPMENT_SERVICE_NAME,
        MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME,
      ].includes(shipmentService.name),
  );

  const records = [
    ...shipmentServicesData.map((shipmentService) => ({
      ShipmentServiceId: shipmentService.id,
      PaymentMethodId: 1,
    })),
    ...multiPaymentServicesData.map((shipmentService) => ({
      ShipmentServiceId: shipmentService.id,
      PaymentMethodId: 2,
    })),
  ];

  await shipmentServicesPaymentMethodsMethodModel.destroy({
    truncate: true,
    cascade: true,
  });
  await shipmentServicesPaymentMethodsMethodModel.bulkCreate(records, {
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
    await migrateMoyskladPayments(models['MoyskladPayment'], transaction);
    await migratePaymentMethods(models['PaymentMethod'], transaction);
    await migrateShipmentServicesPaymentMethods(
      models['ShipmentServicesPaymentMethods'],
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
