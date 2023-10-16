import { Model, ModelCtor } from 'sequelize';

export default interface IModelsMap {
  [key: string]: ModelCtor<Model>;
}
