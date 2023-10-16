import * as dotenv from 'dotenv';
import { providerNames } from '../../../constants';
import getPgConnection from '../../../../tools/remote-connections/postgres/connection';

dotenv.config();

const database = process.env.POSTGRES_DB;
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const port = Number(process.env.POSTGRES_PORT);
const host = process.env.POSTGRES_HOST;

export const postgresqlProviders = [
  {
    provide: providerNames.POSTGRESQL_CONNECTION,
    useFactory: async () =>
      getPgConnection({ database, user, password, port, host }),
  },
];
