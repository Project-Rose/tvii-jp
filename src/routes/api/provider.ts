import express, { type Request, type Response, type Router } from "express";
import crypto from "crypto";
import { env } from "@/env";

const router: Router = express.Router();

const tokenCache = new Map<string, { token: string; expiresAt: number }>(); // Cache tokens so we can send the same one until it expires

// Remove expired tokens every 5 minutes
setInterval(
    () => {
        const now = Math.floor(Date.now() / 1000);
        for (const [pid, data] of tokenCache.entries()) {
            if (data.expiresAt <= now) {
                tokenCache.delete(pid);
            }
        }
    },
    5 * 60 * 1000
);

const encryptServiceToken = (data: {
    pid: string;
    sn: string;
    bd: string;
    exp: number;
}): Buffer => {
    const dataBuffer = Buffer.alloc(34);

    dataBuffer.write(data.pid, 0, 10);
    dataBuffer.write(data.sn, 10, 11);
    dataBuffer.write(data.bd, 21, 5);
    dataBuffer.writeUInt32BE(data.exp, 26);

    const key = Buffer.from(env.VINO_JP_CONFIG_TOKEN_AES, "hex");
    const iv = Buffer.alloc(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
};

router.get("/service_token/@me", async (req: Request, res: Response) => {
    const principalId = req.get("x-nintendo-current-principal-id");
    const serialNumber = req.get("x-nintendo-serial-number");
    const birthdate = req.get("x-birthdate");

    if (!principalId || !serialNumber || !birthdate) {
        res.setHeader("Content-Type", "application/xml");
        res.send(
            `<?xml version="1.0"?><errors><error><code>1021</code><message>The requested game server was not found</message></error></errors>`
        );
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const cached = tokenCache.get(principalId);

    // Return cached token if it exists and isn't expired
    if (cached && cached.expiresAt > now) {
        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(
            `<?xml version="1.0"?><service_token><token>${cached.token}</token></service_token>`
        );
        return;
    }

    const expirationTime = now + 3600; // Token expires in 1 hour
    const unencryptedToken = {
        pid: principalId,
        sn: serialNumber,
        bd: birthdate,
        exp: expirationTime,
    };

    const encryptedToken = encryptServiceToken(unencryptedToken);
    const tokenString = encryptedToken.toString("base64");

    // Cache the new token
    tokenCache.set(principalId, {
        token: tokenString,
        expiresAt: expirationTime,
    });

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(
        `<?xml version="1.0"?><service_token><token>${tokenString}</token></service_token>`
    );
});

export { router as provider };
