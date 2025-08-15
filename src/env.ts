import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Type-safe enviornment variables
export const env = createEnv({
    server: {
        VINO_JP_CONFIG_PORT: z.coerce.number().min(1).max(65535),
        VINO_JP_CONFIG_ENV: z.enum(["dev", "stg", "prod"]),
        VINO_JP_CONFIG_TVGUIDE_API_KEY: z.string().min(1),
        VINO_JP_CONFIG_FASTLY_KEY: z.string().base64(),
        VINO_JP_CONFIG_TOKEN_AES: z.string().length(64),
        VINO_JP_X_CONSUMER_KEY: z.string(),
        VINO_JP_X_CONSUMER_SECRET: z.string(),
        VINO_JP_SITE_URL: z.string(),
        VINO_JP_CONFIG_DB_HOST: z.string(),
        VINO_JP_CONFIG_DB_PORT: z.coerce.number().int().min(1).max(65535),
        VINO_JP_CONFIG_DB_USERNAME: z.string(),
        VINO_JP_CONFIG_DB_PASSWORD: z.string(),
        VINO_JP_CONFIG_DB_NAME: z.string(),
        VINO_JP_CONFIG_DC_WEBHOOK_URL: z.string().url(),
        VINO_JP_CONFIG_BSKY_AES_KEY: z.string(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
