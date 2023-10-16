import { createClient } from 'swell-node';
import getPgConnection from '../tools/remote-connections/postgres/connection';
import getAccountModels from '../tools/remote-connections/postgres/models/accounts';
import * as dotenv from 'dotenv';
import { Sequelize, ModelCtor } from 'sequelize';
import { parseRemapProps } from '../utils/payload-parsers';

dotenv.config();

const database = process.env.POSTGRES_DB;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const port = Number(process.env.POSTGRES_PORT);
const host = process.env.POSTGRES_HOST;
const swellStoreId = process.env.SWELL_STORE_ID;
const swellSecretKey = process.env.SWELL_SECRET_KEY;

const swellClient = createClient(swellStoreId, swellSecretKey);

async function migrateCities(cityModel: ModelCtor<any>, transaction) {
  await cityModel.destroy({ truncate: true, cascade: true });

  const { results } = await swellClient.get('/accounts', {
    aggregate: [{ $group: { _id: '$shipping.city' } }],
  });

  await cityModel.bulkCreate(
    results
      .filter((elem) => !!elem.id)
      .map(({ id: name }) => ({
        name,
        date_created: new Date(),
        date_updated: new Date(),
      })),
    { transaction },
  );
}

async function migrateShipmentServices(
  shipmentServicesModel: ModelCtor<any>,
  transaction,
) {
  await shipmentServicesModel.destroy({ truncate: true, cascade: true });

  const results = await swellClient.get('/settings/shipments/services');

  await shipmentServicesModel.bulkCreate(
    results.map((shipmentService) => ({
      ...parseRemapProps(shipmentService, {
        swell_id: 'id',
        id: null,
        package_weight: null,
        price_type: null,
        zones: null,
        rules: null,
      }),
      date_created: new Date(),
      date_updated: new Date(),
    })),
    { transaction },
  );
}

async function migrateAddresses(sequelize: Sequelize, transaction) {
  const { results } = await swellClient.get('/accounts', {
    aggregate: [
      {
        $group: {
          _id: { $concat: ['$shipping.city', ' ; ', '$shipping.state'] },
          city_name: { $first: '$shipping.city' },
          state_name: { $first: '$shipping.state' },
          date_created: { $first: '$date_created' },
          date_updated: { $first: '$date_updated' },
        },
      },
    ],
  });

  const tableName = 'temp_addresses';
  await sequelize.query(
    `CREATE TEMP TABLE ${tableName}
    (
      city_name VARCHAR(255),
      state_name VARCHAR(255),
      date_created TIMESTAMPTZ,
      date_updated TIMESTAMPTZ
    )
    ON COMMIT DELETE ROWS;`,
    { transaction },
  );

  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkInsert(
    tableName,
    results
      .filter((elem) => !!elem.city_name && !!elem.state_name)
      .map(({ city_name, state_name, date_created, date_updated }) => ({
        city_name,
        state_name,
        date_created: new Date(date_created),
        date_updated: new Date(date_updated),
      })),
    { transaction },
  );

  await sequelize.query('TRUNCATE public.addresses CASCADE', { transaction });

  await sequelize.query(
    `INSERT INTO public.addresses 
         (city_id, shipment_service_id, date_created, date_updated)
         SELECT 
            public.cities.id, 
            public.shipment_services.id, 
            ${tableName}.date_created, 
            ${tableName}.date_updated 
         FROM ${tableName}
         LEFT JOIN public.cities ON ${tableName}.city_name = public.cities.name
         LEFT JOIN public.shipment_services ON ${tableName}.state_name = public.shipment_services.name`,
    { transaction },
  );

  await sequelize.query(`TRUNCATE ${tableName}`, { transaction });
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
    models = getAccountModels(sequelize);

  try {
    await migrateCities(models['City'], transaction);
    await migrateShipmentServices(models['ShipmentService'], transaction);
    await migrateAddresses(sequelize, transaction);

    await transaction.commit();
  } catch (error) {
    console.error(`DB migration error: ${error}`);
    await transaction.rollback();
  }
}

main();
