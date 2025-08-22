import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
//@ts-ignore
import Mii from "mii-js";
import { parseServiceToken } from "@/utils/serviceToken";
import db from "@/utils/db";
import { z } from "zod";
import { BskyClient } from "@/utils/bsky";
import { env } from "@/env";
import crypto from "crypto";

// Key must be 32 bytes for AES-256
const AES_KEY = Buffer.from(env.VINO_JP_CONFIG_BSKY_AES_KEY, 'base64');

function encrypt(text: string) {
    const iv = crypto.randomBytes(16); // new IV every time
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    // Store IV along with ciphertext
    return iv.toString('base64') + ':' + encrypted;
}

function decrypt(data: string) {
    const [ivBase64, encryptedData] = data.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const router: Router = express.Router();

const upload = multer();

router.post(
    "/createAccount",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const actSchema = z.object({
                pid: z.string().length(10),
                country: z.string().length(2),
                lang: z.string().length(2),
                mii_bday: z.string(),
                mii_name: z.string().length(10),
                mii_data: z.string(),
                serial_number: z.string(),
                access_key: z.string(),
                utc_offset: z.number(),
                env: z.enum(["prod", "stg", "dev"]),
            });

            //Creates a new Nintendo TVii account instance for that console
            const data = req.body;
            const token = parseServiceToken(req);

            if (
                !token ||
                !token.serial_number ||
                !token.pid ||
                !token.access_key
            ) {
                console.warn(
                    `/createAccount Access Key/Serial Number/PID doesnt exist for : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Access Key/Serial Number/PID are undefined",
                });
                return;
            }

            const serialNumber = token.serial_number;
            const accessKey = token.access_key;

            const formPid = data.pid;
            const headerPid = token.pid;

            if (formPid != headerPid) {
                console.warn(
                    `Unintended Behavior (PID Mismatch): ${formPid}, ${headerPid}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Header PID and Applet PID do not match. Unintended behavior.",
                });
                return;
            }

            const existing = await db("account")
                .where({ pid: headerPid })
                .first();

            if (existing) {
                console.warn(
                    `Account already exists for: ${token.pid} set up from Serial Number ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error",
                    error: "User with this PID already exists",
                });
                return;
            }

            const checkPID = await fetch(
                `https://mii-unsecure.ariankordi.net/mii_data/?pid=${headerPid}&api_id=1&force_refresh=1`
            );
            if (!checkPID.ok) {
                console.warn(
                    `Mii Unsecure Pretendo fetching error for : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error_not_pretendo",
                    error: "PID is not from a valid Pretendo Network ID, user is using a NNID or invalid account, or error fetching Mii data.",
                });
                return;
            }

            const checkPIDData = await checkPID.json();

            const mii_name = checkPIDData.name;
            const mii_data = checkPIDData.data;

            const mii = new Mii(Buffer.from(mii_data, "base64"));
            const mii_bday = mii.birthDay + "/" + mii.birthMonth;

            let country = req.headers["x-nintendo-country-code"] as string;

            // Assuming data.country exists and contains the country from some other source
            if (
                data.country &&
                country.toUpperCase() !== data.country.toUpperCase()
            ) {
                res.status(500).json({
                    status: "error",
                    error: "Country code mismatch: request header does not match user's country.",
                });
                return;
            }

            const rawLang = (req.headers["accept-language"] ?? "") as string;

            let lang =
                rawLang.includes(",") || rawLang.includes("-")
                    ? rawLang.split(",")[0].split("-")[0].toLowerCase()
                    : rawLang.toLowerCase();

            if (!lang) lang = "en";

            //Stored on DB until it expires by user decision.
            const xOauthToken =
                data.xOauthToken === "" ? null : data.xOauthToken;
            const xOauthSecret =
                data.xOauthSecret === "" ? null : data.xOauthSecret;
            const xUserId = data.xUserId === "" ? null : data.xUserId;

            //Used for creating the session, will be stored in DB to refresh token.
            let hashedBskyPass = null;
            let hashedBskySess = null;
            let bskyUsername = data.bskyUsernameTemp ? data.bskyUsernameTemp : null;
            let bskySession = null;
            //If user did log in to Bluesky
            if (data.bskyUsernameTemp && data.bskyPasswordTemp && data.bskyUsernameTemp.length && data.bskyPasswordTemp.length) {
                let bsky = new BskyClient();

                bskySession = await bsky.login(
                    data.bskyUsernameTemp,
                    data.bskyPasswordTemp
                );

                if (!bskySession) {
                    console.warn(
                        `Error fetching bsky login for: ${token.pid} ${token.serial_number} ${bskySession}`
                    );
                }

                hashedBskyPass = encrypt(data.bskyPasswordTemp);
                hashedBskySess = encrypt(JSON.stringify(bskySession));
            }

            const tvProviderIdChosen = data.tv_provider_id;

            // Extract the user's IP
            let ip =
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.ip;

            // If x-forwarded-for contains multiple IPs, take the first
            if (typeof ip === "string" && ip.includes(",")) {
                ip = ip.split(",")[0];
            }

            // Strip IPv6 prefix
            if (typeof ip === "string" && ip.startsWith("::ffff:")) {
                ip = ip.substring(7);
            }

            const ipReq = await fetch(`https://ipwho.is/${ip}`);
            const ipInfo = await ipReq.json();
            let utc_offset;

            if (
                ipInfo &&
                ipInfo.success &&
                ipInfo.timezone &&
                typeof ipInfo.timezone.offset === "number"
            ) {
                utc_offset = ipInfo.timezone.offset;
            } else {
                res.status(500).json({
                    status: "error",
                    error: "Could not get the users UTC offset.",
                });
            }

            const userEnv = env.VINO_JP_CONFIG_ENV;

            const result = actSchema.safeParse({
                mii_name,
                mii_bday,
                mii_data,
                serial_number: serialNumber,
                access_key: accessKey,
                country,
                lang,
                pid: headerPid,
                utc_offset,
                env: userEnv,
            });

            if (!result) {
                console.warn(
                    `Invalid data submitted for : ${token.pid} ${token.serial_number} ${result}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Missing or invalid fields.",
                });
                return;
            }

            const dbTime = await db.raw("SELECT NOW() AS now");
            const dbTimeDate = new Date(dbTime[0][0].now);

            const createdAccount = await db("account").insert({
                pid: headerPid,
                country,
                lang,
                mii_data,
                mii_name,
                mii_bday,
                utc_offset,
                serial_number: serialNumber,
                access_key: accessKey,
                last_data_update: dbTimeDate,
                env: userEnv,
            });

            const userId = createdAccount[0];

            if (!userId) {
                console.warn(
                    `Failed to insert account to DB : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Account creation failed, could not insert to the DB",
                });
                return;
            }

            console.log("Insert successful. New user ID:", userId);

            const createdSettings = await db("settings").insert({
                user_id: userId,
                tv_provider_id: tvProviderIdChosen,
                x_oauth_token: xOauthToken,
                x_oauth_secret: xOauthSecret,
                x_user_id: xUserId,
                bsky_auth_session_json: hashedBskySess,
                bsky_password_hashed: hashedBskyPass,
                bsky_username: bskyUsername,
            });

            if (
                !Array.isArray(createdSettings) ||
                createdSettings.length === 0
            ) {
                console.warn(
                    `Failed to submit settings information on database : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    error: "Account creation failed, account created but settings could not be inserted.",
                });
                return;
            }

            res.status(200).json({
                status: "verified",
                user_id: userId,
            });
        } catch (error) {
            console.error("/createAccount error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error",
            });
        }
    }
);

router.post(
    "/checkLogIn",
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
                    `/checkLogIn Access Key/Serial Number/PID doesn't exist for: ${token.pid} ${token.serial_number}`
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

            let utc_offset = account.utc_offset;

            // Get new values from headers
            const country = req.headers["x-nintendo-country-code"];
            const rawLang = (req.headers["accept-language"] ?? "") as string;
            const lang =
                rawLang.includes(",") || rawLang.includes("-")
                    ? rawLang.split(",")[0].split("-")[0].toLowerCase()
                    : rawLang.toLowerCase();

            // Update if changed
            if (account.country !== country || account.lang !== lang) {
                await db("account")
                    .where({
                        pid: token.pid,
                        serial_number: token.serial_number,
                        access_key: token.access_key,
                    })
                    .update({ country, lang });
            }

            // Use db time: fetch current timestamp from DB
            const result = await db.raw("SELECT NOW() AS now");
            const now = new Date(result[0][0].now);
            const lastUpdate = account.last_data_update
                ? new Date(account.last_data_update)
                : new Date(0); // very old date if null

            const oneHour = 60 * 60 * 1000;
            if (now.getTime() - lastUpdate.getTime() > oneHour) {
                const updateMiiData = await fetch(
                    `https://mii-unsecure.ariankordi.net/mii_data/?pid=${token.pid}&api_id=1&force_refresh=1`
                );

                if (!updateMiiData.ok) {
                    await db("account")
                        .where({
                            pid: token.pid,
                            serial_number: token.serial_number,
                            access_key: token.access_key,
                        })
                        .update({
                            last_data_update: db.fn.now(),
                        });
                    return;
                }

                const PIDData = await updateMiiData.json();
                const mii_name = PIDData.name;
                const mii_data = PIDData.data;

                const mii = new Mii(Buffer.from(mii_data, "base64"));
                const mii_bday = mii.birthDay + "/" + mii.birthMonth;
                // Extract the user's IP
                let ip =
                    req.headers["x-forwarded-for"] ||
                    req.connection.remoteAddress ||
                    req.ip;

                // If x-forwarded-for contains multiple IPs, take the first
                if (typeof ip === "string" && ip.includes(",")) {
                    ip = ip.split(",")[0];
                }

                // Strip IPv6 prefix
                if (typeof ip === "string" && ip.startsWith("::ffff:")) {
                    ip = ip.substring(7);
                }

                const ipReq = await fetch(`https://ipwho.is/${ip}`);
                const ipInfo = await ipReq.json();

                if (
                    !ipInfo ||
                    !ipInfo.success ||
                    !ipInfo.timezone ||
                    typeof ipInfo.timezone.offset !== "number"
                ) {
                    await db("account")
                        .where({
                            pid: token.pid,
                            serial_number: token.serial_number,
                            access_key: token.access_key,
                        })
                        .update({
                            last_data_update: db.fn.now(),
                        });
                    return;
                }

                utc_offset = ipInfo.timezone.offset;

                await db("account")
                    .where({
                        pid: token.pid,
                        serial_number: token.serial_number,
                        access_key: token.access_key,
                    })
                    .update({
                        mii_name,
                        mii_data,
                        mii_bday,
                        utc_offset,
                        last_data_update: db.fn.now(),
                    });

                console.log(
                    `PNID Data and UTC offset updated for PID: ${token.pid}`
                );
            }

            const userSettings = await db("settings")
                .where({ user_id: account.user_id })
                .first();

            if (!userSettings) {
                return res
                    .status(400)
                    .json({
                        status: "error",
                        error: "Could not get user settings.",
                    });
            }

            res.status(200).json({
                status: "verified",
                profile: {
                    utc_offset,
                    user_id: userSettings.user_id,
                    tv_provider_id: userSettings.tv_provider_id,
                },
            });
        } catch (error) {
            console.error("/checkLogIn error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error.",
            });
        }
    }
);

router.get("/reminders", async (req: Request, res: Response): Promise<any> => {
    console.log("hi aroma plugin", req);
    try {
        res.status(200).json({
            status: "success",
            reminders: [
                {
                    name: "Family Guy",
                    time: 1754011800,
                    utc_offset: -18000,
                },
            ],
        });
    } catch (error) {
        console.error("/reminders error:", error);
        res.status(500).json({
            status: "error",
            error: "Internal server error.",
        });
    }
});

export { router as account };
