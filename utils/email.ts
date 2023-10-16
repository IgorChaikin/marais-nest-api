import { isEmpty, reduce } from 'lodash';

function getEmailBodyHeaders(subject, boundary, from) {
  return `Subject: ${subject}
Accept-Language: en-US
Content-Language: en-US
Content-Type: multipart/mixed; boundary="${boundary}"
MIME-Version: 1.0
From: ${from}`;
}

function getEmailBody(subject, html, boundary, from) {
  return `${getEmailBodyHeaders(subject, boundary, from)}

--${boundary}
Content-Type: text/html; charset="utf-8"
${html}`;
}

function appendAttachment(body, attachment, boundary) {
  return (
    body +
    `

--${boundary}
Content-Disposition: attachment; filename="${attachment.name}";
Content-Transfer-Encoding: base64
Content-Type: application/pdf; name="${attachment.name}"

${attachment.content}
`
  );
}

export function getRawEmailContent(subject, html, attachments, from) {
  const boundary = 'awfnawezfmcklsndfw',
    body = getEmailBody(subject, html, boundary, from);

  if (isEmpty(attachments)) {
    return body;
  } else {
    return (
      reduce(
        attachments,
        (memo, attachment) => appendAttachment(memo, attachment, boundary),
        body,
      ) +
      `
--${boundary}--`
    );
  }
}
