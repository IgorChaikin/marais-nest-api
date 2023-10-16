import { Inject, Injectable } from '@nestjs/common';
import { providerNames } from '../../../constants';
import { Sequelize, Transaction } from 'sequelize';
import getAccountModels from '../../../../tools/remote-connections/postgres/models/accounts';
import IModelsMap from '../../../../tools/remote-connections/postgres/interfaces/models-map.interface';
import getMsShippingModels from '../../../../tools/remote-connections/postgres/models/ms-shipping';
import makeAssociations from '../../../../tools/remote-connections/postgres/models/associations/get-associations';
import getPaymentModels from '../../../../tools/remote-connections/postgres/models/payments';

@Injectable()
export class PostgresqlService {
  private readonly _models: IModelsMap;

  constructor(
    @Inject(providerNames.POSTGRESQL_CONNECTION)
    private sequelize: Sequelize,
  ) {
    this._models = {
      ...getAccountModels(sequelize),
      ...getMsShippingModels(sequelize),
      ...getPaymentModels(sequelize),
      // other models, associated with given sequelize connection
    };
    makeAssociations(this._models);
  }

  async getTransaction(): Promise<Transaction> {
    return await this.sequelize.transaction();
  }

  async resolveTransaction(t: Transaction) {
    await t.commit();
  }

  async rejectTransaction(t: Transaction) {
    await t.rollback();
  }

  get models(): IModelsMap {
    return this._models;
  }
}
