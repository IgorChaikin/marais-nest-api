import nodeFetch from 'node-fetch';
import * as Moysklad from 'moysklad';

const msClient = Moysklad({ fetch: nodeFetch });

export function parseCamelCase(
  rawName: string,
  capitalized = false,
  delimiters: Array<string> = [' ', '_'],
): string {
  const splitRegex = new RegExp(`[${delimiters.join('\\')}]`),
    camelCaseNameArr = rawName.split(splitRegex);
  if (camelCaseNameArr.length <= 1) {
    return rawName;
  }
  const camelCaseName = camelCaseNameArr
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  return capitalized
    ? camelCaseName
    : camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1);
}

export const splitWithTypeCast = (
  str: string,
  delimiter = '-',
): Array<string | number | null> =>
  str?.split(delimiter)?.map((element) => {
    const trimmedElement = element.trim();
    return isNaN(Number(trimmedElement)) ? trimmedElement : +trimmedElement;
  }) || [null, null];

export const getMsEntityUrl = (url, query = {}) =>
  msClient.buildUrl(`entity/${url}`, query);
