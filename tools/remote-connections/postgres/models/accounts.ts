import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import IModelsMap from '../interfaces/models-map.interface';

function getAccountModels(sequelize: Sequelize): IModelsMap {
  const Account: ModelCtor<Model> = sequelize.define(
    'Account',
    {
      shipping_address_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      moysklad_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      swell_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      average_size: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      cart_abandoned_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      date_first_cart_abandoned: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      date_last_cart_abandoned: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      subscribed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      date_last_login: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password_reset_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'accounts',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const Address: ModelCtor<Model> = sequelize.define(
    'Address',
    {
      city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      shipment_service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'addresses',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const ShipmentService: ModelCtor<Model> = sequelize.define(
    'ShipmentService',
    {
      swell_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.DOUBLE,
      },
      pickup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'shipment_services',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  const City: ModelCtor<Model> = sequelize.define(
    'City',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'cities',
      freezeTableName: true,
      createdAt: 'date_created',
      updatedAt: 'date_updated',
    },
  );

  Account.belongsTo(Address, {
    as: 'shipping',
    foreignKey: 'shipping_address_id',
  });

  Address.hasMany(Account, {
    as: 'accounts',
    foreignKey: 'shipping_address_id',
  });
  Address.belongsTo(City, { as: 'city', foreignKey: 'city_id' });
  Address.belongsTo(ShipmentService, {
    as: 'state',
    foreignKey: 'shipment_service_id',
  });

  ShipmentService.hasMany(Address, {
    as: 'addresses',
    foreignKey: 'shipment_service_id',
  });

  City.hasMany(Address, { as: 'addresses', foreignKey: 'city_id' });

  return { City, ShipmentService, Address, Account };
}

export default getAccountModels;
