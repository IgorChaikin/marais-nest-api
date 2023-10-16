import { Module } from '@nestjs/common';
import { agendaProviders } from './agenda.providers';
import { AgendaService } from './agenda.service';

@Module({
  providers: [...agendaProviders, AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
