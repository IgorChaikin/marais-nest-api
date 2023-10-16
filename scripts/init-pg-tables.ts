import getPgConnection from '../tools/remote-connections/postgres/connection';
import getAccountModels from '../tools/remote-connections/postgres/models/accounts';
import * as dotenv from 'dotenv';
import getMsShippingModels from '../tools/remote-connections/postgres/models/ms-shipping';
import makeAssociations from '../tools/remote-connections/postgres/models/associations/get-associations';
import getPaymentModels from '../tools/remote-connections/postgres/models/payments';

dotenv.config();

const database = process.env.POSTGRES_DB;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const port = Number(process.env.POSTGRES_PORT);
const host = process.env.POSTGRES_HOST;

async function init() {
  const sequelize = await getPgConnection({
    database,
    user,
    password,
    port,
    host,
  });
  const models = {
    ...getAccountModels(sequelize),
    ...getMsShippingModels(sequelize),
    ...getPaymentModels(sequelize),
    // more models for init
  };
  makeAssociations(models);

  try {
    for (const key of Object.keys(models)) {
      await models[key].sync({ alter: true, force: true });
    }
  } catch (error) {
    console.error(`DB tables initializing error: ${error}`);
  }
}

init();
