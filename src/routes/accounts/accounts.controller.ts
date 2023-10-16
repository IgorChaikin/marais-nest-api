import {
  Req,
  Res,
  HttpStatus,
  Post,
  Put,
  Get,
  Controller,
  HttpException,
  UseInterceptors,
} from '@nestjs/common';
import AuthDataDto from './dto/auth-data.dto';
import AccountGetDataDto from './dto/account-get-data.dto';
import AccountUpdateDataDto from './dto/account-update-data.dto';
import { PostgresqlService } from '../../common/services/postgresql/postgresql.service';
import { MoyskladService } from '../../common/services/moysklad/moysklad.service';
import * as bcrypt from 'bcryptjs';
import { ParseAccountInterceptor } from '../../common/interceptors/parse-account.interceptor';
import { ParseSwellIdInterceptor } from '../../common/interceptors/parse-swell-id.interceptor';
import { AddSwellIdInterceptor } from '../../common/interceptors/add-swell-id.interceptor';
import { AgendaService } from '../../common/services/agenda/agenda.service';
import { FastifyReply } from 'fastify';
import getPasswordKey from '../../../utils/password-key';
import { parseReduceByDto } from '../../../utils/payload-parsers';
import NewPasswordDto from './dto/new-password.dto';

@Controller('accounts')
// make interceptors depend on env variables
@UseInterceptors(ParseSwellIdInterceptor, ParseAccountInterceptor)
export class AccountsController {
  constructor(
    private postgresqlService: PostgresqlService,
    private moyskladService: MoyskladService,
    private agendaService: AgendaService,
  ) {}

  @Post('register')
  @UseInterceptors(AddSwellIdInterceptor)
  async register(@Req() req): Promise<any> {
    const {
      raw: { pgAccountInclude: include, transaction },
    } = req;

    const {
      password: rawPassword,
      subscribed: subscribedValue,
      email,
      ...pgPayload
    } = Object(parseReduceByDto(req.body, AuthDataDto));

    const [msAccount, msCreated] = await this.moyskladService.postIfNotExists(
      'entity/counterparty',
      { filter: { email } },
      { name: email, companyType: 'individual' },
      null,
    );
    if (!msCreated) {
      throw new HttpException('Forbidden', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const password = bcrypt.hashSync(rawPassword, 8);
    const subscribed = !!subscribedValue;
    const [pgAccount, pgCreated] = await this.postgresqlService.models[
      'Account'
    ].findOrCreate({
      where: { moysklad_id: msAccount['id'] },
      include,
      transaction,
      defaults: {
        ...pgPayload,
        password,
        subscribed,
        date_last_login: new Date(),
      },
    });
    if (!pgCreated) {
      throw new HttpException('Forbidden', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    this.agendaService.sendEmailNow({ email, type: 'registration' });

    return { msAccount, pgAccount };
  }

  @Post('login')
  async login(@Req() req): Promise<any> {
    const {
      raw: {
        pgAccountInclude: include,
        pgAccountAttributes: attributes,
        transaction,
      },
    } = req;

    const { password, email } = Object(parseReduceByDto(req.body, AuthDataDto));

    const msResult: object | Array<object> | [object | Array<object>, boolean] =
      await this.moyskladService.get('entity/counterparty', {
        filter: { email },
      });

    if (!(msResult instanceof Array<[object]>) || msResult.length !== 1) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const [msAccount] = msResult;

    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      where: { moysklad_id: msAccount['id'] },
      attributes: [...attributes, 'password'],
      include,
      transaction,
    });

    if (!bcrypt.compareSync(password, pgAccount['password'])) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const newPgAccount = pgAccount.set({ date_last_login: new Date() });
    await newPgAccount.save({ transaction });

    return { msAccount, pgAccount: newPgAccount };
  }

  @Get()
  async get(@Req() req): Promise<any> {
    const {
      raw: {
        pgAccountInclude: include,
        pgAccountAttributes: attributes,
        transaction,
      },
    } = req;

    const pgPayload = Object(parseReduceByDto(req.query, AccountGetDataDto));

    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      where: pgPayload,
      include,
      attributes,
      transaction,
    });
    if (!pgAccount) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    const msResult: object | Array<object> | [object | Array<object>, boolean] =
      await this.moyskladService.get('entity/counterparty', {
        filter: { id: pgAccount['moysklad_id'] },
      });
    if (!(msResult instanceof Array<[object]>) || msResult.length !== 1) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    const [msAccount] = msResult;

    return { msAccount, pgAccount };
  }

  @Put('update')
  async update(@Req() req): Promise<any> {
    const {
      raw: {
        pgAccountInclude: include,
        pgAccountAttributes: attributes,
        transaction,
      },
    } = req;

    const {
      first_name,
      phone,
      subscribed: subscribedValue,
      shipping: { address1, state, city },
      ...pgPayload
    } = Object(parseReduceByDto(req.body, AccountUpdateDataDto));

    const pgState = await this.postgresqlService.models[
      'ShipmentService'
    ].findOne({ where: { name: state }, transaction });
    const pgCity =
      !!city &&
      (
        await this.postgresqlService.models['City'].findOrCreate({
          where: { name: city },
          transaction,
        })
      )[0];

    const pgAddress =
      !!pgState &&
      (
        await this.postgresqlService.models['Address'].findOrCreate({
          where: {
            city_id: !!pgCity ? pgCity['id'] : null,
            shipment_service_id: pgState['id'],
          },
          transaction,
        })
      )[0];
    await this.postgresqlService.models['Account'].update(
      {
        shipping_address_id: !!pgAddress ? pgAddress['id'] : null,
        subscribed: !!subscribedValue,
      },
      { where: { ...pgPayload }, transaction },
    );
    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      where: { ...pgPayload },
      include,
      attributes,
      transaction,
    });
    if (!pgAccount || !pgAccount['moysklad_id']) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const msPayload = {
      phone,
      legalTitle: first_name,
      actualAddress: address1,
    };
    if (!!first_name) {
      msPayload['name'] = first_name;
    }

    const msAccount = await this.moyskladService.edit(
      'PUT',
      `/entity/counterparty/${pgAccount['moysklad_id']}`,
      msPayload,
      null,
      null,
    );

    return { msAccount, pgAccount };
  }

  @Post('reset-password')
  async resetPassword(@Req() req, @Res() res: FastifyReply): Promise<void> {
    const {
      raw: { transaction },
    } = req;

    const { email } = Object(parseReduceByDto(req.body, ['email']));

    const msResult: object | Array<object> | [object | Array<object>, boolean] =
      await this.moyskladService.get('entity/counterparty', {
        filter: { email },
      });
    if (!(msResult instanceof Array<object>)) {
      throw new HttpException('Type error', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const [msAccount] = msResult;
    const password_reset_key = getPasswordKey();

    const [updRowCount] = await this.postgresqlService.models['Account'].update(
      { password_reset_key },
      { where: { moysklad_id: msAccount['id'] || null }, transaction },
    );
    if (updRowCount === 1) {
      this.agendaService.sendEmailNow({
        email,
        type: 'resetPassword',
        data: { code: password_reset_key },
      });
    }

    res.send(200);
  }

  @Put('new-password')
  async newPassword(@Req() req): Promise<unknown> {
    const {
      raw: {
        pgAccountAttributes: attributes,
        pgAccountInclude: include,
        transaction,
      },
    } = req;

    const { password_reset_key, password: rawPassword } = Object(
      parseReduceByDto(req.body, NewPasswordDto),
    );
    const password = bcrypt.hashSync(rawPassword, 8);

    const pgAccount = await this.postgresqlService.models['Account'].findOne({
      where: { password_reset_key },
      attributes,
      include,
      transaction,
    });
    if (!pgAccount || !pgAccount['moysklad_id']) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    const [updRowCount] = await this.postgresqlService.models['Account'].update(
      { password, password_reset_key: null },
      { where: { password_reset_key }, transaction },
    );
    if (updRowCount !== 1) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const msAccount = await this.moyskladService.get(
      `/entity/counterparty/${pgAccount['moysklad_id']}`,
    );

    return { msAccount, pgAccount };
  }
}
