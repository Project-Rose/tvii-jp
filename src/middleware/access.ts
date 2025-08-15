import { parseServiceToken } from "@/utils/serviceToken";
import { type Request, type Response, type NextFunction } from "express";
import db from "@/utils/db";
import { logger } from "@/utils/logger";
import { env } from "@/env";
import { join } from "path";

const environment = env.VINO_JP_CONFIG_ENV as "dev" | "stg" | "prod";

const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    const requiredHeaders = [
        "x-nintendo-country-code",
        "x-nintendo-service-token",
        "x-nintendo-current-principal-id",
    ];

    for (const header of requiredHeaders) {
        if (!req.headers[header]) {
            logger.warn("Missing required header: %s", header);
            return res
                .status(400)
                .sendFile(
                    join(__dirname, "..", "..", "pages", "error", "pc_en.html")
                );
        }
    }

    const serviceToken = parseServiceToken(req);

    if (
        !serviceToken.pid ||
        !serviceToken.serial_number ||
        !serviceToken.access_key
    ) {
        logger.warn("Invalid service token: %j", serviceToken);
        return res
            .status(400)
            .sendFile(
                join(__dirname, "..", "..", "pages", "error", "pc_en.html")
            );
    }

    if (
        serviceToken.pid.toString().length !== 10 ||
        (serviceToken.serial_number.length !== 11 &&
            serviceToken.serial_number.length !== 12) ||
        serviceToken.access_key.length !== 17
    ) {
        logger.warn("Invalid token format: %j", serviceToken);
        return res
            .status(400)
            .sendFile(
                join(__dirname, "..", "..", "pages", "error", "pc_en.html")
            );
    }

    const pidFromHeader = parseInt(
        String(req.headers["x-nintendo-current-principal-id"]),
        16
    ).toString();
    const pidFromToken = serviceToken.pid.toString();

    if (pidFromHeader !== pidFromToken) {
        logger.warn(
            "PID mismatch: header=%s, token=%s",
            pidFromHeader,
            pidFromToken
        );
        return res
            .status(400)
            .sendFile(
                join(__dirname, "..", "..", "pages", "error", "pc_en.html")
            );
    }

    const whitelistRow = await db("whitelist")
        .where("pid", serviceToken.pid)
        .andWhere("access_key", serviceToken.access_key)
        .first();

    const whitelistEnv = (whitelistRow?.env ?? "prod") as
        | "dev"
        | "stg"
        | "prod";

    const account = await db("account").where("pid", serviceToken.pid).first();

    const accountEnv = account?.env ?? whitelistEnv;

    const allowedEnvs: Record<"dev" | "stg" | "prod", string[]> = {
        dev: ["dev", "stg", "prod"],
        stg: ["stg", "prod"],
        prod: ["prod"],
    };

    if (!whitelistEnv || !allowedEnvs[whitelistEnv].includes(environment)) {
        logger.warn(
            "User %s tried to access %s without whitelist permission",
            serviceToken.pid,
            environment
        );
        return res
            .status(200)
            .sendFile(
                join(
                    __dirname,
                    "..",
                    "..",
                    "pages",
                    "error",
                    "unauthorized_en.html"
                )
            );
    }

    if (accountEnv !== environment) {
        logger.warn(
            "User %s is supposed to be in %s but tried to access %s",
            serviceToken.pid,
            accountEnv,
            environment
        );
        return res
            .status(200)
            .sendFile(
                join(
                    __dirname,
                    "..",
                    "..",
                    "pages",
                    "error",
                    "unauthorized_en.html"
                )
            );
    }

    return next();
};

export { middleware as access };
