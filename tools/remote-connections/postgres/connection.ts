import { Sequelize } from 'sequelize';
import IPgOptions from './interfaces/pgoptions.interface';
import * as pg from 'pg';

export default function getPgConnection(
  options: IPgOptions,
): Promise<Sequelize> {
  const { database, user, password, port, host } = options;

  const sequelize = new Sequelize(database, user, password, {
    port,
    host,
    dialectModule: pg,
    dialect: 'postgres',
    logging: console.log,
    define: { timestamps: true },
  });

  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.authenticate();
      resolve(sequelize);
    } catch (error) {
      reject(
        new Error(
          `An error occurred while connecting to PostgreSQL DB: ${error}`,
        ),
      );
    }
  });
}
