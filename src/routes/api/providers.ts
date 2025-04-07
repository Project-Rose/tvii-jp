import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { env } from "@/env";
import { logger } from "@/utils/logger";

const router: Router = express.Router();

router.get("/:zipcode", async (req: Request, res: Response) => {
    const { zipcode } = req.params;

    const zipcodeSchema = z.string().regex(/^[0-9]{5}$/);
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
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/${result.data}/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        const data = await response.json();

        res.status(200).json({
            endpoint: "/api/v1/providers/:zipcode",
            hasError: 0,
            result: data.data.items,
            zipcode: result.data,
            country: data.country || null,
        });

        return;
    } catch (e: unknown) {
        logger.error(`Error in /api/v1/providers/${result.data}: ${e}`);

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

router.get("/lineup/:providerId", async (req: Request, res: Response) => {
    const { providerId } = req.params;
    const { start = Math.floor(Date.now() / 1000), duration = 120 } = req.query;

    const providerIdSchema = z.string().regex(/^[0-9]{10}$/);
    const querySchema = z.object({
        start: z.coerce.number().int().positive(),
        duration: z.coerce.number().int().min(30).max(1440),
    });

    const idResult = providerIdSchema.safeParse(providerId);
    const queryResult = querySchema.safeParse({ start, duration });

    if (!idResult.success) {
        res.status(400).json({
            endpoint: "/api/v1/providers/lineup/:providerId",
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Provider ID",
            },
        });
        return;
    }

    if (!queryResult.success) {
        res.status(400).json({
            endpoint: "/api/v1/providers/lineup/:providerId",
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Query Parameters",
            },
        });
        return;
    }

    try {
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/${idResult.data}/web?start=${queryResult.data.start}&duration=${queryResult.data.duration}&apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        const data = await response.json();

        res.status(200).json({
            endpoint: "/api/v1/providers/lineup/:providerId",
            hasError: 0,
            result: data.data.items,
            providerId: idResult.data,
            start: queryResult.data.start,
            duration: queryResult.data.duration,
        });

        return;
    } catch (e: unknown) {
        logger.error(
            `Error in /api/v1/providers/lineup/${idResult.data}: ${e}`
        );

        res.status(500).json({
            endpoint: "/api/v1/providers/lineup/:providerId",
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
