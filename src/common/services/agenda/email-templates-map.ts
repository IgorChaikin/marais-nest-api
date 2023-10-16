import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import * as path from 'path';

handlebars.registerHelper(
  'discountedPrice',
  (price: number, discountEach: number, quantity: number): number =>
    (price - discountEach) * quantity,
);
handlebars.registerHelper(
  'price',
  (price: number, quantity: number): number => price * quantity,
);

const data = {
    resetPassword: {
      path: '../../../../assets/email-templates/resetPassword.html',
      subject: 'Сброс пароля',
    },
    registration: {
      path: '../../../../assets/email-templates/registration.html',
      subject: 'Добро пожаловать!',
    },
    order: {
      path: '../../../../assets/email-templates/order.html',
      subject: 'Подтверждение заказа',
    },
    invoice: {
      path: '../../../../assets/email-templates/invoice.html',
      subject: 'Invoice',
    },
    receipt: {
      path: '../../../../assets/email-templates/receipt.html',
      subject: 'Receipt',
    },

    //email for notify about restock
    restockNotification: {
      path: '../../../../assets/email-templates/restockNotification.html',
      subject: 'Модель доступна в вашем размере',
    },
  },
  templates = Object.entries(data).reduce(
    (accumulator, [key, value]: [string, { [key: string]: string }]) => {
      const dirname = __dirname.split('email'),
        fileData = readFileSync(path.join(dirname[0], value.path), 'utf-8');

      accumulator[key] = {
        subject: value.subject,
        template: handlebars.compile(fileData),
      };

      return accumulator;
    },
    {},
  );

export default templates;
