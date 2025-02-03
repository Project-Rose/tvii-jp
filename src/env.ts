import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        PORT: z.coerce.number().min(1).max(65535),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
