import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { env } from "@/env";
import { logger } from "@/utils/logger";

const router: Router = express.Router();

const zipcodeSchema = z.string().regex(/^[0-9]{5}$/);

router.get("/:zipcode", async (req: Request, res: Response) => {
    const { zipcode } = req.params;

    const result = zipcodeSchema.safeParse(zipcode);

    if (!result.success) {
        res.status(400).json({
            endpoint: "/api/v1/providers/:zipcode",
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Zipcode Format",
            },
        });

        return;
    }

    try {
        const data = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/${zipcode}/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        const response = await data.json();

        res.status(200).json({
            endpoint: "/api/v1/providers/:zipcode",
            hasError: 0,
            result: response.data.items,
            zipcode: zipcode,
            country: response.country || null,
        });

        return;
    } catch (e: unknown) {
        logger.error(
            `Error in /api/v1/providers/${req.params["zipcode"]}: ${e}`
        );

        res.status(500).json({
            endpoint: "/api/v1/providers/:zipcode",
            hasError: 1,
            result: {
                error: 500,
                message: "Internal Server Error",
            },
        });

        return;
    }
});

export { router as providers };
