import 'server-only';
import { env } from '@/lib/env';
import type { TemplateName } from './templates';

export interface OutgoingMessage {
  to: string; // E.164
  template: TemplateName;
  text: string;
}

/** Delivers a message; throws on failure (the notification service catches and logs). */
export interface NotifyProvider {
  readonly channel: 'console' | 'whatsapp' | 'sms';
  send(message: OutgoingMessage): Promise<void>;
}

const consoleProvider: NotifyProvider = {
  channel: 'console',
  async send(m) {
    console.log(`  📣 [${m.template}] → ${m.to}: ${m.text}`);
  },
};

/**
 * Generic WhatsApp Business API gateway (e.g. MSG91, Gupshup, Interakt or Meta Cloud API behind
 * a small adapter). Production needs approved templates with the same names as `TemplateName`.
 */
const whatsappProvider: NotifyProvider = {
  channel: 'whatsapp',
  async send(m) {
    const { WHATSAPP_API_URL, WHATSAPP_API_TOKEN } = env();
    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) throw new Error('WhatsApp is not configured');
    const res = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${WHATSAPP_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ to: m.to.replace('+', ''), template: m.template, text: m.text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`WhatsApp API responded ${res.status}`);
  },
};

/** MSG91 transactional SMS via a DLT-approved flow (MSG91_SMS_FLOW_ID). */
const smsProvider: NotifyProvider = {
  channel: 'sms',
  async send(m) {
    const { MSG91_AUTH_KEY, MSG91_SMS_FLOW_ID, MSG91_SENDER_ID } = env();
    if (!MSG91_AUTH_KEY || !MSG91_SMS_FLOW_ID) throw new Error('MSG91 SMS is not configured');
    const res = await fetch('https://control.msg91.com/api/v5/flow', {
      method: 'POST',
      headers: { authkey: MSG91_AUTH_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        template_id: MSG91_SMS_FLOW_ID,
        sender: MSG91_SENDER_ID,
        recipients: [{ mobiles: m.to.replace('+', ''), message: m.text, template: m.template }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`MSG91 responded ${res.status}`);
  },
};

export function notifyProvider(): NotifyProvider {
  switch (env().NOTIFY_PROVIDER) {
    case 'whatsapp':
      return whatsappProvider;
    case 'sms':
      return smsProvider;
    default:
      return consoleProvider;
  }
}
