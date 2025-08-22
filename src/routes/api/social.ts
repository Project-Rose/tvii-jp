import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { env } from "@/env";
import crypto from "crypto";
import { BskyClient } from "@/utils/bsky";
import { parseServiceToken } from "@/utils/serviceToken";
import db from "@/utils/db";
import { TwitterApi } from "twitter-api-v2";

// Key must be 32 bytes for AES-256
const AES_KEY = Buffer.from(env.VINO_JP_CONFIG_BSKY_AES_KEY, "base64");

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // new IV every time
    const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    // Store IV along with ciphertext
    return iv.toString("base64") + ":" + encrypted;
}

function decrypt(data: string): string {
    const [ivBase64, encryptedData] = data.split(":");
    const iv = Buffer.from(ivBase64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, iv);
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

function buildSocialPost(
    maxLength: number,
    topicTag: string | null,
    body: string | null,
    hasBody: boolean
): string {
    const MIN_TAG_LEN = 40;
    const MAX_BODY_LEN = 200;
    const MAX_TWEET_LEN = maxLength;

    topicTag = topicTag || "a TV program";
    body = body || "";

    const prefix = hasBody
        ? 'Posted while watching "'
        : 'Made a drawing while watching "';
    const suffix = " #NintendoTVii"; // always the same now

    let tweetText: string;

    if (hasBody) {
        // Cap body length first
        if (body.length > MAX_BODY_LEN) {
            body = body.slice(0, MAX_BODY_LEN - 1) + "…";
        }

        // Compute available length for topicTag considering prefix + body + 2 quotes + suffix
        const fixedLen = prefix.length + body.length + 2 + suffix.length; // 2 quotes for topic and body
        let availableTagLen = MAX_TWEET_LEN - fixedLen;

        if (availableTagLen < MIN_TAG_LEN) {
            availableTagLen = MIN_TAG_LEN; // force minimum
        }

        if (topicTag.length > availableTagLen) {
            topicTag = topicTag.slice(0, availableTagLen - 1) + "…";
        }

        tweetText = `${prefix}${topicTag}": "${body}"${suffix}`;
    } else {
        // No body — topic can take almost everything
        const fixedLen = prefix.length + 2 + suffix.length; // 2 quotes
        let availableTagLen = MAX_TWEET_LEN - fixedLen;

        if (topicTag.length > availableTagLen) {
            topicTag = topicTag.slice(0, availableTagLen - 1) + "…";
        }

        tweetText = `${prefix}${topicTag}"${suffix}`;
    }

    return tweetText;
}

const router: Router = express.Router();

const upload = multer();

import {
    S3Client,
    ObjectCannedACL,
    PutObjectCommand,
} from "@aws-sdk/client-s3";

// Create S3 client for MinIO
const s3 = new S3Client({
    endpoint: "https://cdn.projectrose.cafe", // change to your MinIO URL
    region: "us-east-1", // MinIO ignores, but AWS SDK requires it
    credentials: {
        accessKeyId: "N5kQaXuIAUhjUwvmbKYaKnRWpisFcwz7", // replace with your MinIO Access Key
        secretAccessKey: "4wIGayt4U7qYx0aRkqHOhXVimyob2NfW", // replace with your MinIO Secret Key
    },
    forcePathStyle: true, // REQUIRED for MinIO
});

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
    "/postsAlt",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            if (
                !token ||
                !token.access_key ||
                !token.serial_number ||
                !token.pid
            ) {
                console.warn(
                    `/postAlt Access Key/Serial Number/PID doesn't exist for: ${token.pid} ${token.serial_number}`
                );
                return res.status(500).json({
                    status: "error",
                    error: "Header Serial Number or PID are undefined",
                });
            }

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(200).json({ status: "no_account_yet" });
            }

            const userSettings = await db("settings")
                .where({ user_id: account.user_id })
                .first();

            let userClient = null;
            let bskyAgent = null;
            let resumedSession = null;

            //Dont care about x api success/error since its most likely to error
            //Due to rate limit (thanks GAYlon musk)
            if (userSettings?.x_oauth_secret) {
                userClient = new TwitterApi({
                    appKey: env.VINO_JP_X_CONSUMER_KEY,
                    appSecret: env.VINO_JP_X_CONSUMER_SECRET,
                    accessToken: userSettings.x_oauth_token,
                    accessSecret: userSettings.x_oauth_secret,
                });
            }

            //Check for bsky errors (because bsky is good)
            //Only if user did link bsky to their account
            if (userSettings.bsky_auth_session_json != null) {
                const session = JSON.parse(
                    decrypt(userSettings.bsky_auth_session_json)
                );
                bskyAgent = new BskyClient();

                try {
                    // First try resuming the saved session
                    resumedSession =
                        await bskyAgent.agent.resumeSession(session);
                } catch (resumeErr) {
                    console.log(
                        "could not resume bsky session (will try to create new session):",
                        resumeErr
                    );

                    try {
                        // Fallback: decrypt stored credentials
                        const username = userSettings.bsky_username;
                        const password = decrypt(
                            userSettings.bsky_password_hashed
                        );

                        // Login fresh
                        resumedSession = await bskyAgent.login(
                            username,
                            password
                        );

                        // Save the new session back to DB (encrypted)
                        await db("settings")
                            .where({ user_id: account.user_id })
                            .update({
                                bsky_auth_session_json: encrypt(
                                    JSON.stringify(resumedSession)
                                ),
                            });
                    } catch (loginErr) {
                        console.log(
                            "could not login with bsky stored credentials (changed pass/no app password):",
                            loginErr
                        );

                        // If both fail, return JSON response immediately
                        return res.status(401).json({
                            status: "bsky_credentials_expired",
                            error: "Bluesky auth failed. Please log in again from Menu>Settings.",
                        });
                    }
                }
            }
            //If no bsky linked skip

            if (!userSettings) {
                return res.status(400).json({
                    status: "error",
                    error: "Could not get user settings.",
                });
            }

            const postForm = req.body;
            const searchKeys = [].concat(postForm.search_key || []);

            const feelingId = parseInt(postForm.feeling_id, 10);
            const safeFeelingId = isNaN(feelingId) ? 0 : feelingId;

            const isSpoiler = parseInt(postForm.is_spoiler, 10);
            const safeIsSpoiler = isNaN(isSpoiler) ? 0 : isSpoiler;

            const hasBody = postForm.body && postForm.body.trim().length > 0;
            const hasPainting =
                postForm.painting && postForm.painting.trim().length > 0;

            if (!hasBody && !hasPainting) {
                return res.status(400).json({
                    status: "error",
                    error: "Post must have a body or a painting.",
                });
            }

            let memoCdnKey = null;
            let paintingBuffer = null;

            if (hasPainting) {
                try {
                    const base64Image = postForm.painting.replace(
                        /^data:image\/png;base64,/,
                        ""
                    );
                    paintingBuffer = Buffer.from(base64Image, "base64");

                    memoCdnKey = `${token.pid}_${Date.now()}.png`;
                    const bucketName = "tvii-jp";

                    const uploadParams = {
                        Bucket: bucketName,
                        Key: memoCdnKey,
                        Body: paintingBuffer,
                        ContentType: "image/png",
                        ACL: "public-read" as ObjectCannedACL,
                    };

                    await s3.send(new PutObjectCommand(uploadParams));
                    console.log(
                        `✅ PostAlt Memo PNG Uploaded ${memoCdnKey} to ${bucketName}`
                    );
                } catch (err) {
                    console.error(
                        "❌ PostAlt Error uploading PNG (memo):",
                        err
                    );
                    return res.status(500).json({
                        status: "error",
                        error: "Could not upload painting to CDN.",
                    });
                }
            }

            const post = await db("posts").insert({
                user_id: account.user_id,
                create_time: new Date(),
                search_keys: JSON.stringify(searchKeys),
                body: hasBody ? postForm.body : null,
                painting: memoCdnKey,
                feeling_id: safeFeelingId,
                is_spoiler: safeIsSpoiler,
                topic_tag:
                    postForm.topic_tag && postForm.topic_tag.length
                        ? postForm.topic_tag
                        : "",
            });

            if (post && post.length > 0) {
                const postIdForLink = post[0];

                const getFeelingQueryFromNumber = (
                    feeling_id: number
                ): string => {
                    switch (feeling_id) {
                        case 1:
                            return "smile_open_mouth";
                        case 2:
                            return "like_wink_left";
                        case 3:
                            return "surprise_open_mouth";
                        case 4:
                            return "frustrated";
                        case 5:
                            return "sorrow";
                        default:
                            return "normal";
                    }
                };

                try {
                    const webhookUrl = env.VINO_JP_CONFIG_DC_WEBHOOK_URL;

                    const miiName = account.mii_name || "Unknown Mii";
                    const miiImage = `https://mii-unsecure.ariankordi.net/miis/image.png?verifyCRC16=0&width=128&expression=${getFeelingQueryFromNumber(feelingId)}&data=${encodeURIComponent(account.mii_data)}&type=face`;

                    const isSpoilerPost = safeIsSpoiler === 1;

                    let embed: any;

                    if (isSpoilerPost) {
                        embed = {
                            author: { name: miiName, icon_url: miiImage },
                            title: postForm.topic_tag || "Untitled Topic",
                            url: `https://projectrose.cafe/tvii/olv/topic/${encodeURIComponent(postForm.topic_tag)}`,
                            description: `**[Spoiler, View in browser](https://projectrose.cafe/tvii/olv/post/${encodeURIComponent(postIdForLink)})**`,
                            color: 0xe756d4,
                            timestamp: new Date().toISOString(),
                        };
                    } else {
                        let description = hasBody ? postForm.body : "";
                        description += `\n\n[View in browser](https://projectrose.cafe/tvii/olv/post/${encodeURIComponent(postIdForLink)})`;

                        embed = {
                            author: { name: miiName, icon_url: miiImage },
                            title: postForm.topic_tag || "Untitled Topic",
                            url: `https://projectrose.cafe/tvii/olv/topic/${encodeURIComponent(postForm.topic_tag)}`,
                            description,
                            color: 0xe756d4,
                            timestamp: new Date().toISOString(),
                        };

                        if (memoCdnKey) {
                            embed.image = {
                                url: `https://cdn.projectrose.cafe/tvii-jp/${memoCdnKey}`,
                            };
                        }
                    }

                    await fetch(webhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ embeds: [embed] }),
                    });
                } catch (err) {
                    console.error("❌ Failed to send Discord webhook:", err);
                }

                // Social posting logic
                if (hasBody && !hasPainting) {
                    const bText = buildSocialPost(
                        300,
                        postForm.topic_tag,
                        postForm.body,
                        true
                    );
                    const xText = buildSocialPost(
                        280,
                        postForm.topic_tag,
                        postForm.body,
                        true
                    );

                    //Bsky
                    if (bskyAgent && resumedSession) {
                        try {
                            const bskyResult = await bskyAgent.sendPost(bText);
                            console.log("bsky text upload! ", bskyResult);
                        } catch (e) {
                            console.log("bsky text upload error: ", e);
                        }
                    }
                    //Twitter
                    if (userClient) {
                        try {
                            const tweetResult =
                                await userClient.v2.tweet(xText);
                            console.log("twitter text upload! ", tweetResult);
                        } catch (e) {
                            console.log("twitter text upload error: ", e);
                        }
                    }
                } else if (!hasBody && hasPainting && paintingBuffer) {
                    const bText = buildSocialPost(
                        300,
                        postForm.topic_tag,
                        null,
                        false
                    );
                    const xText = buildSocialPost(
                        280,
                        postForm.topic_tag,
                        null,
                        false
                    );

                    if (bskyAgent && resumedSession) {
                        try {
                            const bskyResult =
                                await bskyAgent.sendPostWithImage(
                                    bText,
                                    "User drawing from Nintendo TVii while watching " +
                                        postForm.topic_tag,
                                    paintingBuffer
                                );
                            console.log("bsky memo upload! ", bskyResult);
                        } catch (e) {
                            console.log("bsky memo upload error: ", e);
                        }
                    }
                    if (userClient) {
                        try {
                            const mediaId = await userClient.v1.uploadMedia(
                                paintingBuffer,
                                { type: "png" }
                            );
                            const tweetResult = await userClient.v2.tweet({
                                text: xText,
                                media: { media_ids: [mediaId] },
                            });
                            console.log("twitter memo upload! ", tweetResult);
                        } catch (e) {
                            console.log("twitter memo upload error: ", e);
                        }
                    }
                }

                res.status(200).json({
                    status: "success",
                    post_id: postIdForLink,
                });
            } else {
                console.error("Post Insert failed");
                res.status(500).json({
                    status: "error",
                    error: "Post did not insert properly to DB.",
                });
            }
        } catch (error) {
            console.error("/postsAlt error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error.",
            });
        }
    }
);

router.get("/postsAlt", async (req: Request, res: Response): Promise<any> => {
    try {
        const { limit, search_key } = req.query;

        if (!search_key || typeof search_key !== "string") {
            return res.status(400).json({
                status: "error",
                error: "A single search_key is required",
            });
        }

        const safeLimit = Math.min(parseInt(limit as string, 10) || 50, 200);

        const posts = await db("posts")
            .innerJoin("account", "posts.user_id", "account.user_id")
            .whereRaw("JSON_VALID(posts.search_keys)")
            .andWhereRaw("JSON_CONTAINS(posts.search_keys, ?)", [
                `"${search_key}"`,
            ])
            .orderBy("posts.create_time", "desc")
            .limit(safeLimit)
            .select(
                "posts.post_id",
                "posts.user_id",
                "posts.create_time",
                "posts.body",
                "posts.painting",
                "posts.feeling_id",
                "posts.is_spoiler",
                "posts.search_keys",
                "posts.topic_tag",
                "account.mii_data",
                "account.mii_name",
                db.raw(
                    "COALESCE(JSON_ARRAYAGG(JSON_OBJECT('user_id', empathy_account.user_id, 'mii_name', empathy_account.mii_name, 'mii_data', empathy_account.mii_data) ORDER BY empathy_account.mii_name ASC), JSON_ARRAY()) AS empathy_givers"
                )
            )
            .leftJoin("empathies", "posts.post_id", "empathies.post_id")
            .leftJoin(
                { empathy_account: "account" },
                "empathies.user_id",
                "empathy_account.user_id"
            )
            .groupBy("posts.post_id");

        const output = posts.map((post) => {
            const empathies: {
                user_id: number | null;
                mii_name: string | null;
                mii_data: string | null;
            }[] = post.empathy_givers ? JSON.parse(post.empathy_givers) : [];

            const filteredEmpathies = empathies.filter(
                (e) => e.user_id !== null
            );

            return {
                post_id: post.post_id,
                user_id: post.user_id,
                create_time: post.create_time,
                body: post.body || null,
                painting: post.painting || null,
                feeling_id: post.feeling_id,
                is_spoiler: post.is_spoiler,
                topic_tag: post.topic_tag,
                mii_data: post.mii_data,
                mii_name: post.mii_name,
                empathies: filteredEmpathies,
            };
        });

        res.status(200).json(output);
    } catch (error) {
        console.error("/postsAlt GET error:", error);
        res.status(500).json({
            status: "error",
            error: "Internal server error.",
        });
    }
});

router.post(
    "/postsAlt/:postId/empathies",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            if (
                !token ||
                !token.access_key ||
                !token.serial_number ||
                !token.pid
            ) {
                console.warn(
                    `/postAlt/${req.params["postId"]}/empathies Access Key/Serial Number/PID doesn't exist for: ${token.pid} ${token.serial_number}`
                );
                return res.status(400).json({
                    status: "error",
                    error: "Header Serial Number or PID are undefined",
                });
            }

            const postId = Number(req.params["postId"]);

            const post = await db("posts").where({ post_id: postId }).first();

            if (!post) {
                return res.status(404).json({ error: "Post not found." });
            }

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(401).json({ status: "no_account_yet" });
            }

            const existing = await db("empathies")
                .where({ user_id: account.user_id, post_id: postId })
                .first();

            if (existing) {
                //what the miiverse yeah endpoint does anyway
                res.status(200).json({ status: "success" });
            }

            await db("empathies").insert({
                user_id: account.user_id,
                post_id: postId,
                create_time: new Date(),
            });

            res.status(200).json({ status: "success" });
        } catch (e) {
            console.error("error yeah-ing post");
            res.status(500).json({ status: "error" });
        }
    }
);

router.delete(
    "/postsAlt/:postId/empathies",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            if (
                !token ||
                !token.access_key ||
                !token.serial_number ||
                !token.pid
            ) {
                console.warn(
                    `/postAlt/${req.params["postId"]}/empathies Access Key/Serial Number/PID doesn't exist for: ${token.pid} ${token.serial_number}`
                );
                return res.status(400).json({
                    status: "error",
                    error: "Header Serial Number or PID are undefined",
                });
            }

            const postId = Number(req.params["postId"]);

            const post = await db("posts").where({ post_id: postId }).first();

            if (!post) {
                return res.status(404).json({ error: "Post not found." });
            }

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(401).json({ status: "no_account_yet" });
            }

            const existing = await db("empathies")
                .where({ user_id: account.user_id, post_id: postId })
                .first();

            if (!existing) {
                // is this the right error code?
                res.status(500).json({ status: "empathy does not exist" });
            }

            await db("empathies")
                .where({ user_id: account.user_id, post_id: postId })
                .del();

            res.status(200).json({ status: "success" });
        } catch (e) {
            console.error("error un-yeah-ing post");
            res.status(500).json({ status: "error" });
        }
    }
);

export { router as socials };
