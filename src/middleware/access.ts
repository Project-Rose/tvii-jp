import { env } from "@/env";
import { type Request, type Response, type NextFunction } from "express";

const middleware = (req: Request, res: Response, next: NextFunction): void => {
    if (env.VINO_JP_CONFIG_BLOCK_PC === "true") {
        const userAgent = req.get("User-Agent");

        if (
            userAgent !==
            "Mozilla/5.0 (Nintendo WiiU) AppleWebKit/534.52 (KHTML, like Gecko) NX/2.1.0.10.9 vn/1.5.US"
        ) {
            res.status(403)
                .contentType("text/plain")
                .send(
                    "Please use Project Rosé on a Nintendo Wii U system!\n\nFor support, join our Discord!\nhttps://discord.gg/AaTsXndGun"
                );
            return;
        }

        const requiredHeaders = [
            "x-nintendo-principal-id-09",
            "x-nintendo-principal-id-12",
            "x-nintendo-principal-id-02",
            "x-nintendo-principal-id-01",
            "x-nintendo-principal-id-03",
            "x-nintendo-principal-id-04",
            "x-nintendo-country-code",
            "x-nintendo-principal-id-08",
            "x-nintendo-service-token",
            "x-nintendo-principal-id-06",
            "x-nintendo-returned-from-other",
            "x-nintendo-white-list-get-count",
            "x-nintendo-principal-id-07",
            "x-nintendo-current-principal-id",
            "x-nintendo-principal-id-10",
            "x-nintendo-principal-id-11",
            "x-nintendo-principal-id-05",
            "x-nintendo-release-version",
        ];

        for (const header of requiredHeaders) {
            if (!(header in req.headers)) {
                res.status(403)
                    .contentType("text/plain")
                    .send(
                        "Please use Project Rosé on a Nintendo Wii U system!\n\nFor support, join our Discord!\nhttps://discord.gg/AaTsXndGun"
                    );
                return;
            }
        }

        return next();
    }

    return next();
};
export { middleware as access };
