import * as dotenv from 'dotenv';
import * as Moysklad from 'moysklad';
import * as _ from 'lodash';
import nodeFetch from 'node-fetch';
import { splitWithTypeCast } from '../../utils/string-parsers';

dotenv.config();

const MOY_SKLAD_SOURCE_USER = 'director@marais',
  MOY_SKLAD_SOURCE_PASSWORD = 'Di95+5rec+tor';

const msSourceClient = Moysklad({
  login: MOY_SKLAD_SOURCE_USER,
  password: MOY_SKLAD_SOURCE_PASSWORD,
  fetch: nodeFetch,
});

const msTargetClient = Moysklad({
  login: process.env.MOY_SKLAD_USER,
  password: process.env.MOY_SKLAD_PASSWORD,
  fetch: nodeFetch,
});

const MAX_LIMIT = 100;

const maxAmount = (dataElement) => dataElement.maxSize || dataElement.dataSize;

const getProductEntity = (productIdsMap, code) => ({
  meta: {
    href: `https://online.moysklad.ru/api/remap/1.2/entity/product/${productIdsMap[code]}`,
    metadataHref:
      'https://online.moysklad.ru/api/remap/1.2/entity/product/metadata',
    type: 'product',
    mediaType: 'application/json',
    //uuidHref: `https://online.moysklad.ru/app/#good/edit?id=${productIdsMap[code]}`,
  },
});

async function migrateEntities(
  entityName,
  entitiesCountData,
  fieldsMap,
  filter = {},
  productIdsMap = null,
): Promise<any> {
  const threshold = maxAmount(entitiesCountData[entityName]);

  const restSize =
    threshold > 0 ? threshold - entitiesCountData[entityName].offset : Infinity;

  if (
    entitiesCountData[entityName].dataSize !== 0 &&
    entitiesCountData[entityName].offset >=
      entitiesCountData[entityName].dataSize
  ) {
    return [];
  }

  const limit = Math.min(MAX_LIMIT, restSize);

  const entityResult = await msSourceClient.GET(`/entity/${entityName}`, {
    offset: entitiesCountData[entityName].offset,
    limit,
    filter,
    order: 'id,desc',
  });
  const {
    meta: { size: entitySize },
    rows: entityRows,
  } = entityResult;
  const formattedEntityRows = entityRows.map((entity) => {
    const [simpleProps, arrayProps] = _.partition(
      Object.keys(fieldsMap),
      (key) => !fieldsMap[key],
    );
    const formattedEntityRow = _.pick(entity, simpleProps);
    arrayProps.forEach((arrayProp) => {
      _.set(
        formattedEntityRow,
        arrayProp,
        _.map(_.get(entity, arrayProp), (arrayPropElement) =>
          _.pick(arrayPropElement, fieldsMap[arrayProp]),
        ),
      );
    });

    if (productIdsMap) {
      const [code] = splitWithTypeCast(formattedEntityRow.code);
      formattedEntityRow.product = getProductEntity(productIdsMap, code);
    }

    return formattedEntityRow;
  });
  const postResult = await msTargetClient.POST(
    `/entity/${entityName}`,
    formattedEntityRows,
  );
  if (entitiesCountData[entityName].dataSize === 0) {
    entitiesCountData[entityName].dataSize = entitySize;
  }
  entitiesCountData[entityName].offset += limit;

  return {
    ids: entityRows.map(({ id }) => id),
    productIdsMap: postResult.reduce(
      (accumulator, { code, id }) => ({ ...accumulator, [code]: id }),
      {},
    ),
  };
}

async function main() {
  const entitiesCountData = {
    product: {
      offset: 0,
      dataSize: 0,
      maxSize: 287, // CAN BE NULL OR DELETED
    },
    variant: {
      offset: 0,
      dataSize: 0,
      maxSize: 287, // CAN BE NULL OR DELETED
    },
    service: {
      offset: 0,
      dataSize: 0,
      maxSize: 6, // CAN BE NULL OR DELETED
    },
  };

  do {
    const { ids, productIdsMap } = await migrateEntities(
      'product',
      entitiesCountData,
      {
        name: '',
        code: '',
        'buyPrice.value': '',
        'minPrice.value': '',
      },
    );

    await migrateEntities(
      'variant',
      entitiesCountData,
      {
        name: '',
        code: '',
        product: '',
        characteristics: ['name', 'value'],
      },
      { productid: { $in: ids } },
      productIdsMap,
    );

    await migrateEntities('service', entitiesCountData, {
      name: '',
      code: '',
      externalCode: '',
      archived: '',
      pathName: '',
      useParentVat: '',
      barcodes: '',
      paymentItemType: '',
      discountProhibited: '',
      'buyPrice.value': '',
      'minPrice.value': '',
    });

    // log

    /*Object.keys(entitiesCountData).forEach((key) =>
      console.log(
        `${key}: ${entitiesCountData[key].offset} / ${maxAmount(
          entitiesCountData[key],
        )}`,
      ),
    );*/
  } while (
    Object.values(entitiesCountData)
      .map((dataElement) => dataElement.offset < maxAmount(dataElement))
      .some((isValidAmount) => isValidAmount)
  );
}

main();
