import { Inject, Injectable } from '@nestjs/common';
import { Agenda } from 'agenda';
import { agendaOptions, providerNames } from '../../../constants';
import sendEmail from './job-handlers/email-handler';

@Injectable()
export class AgendaService {
  constructor(
    @Inject(providerNames.AGENDA_CONNECTION)
    private agenda: Agenda,
  ) {}

  sendEmailNow(
    data: object,
    jobName: string = agendaOptions.DEFAULT_EMAIL_TASK_NAME,
  ) {
    this.agenda.define(jobName, sendEmail);
    this.agenda.now(jobName, data);
  }
  // service methods
}
