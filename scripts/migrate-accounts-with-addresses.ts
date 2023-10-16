import { createClient } from 'swell-node';
import getPgConnection from '../tools/remote-connections/postgres/connection';
import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import * as Moysklad from 'moysklad';
import nodeFetch from 'node-fetch';

dotenv.config();

const database = process.env.POSTGRES_DB;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const port = Number(process.env.POSTGRES_PORT);
const host = process.env.POSTGRES_HOST;
const swellStoreId = process.env.SWELL_STORE_ID;
const swellSecretKey = process.env.SWELL_SECRET_KEY;

const swellClient = createClient(swellStoreId, swellSecretKey);
const msClient = Moysklad({
  login: process.env.MOY_SKLAD_USER,
  password: process.env.MOY_SKLAD_PASSWORD,
  fetch: nodeFetch,
});

async function migrateAccounts(sequelize: Sequelize, transaction) {
  const queryInterface = sequelize.getQueryInterface(),
    tableName = 'temp_accounts';

  await sequelize.query(`TRUNCATE public.accounts CASCADE`, { transaction });

  await sequelize.query(
    `CREATE TEMP TABLE ${tableName}
    (
      moysklad_id VARCHAR(255),
      swell_id VARCHAR(255),
      average_size INT2,
      cart_abandoned_count INT,
      date_first_cart_abandoned TIMESTAMPTZ,
      date_last_cart_abandoned TIMESTAMPTZ,
      date_last_login TIMESTAMPTZ,
      password VARCHAR(255),
      password_reset_key VARCHAR(255),
      date_created TIMESTAMPTZ,
      date_updated TIMESTAMPTZ,
      city_name VARCHAR(255),
      state_name VARCHAR(255)
    )
    ON COMMIT DELETE ROWS`,
    { transaction },
  );

  let currentPage = 1,
    lastPage = 1;
  const limit = 1000;
  do {
    const { results, count, page } = await swellClient.get('/accounts', {
      page: currentPage,
      limit,
      fields:
        'id, email, type, notes, name, phone, average_size, cart_abandoned_count, date_first_cart_abandoned, ' +
        'date_last_cart_abandoned, date_last_login, password, date_created, date_updated, shipping.city, ' +
        'shipping.state, shipping.address1',
    });
    if (page === 1) {
      lastPage = Math.ceil(count / limit);
    }

    const msAccounts = await Promise.all(
      results.map(async ({ email, type, notes, name, phone, shipping }) => {
        try {
          let moysklad_id;
          const {
            rows: [firstRow],
          } = await msClient.GET('/entity/counterparty', {
            filter: { email },
          });

          if (!!firstRow) {
            moysklad_id = firstRow.id;
          } else {
            const createdAccount = await msClient.POST('/entity/counterparty', {
              email,
              name: name || email,
              companyType: type === 'individual' ? type : 'legal',
              description: notes || '',
              legalTitle: name || '',
              phone: phone || '',
              actualAddress: shipping?.address1 || '',
            });
            moysklad_id = createdAccount.id;
          }
          return { email, moysklad_id };
        } catch (error) {
          return null;
        }
      }),
    );
    const filteredMsAccounts = msAccounts.filter((account) => !!account);

    await queryInterface.bulkInsert(
      tableName,
      results.map(
        ({
          email,
          average_size,
          cart_abandoned_count,
          password,
          id: swell_id,
          shipping,
          date_created,
          date_updated,
          password_reset_key,
          date_first_cart_abandoned,
          date_last_cart_abandoned,
          date_last_login,
        }) => ({
          average_size,
          cart_abandoned_count,
          password,
          password_reset_key,
          swell_id,
          city_name: shipping?.city || null,
          state_name: shipping?.state || null,
          date_created: new Date(date_created),
          date_updated: new Date(date_updated || date_created),
          date_first_cart_abandoned:
            date_first_cart_abandoned && new Date(date_first_cart_abandoned),
          date_last_cart_abandoned:
            date_last_cart_abandoned && new Date(date_last_cart_abandoned),
          date_last_login: new Date(
            date_last_login || date_updated || date_created,
          ),
          moysklad_id: filteredMsAccounts.find((elem) => elem.email === email)
            ?.moysklad_id,
        }),
      ),
      { transaction },
    );
    await sequelize.query(
      `INSERT INTO public.accounts
           (
                average_size,
                cart_abandoned_count,
                password,
                password_reset_key,
                swell_id,
                date_created,
                date_updated,
                date_first_cart_abandoned,
                date_last_cart_abandoned,
                date_last_login,
                moysklad_id,
                shipping_address_id
          )
          SELECT 
            ${tableName}.average_size,
            ${tableName}.cart_abandoned_count,
            ${tableName}.password,
            ${tableName}.password_reset_key,
            ${tableName}.swell_id,
            ${tableName}.date_created,
            ${tableName}.date_updated,
            ${tableName}.date_first_cart_abandoned,
            ${tableName}.date_last_cart_abandoned,
            ${tableName}.date_last_login,
            ${tableName}.moysklad_id, 
            public.addresses.id
         FROM ${tableName}
         LEFT JOIN public.cities ON ${tableName}.city_name = public.cities.name
         LEFT JOIN public.shipment_services ON ${tableName}.state_name = public.shipment_services.name
         LEFT JOIN public.addresses ON public.cities.id = public.addresses.city_id AND
            public.shipment_services.id = public.addresses.shipment_service_id`,
      { transaction },
    );
    await sequelize.query(`TRUNCATE ${tableName}`, { transaction });

    currentPage = page + 1;
  } while (currentPage <= lastPage);
}

async function main() {
  const sequelize = await getPgConnection({
      database,
      user,
      password,
      port,
      host,
    }),
    transaction = await sequelize.transaction();

  try {
    await migrateAccounts(sequelize, transaction);

    await transaction.commit();
  } catch (error) {
    console.error(`DB migration error: ${error}`);
    await transaction.rollback();
  }
}

main();
