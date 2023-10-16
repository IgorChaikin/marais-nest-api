import * as _ from 'lodash';
import nodeFetch from 'node-fetch';
import * as Moysklad from 'moysklad';
import { parseRemapProps, parseRemoveMeta } from './payload-parsers';
import { msOrderOptions } from '../src/constants';

const msClient = Moysklad({ fetch: nodeFetch });

const getAttributesMetadata = (id) => {
  return {
    href: msClient.buildUrl(`entity/customerorder/metadata/attributes/${id}`),
    type: 'attributemetadata',
    mediaType: 'application/json',
  };
};

export const getMsOrderTemplate = (
  positions,
  counterpartyId,
  description = '',
  attributes = [],
) => {
  return {
    // replace by generator of 6 digit number
    name: Math.floor(146000 + Math.random() * (1000000 - 146000)).toString(),

    organization: {
      meta: {
        href: msClient.buildUrl(
          `entity/organization/${msOrderOptions.ORGANIZATION_ID}`,
        ),
        type: 'organization',
        mediaType: 'application/json',
      },
    },
    agent: {
      meta: {
        href: msClient.buildUrl(`entity/counterparty/${counterpartyId}`),
        type: 'counterparty',
        mediaType: 'application/json',
      },
    },
    positions,
    attributes,
    description,
  };
};

export function getMsOrderResponse(order) {
  const {
      attributes,
      sum,
      positions: { rows: rawPositions = [] },
    } = order,
    positions = rawPositions.map((position) => {
      const { price: rawPrice, discount: rawDiscount, quantity } = position;
      const price = rawPrice / 100;
      const price_total = price * quantity;
      const discount = rawDiscount / 100;
      return {
        ...position,
        price,
        price_total,
        discount_each: price * discount,
        discount_total: price_total * discount,
      };
    }),
    [[shipmentPosition], productPositions] = _.partition(
      positions,
      (item) => item?.assortment?.meta?.type === 'service',
    ),
    sub_total = productPositions.reduce(
      (accumulator, position) => position.price_total + accumulator.price_total,
      0,
    ),
    shipment_price = shipmentPosition?.price || 0;

  // id, errors - ?
  return parseRemapProps(
    {
      ...parseRemoveMeta(order),
      shipment_price,
      sub_total,
      order_number: attributes?.find(
        (attribute) => attribute.id === msOrderOptions.ATTR_ADMIN_NUMBER_ID,
      )?.value,
      positions: productPositions,
      grand_total: sum / 100,
    },
    { number: 'name', items: 'positions' },
  );
}

export const getMsAttributes = (
  comments = '',
  order_number = '',
  { city = '', service_name = '', address1 = '', time = '' },
  kindOfShipping = '',
  paymentMethod,
) => {
  return [
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_CITY_ID),
      value: city,
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_SHIPPING_ADDRESS_ID),
      value: `${service_name}, ${city}, ${address1}`,
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_COMMENTS_ID),
      value: comments,
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_ADMIN_NUMBER_ID),
      value: order_number,
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_SHIPPING_TIME_ID),
      value: time,
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_PAYMENT_ID),
      value: {
        entityMeta: {
          href: msClient.buildUrl(
            `entity/customentity/${msOrderOptions.ATTR_PAYMENT_ENTITY_META_ID}`,
          ),
          type: 'customentity',
          mediaType: 'application/json',
          //uuidHref: `https://online.moysklad.ru/app/#custom_${msOrderOptions.ATTR_PAYMENT_ENTITY_META_ID}`,
        },
        name: paymentMethod,
      },
    },
    {
      meta: getAttributesMetadata(msOrderOptions.ATTR_SHIPPING_ID),
      value: {
        entityMeta: {
          href: msClient.buildUrl(
            `entity/customentity/${msOrderOptions.ATTR_SHIPPING_ENTITY_META_ID}`,
          ),
          type: 'customentity',
          mediaType: 'application/json',
          //uuidHref: `https://online.moysklad.ru/app/#${msOrderOptions.ATTR_SHIPPING_ENTITY_META_ID}`,
        },
        name: kindOfShipping,
      },
    },
  ];
};

export const getMsOrdersPosition = (
  { quantity = 1, price = 0, discount_total = 0, price_total }, // add type
  productId: string,
  entityName: string,
) => ({
  quantity: quantity,
  price: price * 100,
  discount:
    !!discount_total && !!price_total
      ? (discount_total / price_total) * 100
      : 0,
  assortment: {
    meta: {
      href: msClient.buildUrl(`entity/${entityName}/${productId}`),
      type: entityName,
      mediaType: 'application/json',
    },
  },
});
