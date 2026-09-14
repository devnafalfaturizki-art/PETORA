import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_NAME: z.string().default('Petora'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_ENABLE_WHATSAPP_NOTIFICATIONS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  VITE_ENABLE_EMAIL_NOTIFICATIONS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  VITE_DEFAULT_TIMEZONE: z.string().default('Asia/Jakarta'),
  VITE_CURRENCY: z.string().default('IDR'),
  VITE_LOYALTY_POINT_VALUE: z
    .string()
    .default('100')
    .transform(Number),
  VITE_LOW_STOCK_THRESHOLD: z
    .string()
    .default('5')
    .transform(Number),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`
    );
  }
  return result.data;
}

export const env = validateEnv();