import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import IModelsMap from '../interfaces/models-map.interface';

function getMsShippingModels(sequelize: Sequelize): IModelsMap {
  const MoyskladShipmentService: ModelCtor<Model> = sequelize.define(
    'MoyskladShipmentService',
    {
      kind_of_shipping_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      moysklad_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'moysklad_shipment_services',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const KindOfShipping: ModelCtor<Model> = sequelize.define(
    'KindOfShipping',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'kinds_of_shipping',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const ShipmentTime: ModelCtor<Model> = sequelize.define(
    'ShipmentTime',
    {
      start_interval: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      finish_interval: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DOUBLE,
      },
    },
    {
      tableName: 'shipment_times',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const MoyskladShipmentServicesShipmentTimes = sequelize.define(
    'MoyskladShipmentServicesShipmentTimes',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    },
    {
      tableName: 'moysklad_shipment_services_shipment_times',
      freezeTableName: true,
      timestamps: false,
    },
  );

  const MoyskladShipmentServicesShipmentServices = sequelize.define(
    'MoyskladShipmentServicesShipmentServices',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    },
    {
      tableName: 'moysklad_shipment_services_shipment_services',
      freezeTableName: true,
      timestamps: false,
    },
  );

  MoyskladShipmentService.belongsTo(KindOfShipping, {
    as: 'kind_of_shipping',
    foreignKey: 'kind_of_shipping_id',
  });

  KindOfShipping.hasMany(MoyskladShipmentService, {
    as: 'moysklad_shipment_services',
    foreignKey: 'kind_of_shipping_id',
  });

  MoyskladShipmentService.belongsToMany(ShipmentTime, {
    through: MoyskladShipmentServicesShipmentTimes,
    as: 'shipment_times',
  });

  ShipmentTime.belongsToMany(MoyskladShipmentService, {
    through: MoyskladShipmentServicesShipmentTimes,
    as: 'moysklad_shipment_services',
  });

  return {
    ShipmentTime,
    KindOfShipping,
    MoyskladShipmentService,
    MoyskladShipmentServicesShipmentTimes,
    MoyskladShipmentServicesShipmentServices,
  };
}

export default getMsShippingModels;
