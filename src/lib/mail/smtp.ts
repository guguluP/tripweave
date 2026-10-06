import tls from "node:tls";
import type { OutboundMail } from "./ses";

/** Gmail (or any implicit-TLS mailbox). No site domain required. */
export function smtpConfigured(): boolean {
  return Boolean(smtpHost() && smtpUser() && smtpPass() && smtpFrom());
}

function smtpHost(): string {
  return process.env.SMTP_HOST?.trim() || "";
}

function smtpUser(): string {
  return process.env.SMTP_USER?.trim() || "";
}

function smtpPass(): string {
  return process.env.SMTP_PASS?.trim() || "";
}

function smtpFrom(): string {
  return process.env.SMTP_FROM?.trim() || "";
}

function smtpPort(): number {
  const raw = Number(process.env.SMTP_PORT?.trim() || "465");
  return Number.isFinite(raw) && raw > 0 ? raw : 465;
}

export function smtpData(from: string, message: OutboundMail): string {
  const textBody = message.text.replace(/\r?\n/g, "\r\n");
  const htmlBody = message.html?.replace(/\r?\n/g, "\r\n");
  const lines = htmlBody
    ? [
        `From: ${from}`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        "MIME-Version: 1.0",
        'Content-Type: multipart/alternative; boundary="tw-alt"',
        "",
        "--tw-alt",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        textBody,
        "--tw-alt",
        "Content-Type: text/html; charset=UTF-8",
        "",
        htmlBody,
        "--tw-alt--",
      ]
    : [
        `From: ${from}`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        textBody,
      ];
  return lines
    .join("\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function readReply(socket: tls.TLSSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      const lines = buf.split(/\r?\n/).filter((line) => line.length > 0);
      const last = lines.at(-1) ?? "";
      if (/^\d{3} /.test(last)) {
        socket.off("data", onData);
        const code = Number(last.slice(0, 3));
        if (code >= 400) reject(new Error(last));
        else resolve(buf);
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function command(socket: tls.TLSSocket, line: string): Promise<string> {
  const pending = readReply(socket);
  socket.write(`${line}\r\n`);
  return pending;
}

/** Sends one message over implicit TLS (port 465). HTML uses multipart/alternative. */
export async function sendSmtpMail(message: OutboundMail): Promise<void> {
  if (!smtpConfigured() || !message.to) {
    throw new Error("SMTP is not configured.");
  }
  const from = smtpFrom();
  const socket = tls.connect({ host: smtpHost(), port: smtpPort(), servername: smtpHost() });
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", () => resolve());
      socket.once("error", reject);
    });
    await readReply(socket);
    await command(socket, "EHLO tripweave");
    await command(socket, "AUTH LOGIN");
    await command(socket, Buffer.from(smtpUser()).toString("base64"));
    await command(socket, Buffer.from(smtpPass()).toString("base64"));
    await command(socket, `MAIL FROM:<${from}>`);
    await command(socket, `RCPT TO:<${message.to}>`);
    await command(socket, "DATA");
    await command(socket, `${smtpData(from, message)}\r\n.`);
    await command(socket, "QUIT");
  } finally {
    socket.end();
  }
}
