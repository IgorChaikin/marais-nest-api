import * as dotenv from 'dotenv';

dotenv.config();

export const providerNames = {
  POSTGRESQL_CONNECTION: 'POSTGRESQL_CONNECTION',
  AGENDA_CONNECTION: 'AGENDA_CONNECTION',
};

export const msOrderOptions = {
  ATTR_COMMENTS_ID:
    process.env.NODE_ENV === 'production'
      ? 'db9fb799-c2df-11eb-0a80-0652001085c2'
      : '4a0231d6-1676-11ee-0a80-0542000fea23',
  ATTR_SHIPPING_ADDRESS_ID:
    process.env.NODE_ENV === 'production'
      ? 'c56e480a-1523-11ea-0a80-04630026f660'
      : '4a02307d-1676-11ee-0a80-0542000fea22',
  ATTR_CITY_ID:
    process.env.NODE_ENV === 'production'
      ? 'df764f9f-c833-11eb-0a80-09da0006391a'
      : '4a022e92-1676-11ee-0a80-0542000fea21',
  ATTR_SHIPPING_ID:
    process.env.NODE_ENV === 'production'
      ? 'c5bbf5f1-1521-11ea-0a80-009e0025e50e'
      : 'd229b0cd-1676-11ee-0a80-043f00106c96',
  ATTR_ADMIN_NUMBER_ID:
    process.env.NODE_ENV === 'production'
      ? '5e0144d9-cdd7-11eb-0a80-0955003bee8a'
      : '4a0232c0-1676-11ee-0a80-0542000fea24',
  ATTR_PAYMENT_ID:
    process.env.NODE_ENV === 'production'
      ? 'c5bbf715-1521-11ea-0a80-009e0025e50f'
      : 'd229b37b-1676-11ee-0a80-043f00106c98',
  ATTR_SHIPPING_TIME_ID:
    process.env.NODE_ENV === 'production'
      ? '69956a72-351f-11ea-0a80-05dc00081fdf'
      : '4a02334b-1676-11ee-0a80-0542000fea25',
  ORGANIZATION_ID:
    process.env.NODE_ENV === 'production'
      ? '31eb8267-8b59-11e9-912f-f3d40014f31d'
      : '86018efc-ae17-11ed-0a80-08ee000026fd',
  ATTR_PAYMENT_ENTITY_META_ID:
    process.env.NODE_ENV === 'production'
      ? '2b9a691e-1520-11ea-0a80-009e0025c9ab'
      : '7bcee89b-1666-11ee-0a80-13ab000cebe0',
  ATTR_SHIPPING_ENTITY_META_ID:
    process.env.NODE_ENV === 'production'
      ? '7e65ba67-151f-11ea-0a80-02b70025f166'
      : '45c32695-1666-11ee-0a80-0fd8000b9022',

  SHIPPING_MOSCOW_DAY_MS_ID:
    process.env.NODE_ENV === 'production'
      ? '3fac51df-a31c-11e9-9109-f8fc0008ff8e'
      : 'b5f5e798-1428-11ee-0a80-01b40084d5e3',
  SHIPPING_MOSCOW_EVENING_MS_ID:
    process.env.NODE_ENV === 'production'
      ? '4a284f8d-d03f-11eb-0a80-032300103716'
      : 'b5eb3db0-1428-11ee-0a80-01b40084d5c4',
  SHIPPING_MO_LESS20_MS_ID:
    process.env.NODE_ENV === 'production'
      ? '85c52d30-d26b-11eb-0a80-092800277109'
      : 'b5df24dc-1428-11ee-0a80-01b40084d5af',
  SHIPPING_MO_MORE20_MS_ID:
    process.env.NODE_ENV === 'production'
      ? 'b4003094-d282-11eb-0a80-0dc4002c4975'
      : 'b5d14c41-1428-11ee-0a80-01b40084d596',
  SHIPPING_SDEK_MS_ID:
    process.env.NODE_ENV === 'production'
      ? '1cbe2f59-bce4-11e9-912f-f3d400174a9a'
      : 'b6106654-1428-11ee-0a80-01b40084d5f4',

  MOSKOW_SHIPMENT_SERVICE_NAME: 'Москва в пределах МКАД',
  MOSCOW_AND_MO_20_KM_REGION_SHIPMENT_SERVICE_NAME:
    'Москва и МО до 20км от МКАД',
  SANKT_PETERBURG_SHIPMENT_SERVICE_NAME: 'Санкт - Петербург',
  MO_GT_20_KM_REGION_SHIPMENT_SERVICE_NAME:
    'Московская область, более 20 км от МКАД',
};

export const agendaOptions = {
  AGENDA_COLLECTION_NAME: 'agendaEmailJobs',
  DEFAULT_EMAIL_TASK_NAME: 'send_email',
};

export const awsOptions = {
  FRIENDLY_NAME: 'Marais.ru',
  FROM: 'noreply@marais.ru',
  REGION: 'eu-west-1',
  SELLERS:
    process.env.NODE_ENV === 'production'
      ? [
          'g.shygalev@yahoo.com',
          'dminch@gmail.com',
          'is@marais.ru',
          'dm@marais.ru',
        ]
      : ['aws.dev.vmajsuk@gmail.com'],
};

export const siteAttributes = {
  // how to define ?
  shopUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://www.marais.ru/'
      : 'http://localhost:4000',
  shopName: 'marais',
};
