import { awsOptions, siteAttributes } from '../../../../constants';
import * as dotenv from 'dotenv';
import * as AWS from 'aws-sdk';
import templates from '../email-templates-map';
import { getRawEmailContent } from '../../../../../utils/email';
import { Job } from 'agenda';

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const { shopUrl, shopName } = siteAttributes;
const ses = new AWS.SES({
  accessKeyId,
  secretAccessKey,
  region: awsOptions.REGION,
});

const parseEmail = (email: string | Array<string>): Array<string> =>
  email instanceof Array ? email : email.split(',');

export default async function sendEmail(
  job: Job,
  done: () => void,
): Promise<void> {
  try {
    const fromHeader = `${awsOptions.FRIENDLY_NAME} <${awsOptions.FROM}>`,
      { type, email, data, attachments = [], mailName } = job.attrs.data,
      { template, subject } = templates[type],
      params = {
        Source: awsOptions.FROM,
        Destinations: parseEmail(email),
        RawMessage: {
          Data: getRawEmailContent(
            mailName || subject,
            template({ ...data, shopUrl, shopName }),
            attachments,
            fromHeader,
          ),
        },
      };
    ses.sendRawEmail(params, (error, data) => {
      if (error) {
        console.error('error when sending email');
        console.error(error);
        job.fail(error).save();
        done();
      } else {
        console.log('email sent');
        console.log('data', data);
        done();
      }
    });
  } catch (error) {
    console.error(error);
    await job.fail(error).save();
    done();
  }
}
