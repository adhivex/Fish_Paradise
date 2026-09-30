import 'server-only';
import { z } from 'zod';

/**
 * Server configuration, validated once. Secrets are read only from the environment (never the
 * repo); `.env.example` lists every variable.
 */
const isProd = process.env.NODE_ENV === 'production';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    AUTH_SECRET: z.string().min(16).optional(),
    ADMIN_PHONE: z.string().optional(),

    OTP_PROVIDER: z.enum(['console', 'msg91']).default('console'),
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
    MSG91_SENDER_ID: z.string().optional(),
    MSG91_SMS_FLOW_ID: z.string().optional(),

    PAYMENT_PROVIDER: z.enum(['razorpay', 'fake']).default('fake'),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    NOTIFY_PROVIDER: z.enum(['console', 'whatsapp', 'sms']).default('console'),
    WHATSAPP_API_URL: z.string().url().optional(),
    WHATSAPP_API_TOKEN: z.string().optional(),
    OWNER_NOTIFY_PHONE: z.string().optional(),

    CRON_SECRET: z.string().min(16).optional(),
    SENTRY_DSN: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (!isProd) return;
    const need = (key: keyof typeof env, when = true) => {
      if (when && !env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
    };
    need('AUTH_SECRET');
    need('MSG91_AUTH_KEY', env.OTP_PROVIDER === 'msg91');
    need('MSG91_TEMPLATE_ID', env.OTP_PROVIDER === 'msg91');
    need('RAZORPAY_KEY_ID', env.PAYMENT_PROVIDER === 'razorpay');
    need('RAZORPAY_KEY_SECRET', env.PAYMENT_PROVIDER === 'razorpay');
    need('RAZORPAY_WEBHOOK_SECRET', env.PAYMENT_PROVIDER === 'razorpay');
    need('CRON_SECRET');
  });

type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(
        `Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`,
      );
    }
    cached = parsed.data;
  }
  return cached;
}
