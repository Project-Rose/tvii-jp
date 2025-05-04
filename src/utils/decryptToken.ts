import crypto from "crypto";
import { env } from "@/env";
import { logger } from "./logger";

interface ServiceToken {
    pid: string;
    sn: string;
    bd: string;
    exp: number;
}

export const decryptServiceToken = (
    encryptedToken: string
): ServiceToken | null => {
    try {
        const key = Buffer.from(env.VINO_JP_CONFIG_TOKEN_AES, "hex");
        const iv = Buffer.alloc(16);

        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        const encryptedBuffer = Buffer.from(encryptedToken, "base64");

        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final(),
        ]);

        const exp = decrypted.readUInt32BE(26);
        if (exp < Math.floor(Date.now() / 1000)) {
            throw new Error("Token has expired");
        }

        return {
            pid: decrypted.toString("utf8", 0, 10).replace(/\0+$/, ""),
            sn: decrypted.toString("utf8", 10, 21).replace(/\0+$/, ""),
            bd: decrypted.toString("utf8", 21, 26).replace(/\0+$/, ""),
            exp,
        };
    } catch (e: unknown) {
        logger.error(`Failed to decrypt service token: ${e}`);
        return null;
    }
};

const token = decryptServiceToken(
    "jqMrUCsKZbABMTikVvgjA0YBFlyUFGRHZyDW3VjK0D/ybGZsSCUIEZ4dEFwHoDz9"
);
console.log(token);
