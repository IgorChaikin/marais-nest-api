import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import IModelsMap from '../../interfaces/models-map.interface';

function makeAssociations(models: IModelsMap): void {
  const {
    ShipmentService,
    ShipmentServicesPaymentMethods,
    PaymentMethod,
    MoyskladShipmentService,
    MoyskladShipmentServicesShipmentServices,
  } = models;

  ShipmentService.belongsToMany(PaymentMethod, {
    through: ShipmentServicesPaymentMethods,
    as: 'payment_methods',
  });

  PaymentMethod.belongsToMany(ShipmentService, {
    through: ShipmentServicesPaymentMethods,
    as: 'shipment_services',
  });

  //

  ShipmentService.belongsToMany(MoyskladShipmentService, {
    through: MoyskladShipmentServicesShipmentServices,
    as: 'moysklad_shipment_services',
  });

  MoyskladShipmentService.belongsToMany(ShipmentService, {
    through: MoyskladShipmentServicesShipmentServices,
    as: 'shipment_services',
  });
}

export default makeAssociations;
