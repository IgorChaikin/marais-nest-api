import { Injectable } from '@nestjs/common';
import * as Moysklad from 'moysklad';
import { Query } from 'moysklad';
import nodeFetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MoyskladService {
  private msClient = Moysklad({
    login: process.env.MOY_SKLAD_USER,
    password: process.env.MOY_SKLAD_PASSWORD,
    fetch: nodeFetch,
  });

  buildUrl = this.msClient.buildUrl;

  async get(
    path: string,
    query: Query = null,
    options: object = null,
  ): Promise<any | Array<any>> {
    const result = await this.msClient.GET(path, query, options);
    return result.rows ?? result;
  }

  async getAll(
    path: string,
    query: Query = null,
    options: object = null,
  ): Promise<Array<object>> {
    const limit = 1000;
    let offset = 0,
      isLastPage = false,
      result = [];
    do {
      const iterationQuery: Query = { ...query, limit, offset },
        iterationResult: object | Array<object> = await this.get(
          path,
          iterationQuery,
          options,
        ),
        formattedResult: Array<object> =
          iterationResult instanceof Array
            ? iterationResult
            : [iterationResult];
      offset += limit;
      isLastPage = formattedResult.length < limit;
      if (formattedResult.length === 0) {
        continue;
      }
      result = [...result, ...formattedResult];
    } while (isLastPage);

    return result;
  }

  async edit(
    // add method names to constants
    method: 'POST' | 'PUT',
    path: string,
    payload: object,
    query: Query = null,
    options: object = null,
  ): Promise<object | Array<object>> {
    return await this.msClient[method](path, payload, query, options);
  }

  async postIfNotExists(
    path: string,
    query: Query = {},
    payload: object | Array<object> = {},
    options: object = null,
  ): Promise<[object | Array<object>, boolean]> {
    let result: object | Array<object> = await this.get(path, query, options);
    if (result instanceof Array && result.length > 0) {
      return [result, false];
    }
    const { filter } = query,
      formattedPayload: Array<object> | object =
        payload instanceof Array
          ? payload.map((elem) => ({ ...Object(filter), ...elem }))
          : { ...Object(filter), ...payload };
    result = await this.edit('POST', path, formattedPayload, query, options);
    return [result, true];
  }
}
