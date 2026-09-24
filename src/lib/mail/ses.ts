import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function region(): string {
  return process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || "";
}

function fromAddress(): string {
  return process.env.SES_FROM?.trim() || "";
}

export function mailConfigured(): boolean {
  return Boolean(
    region() &&
      fromAddress() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

function client(): SESv2Client {
  return new SESv2Client({ region: region() });
}

/** Sends through Amazon SES. Returns false when SES is not configured. */
export async function sendMail(message: OutboundMail): Promise<boolean> {
  if (!mailConfigured() || !message.to) return false;
  await client().send(
    new SendEmailCommand({
      FromEmailAddress: fromAddress(),
      Destination: { ToAddresses: [message.to] },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: message.text, Charset: "UTF-8" },
            ...(message.html ? { Html: { Data: message.html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    }),
  );
  return true;
}
