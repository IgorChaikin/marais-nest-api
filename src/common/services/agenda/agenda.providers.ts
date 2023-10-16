import * as dotenv from 'dotenv';
import { agendaOptions, providerNames } from '../../../constants';
import { Agenda } from 'agenda';

dotenv.config();
const address = process.env.AGENDA_MONGO_URI;

export const agendaProviders = [
  {
    provide: providerNames.AGENDA_CONNECTION,
    useFactory: async () => {
      const agenda = new Agenda({
        db: {
          address,
          collection: agendaOptions.AGENDA_COLLECTION_NAME,
        },
      });

      return agenda
        .on('ready', async () => {
          try {
            await agenda.start();
            console.log('Agenda started!');
            // resolve(agenda);
          } catch (error) {
            console.log(`Agenda starting error: ${error}`);
            // reject(error);
          }
        })
        .on('error', (error) =>
          console.log(`Agenda connection error: ${error}`),
        );
    },
  },
];
