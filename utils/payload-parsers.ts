import * as _ from 'lodash';

const removeMeta = (element: object): object =>
  JSON.parse(
    JSON.stringify(element).replace(
      /((,)?"[A-Za-z0-9_-]*":{"meta":{[^{}]*}})|("meta":{[^{}]*}(,)?)?/g,
      '',
    ),
  );

const extractDataValues = (element): object => element.dataValues;

const remapProps = (
  payload: { [key: string]: string },
  propsMap: object,
): object => {
  const oldPayload = _.cloneDeep(payload),
    updates = {};
  Object.entries(propsMap).forEach(([key, value]) => {
    if (!_.isNull(value)) {
      _.set(updates, key, _.get(payload, value));
    } else {
      _.unset(oldPayload, key);
    }
  });
  return _.merge(oldPayload, updates);
};

const reduceByDto = (payload, dto) =>
  _.pick(payload, _.isArray(dto) ? dto : _.keys(new dto()));

const parseObjOrArr =
  (elementParser: (...args) => object) =>
  (...args) =>
    args[0] instanceof Array
      ? args[0].map((elem) => elementParser(elem, ...args.slice(1)))
      : elementParser(...args);

export const parseRemoveMeta = parseObjOrArr(removeMeta);
export const parseExtractDataValues = parseObjOrArr(extractDataValues);
export const parseRemapProps = parseObjOrArr(remapProps);
export const parseReduceByDto = parseObjOrArr(reduceByDto);
