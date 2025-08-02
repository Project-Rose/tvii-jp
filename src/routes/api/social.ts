import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { env } from "@/env";
import crypto from "crypto";
import { BskyClient } from "@/utils/bsky";
import db from "@/utils/db";

const router: Router = express.Router();

const upload = multer();

function generateCode(length = 6): Promise<string> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids O, 0, I, 1
    async function isUnique(code: string): Promise<boolean> {
        const exists = await db("oauth_associations").where({ code }).first();
        return !exists;
    }

    return new Promise(async (resolve) => {
        let code;
        do {
            code = Array.from(
                { length },
                () => chars[Math.floor(Math.random() * chars.length)]
            ).join("");
        } while (!(await isUnique(code)));
        resolve(code);
    });
}

function generateNonce(): string {
    return crypto.randomBytes(16).toString("hex");
}

function generateHmacSha1Signature(baseString: string, key: string): string {
    const hmac = crypto.createHmac("sha1", key);
    hmac.update(baseString);
    return encodeURIComponent(hmac.digest("base64"));
}

router.post(
    "/XForwardOauthSuccess",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const { code, oauth_token, oauth_verifier } = req.body;

            if (
                typeof code !== "string" ||
                code.trim() === "" ||
                typeof oauth_token !== "string" ||
                oauth_token.trim() === "" ||
                typeof oauth_verifier !== "string" ||
                oauth_verifier.trim() === ""
            ) {
                return res.status(400).json({
                    status: "error",
                    error: "Missing or invalid query parameters.",
                });
            }

            const oauthRow = await db("oauth_associations")
                .where({ code, oauth_token, type: "X" })
                .first();
            if (!oauthRow) {
                return res.status(400).json({
                    status: "error",
                    error: "Invalid or expired code.",
                });
            }

            const response = await fetch(
                "https://api.twitter.com/oauth/access_token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ oauth_token, oauth_verifier }),
                }
            );

            const responseBody = await response.text();
            const responseParams = new URLSearchParams(responseBody);

            if (responseParams.has("oauth_token")) {
                await db("oauth_associations")
                    .where({ code })
                    .update({
                        access_token: responseParams.get("oauth_token") || "",
                        access_token_secret:
                            responseParams.get("oauth_token_secret") || "",
                        user_id: responseParams.get("user_id") || "",
                        screen_name: responseParams.get("screen_name") || "",
                        status: "verified",
                    });

                res.status(200).json({ status: "verified" });
            } else {
                res.status(400).json({
                    status: "error",
                    error: "Internal server error.",
                });
            }
        } catch (error) {
            console.error("Error in X verification:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error.",
            });
        }
    }
);

router.get(
    "/XCodeActivationFromWebsite",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const { code } = req.query;
            if (typeof code !== "string")
                return res.status(400).json({ error: "Invalid code format" });

            const row = await db("oauth_associations")
                .where({ code, type: "X" })
                .first();
            if (!row) return res.status(400).json({ error: "Code is invalid" });

            res.status(200).json({ url: row.oauth_url });
        } catch (error) {
            console.error("Error in /XCodeActivationFromWebsite:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.get("/XCodeCheck", async (req: Request, res: Response): Promise<any> => {
    try {
        const { code } = req.query;
        if (typeof code !== "string")
            return res.status(200).json({ status: "expired", type: "X" });

        const row = await db("oauth_associations")
            .where({ code, type: "X" })
            .first();
        console.log(row);
        if (!row) return res.status(200).json({ status: "expired", type: "X" });

        if (row.status !== "verified") {
            return res
                .status(200)
                .json({ code, status: "unverified", type: "X" });
        }

        await db("oauth_associations").where({ code, type: "X" }).del();

        res.status(200).json({
            code,
            x_screen_name: row.screen_name,
            x_oauth_token: row.access_token,
            x_oauth_secret: row.access_token_secret,
            x_user_id: row.user_id,
            status: "verified",
            type: row.type,
        });
    } catch (error) {
        console.error("Error in /XCodeCheck:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.post(
    "/XCodeDispose",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const { code } = req.body;

            const row = await db("oauth_associations")
                .where({ code, type: "X" })
                .first();
            if (!row) return res.status(200).json({ status: "verified" });

            await db("oauth_associations").where({ code, type: "X" }).del();

            res.status(200).json({
                status: "verified",
            });
        } catch (error) {
            console.error("Error in /XCodeDispose:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.post(
    "/XCodeCreate",
    async (_req: Request, res: Response): Promise<any> => {
        try {
            const code = await generateCode(6);
            const nonce = generateNonce();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const callbackTWUrl = `${env.VINO_JP_SITE_URL}/tvii/getAccessTokenTW`;

            const params: Record<string, string> = {
                oauth_callback: `${callbackTWUrl}?code=${code}&env=${env.VINO_JP_CONFIG_ENV}`,
                oauth_consumer_key: env.VINO_JP_X_CONSUMER_KEY,
                oauth_nonce: nonce,
                oauth_signature_method: "HMAC-SHA1",
                oauth_timestamp: timestamp,
                oauth_version: "1.0",
            };

            const baseString = `POST&${encodeURIComponent("https://api.twitter.com/oauth/request_token")}&${encodeURIComponent(
                Object.keys(params)
                    .sort()
                    .map(
                        (key) =>
                            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
                    )
                    .join("&")
            )}`;

            const signingKey = `${encodeURIComponent(env.VINO_JP_X_CONSUMER_SECRET)}&`;
            const signature = generateHmacSha1Signature(baseString, signingKey);

            const authHeader = `OAuth oauth_nonce="${nonce}", oauth_callback="${encodeURIComponent(params["oauth_callback"])}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_consumer_key="${env.VINO_JP_X_CONSUMER_KEY}", oauth_signature="${signature}", oauth_version="1.0"`;

            const response = await fetch(
                "https://api.twitter.com/oauth/request_token",
                {
                    method: "POST",
                    headers: {
                        Authorization: authHeader,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const body = await response.text();
            const parsed = new URLSearchParams(body);
            const oauthToken = parsed.get("oauth_token");

            if (!oauthToken) {
                return res
                    .status(400)
                    .json({ error: "Failed to obtain request token." });
            }

            await db("oauth_associations").insert({
                code,
                type: "X",
                oauth_token: oauthToken,
                oauth_url: `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`,
                status: "unverified",
                created_at: db.fn.now(),
            });

            res.status(200).json({ code, type: "X" });
        } catch (error) {
            console.error("/XCodeCreate error:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.post(
    "/BSLoginCheck",
    upload.none(),
    async (_req: Request, res: Response): Promise<any> => {
        try {
            //Just checks if the account exists
            //Session is created and put on DB once the account actually gets created and inserted.
            const data = _req.body;
            const identifier = data.username;
            const passwd = data.password;

            if (!identifier || !passwd) {
                res.status(400).send({
                    error: "Identifier and password are required.",
                });
                return;
            }

            const bsky = new BskyClient();

            const check = await bsky.login(identifier, passwd);

            if (!check) {
                res.status(400).json({ error: "Invalid account." });
            }

            const info = await bsky.agent.getProfile({ actor: check.did });

            res.status(200).json({
                status: "verified",
                active: check.active,
                handle: check.handle,
                displayName: info.data.displayName,
            });
        } catch (error) {
            console.error("/BSLoginCheck error:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.post(
    "/sendPost",
    upload.none(),
    async (_req: Request, res: Response): Promise<any> => {
        try {
            //This endpoint handles posting a comment from a TV show.
            //Forwards to Bluesky and X, Miiverse is disabled/or handled by Vino itself.
            const data = _req.body;
            const text = data.text;
            const memo = data.memo;
            // const doodle = data.doodle;
            let content: string | null = null;
            let type: "text" | "memo" | null = null;

            //Check if post is either text or memo
            if (text && text.trim() !== "") {
                content = text.trim();
                type = "text";
            } else if (memo && memo.trim() !== "") {
                content = memo.trim();
                type = "memo";
            }

            if (!content) {
                return res
                    .status(400)
                    .json({ error: "No post content provided." });
            }

            res.status(200).json({ message: "Post received", type, content });
        } catch (error) {
            console.error("/sendPost error:", error);
            res.status(400).json({ error: "Internal server error." });
        }
    }
);

export { router as socials };
