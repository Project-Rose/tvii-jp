import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Type-safe enviornment variables
export const env = createEnv({
    server: {
        VINO_JP_CONFIG_PORT: z.coerce.number().min(1).max(65535),
        VINO_JP_CONFIG_ENV: z.enum(["dev", "stg", "prod"]),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
