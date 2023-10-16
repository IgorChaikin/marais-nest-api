import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import IModelsMap from '../interfaces/models-map.interface';

function getPaymentModels(sequelize: Sequelize): IModelsMap {
  const ShipmentServicesPaymentMethods: ModelCtor<Model> = sequelize.define(
    'ShipmentServicesPaymentMethods',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    },
    {
      tableName: 'shipment_services_payment_methods',
      freezeTableName: true,
      timestamps: false,
    },
  );

  const PaymentMethod: ModelCtor<Model> = sequelize.define(
    'PaymentMethod',
    {
      moysklad_payment_id: {
        type: DataTypes.INTEGER,
      },
      swell_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'payment_methods',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const MoyskladPayment: ModelCtor<Model> = sequelize.define(
    'MoyskladPayment',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'moysklad_payments',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  PaymentMethod.belongsTo(MoyskladPayment, {
    as: 'moysklad_payment',
    foreignKey: 'moysklad_payment_id',
  });

  MoyskladPayment.hasMany(PaymentMethod, {
    as: 'payment_methods',
    foreignKey: 'moysklad_payment_id',
  });

  return {
    MoyskladPayment,
    PaymentMethod,
    ShipmentServicesPaymentMethods,
  };
}

export default getPaymentModels;
