import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { env } from "@/env";
import { logger } from "@/utils/logger";

const router: Router = express.Router();

interface Channel {
    fullName: string;
    name: string;
    number: string;
    sourceId: number;
    legacySourceId: number | null;
    networkName: string;
    networkId: number;
    logo: string;
}

interface ProgramSchedule {
    airingAttrib: number;
    catId: number;
    startTime: number;
    endTime: number;
    programId: number;
    title: string;
    rating: string | null;
    programDetails: string;
}

interface LineupItem {
    channel: Channel;
    programSchedules: ProgramSchedule[];
}

// Define all schemas in one place
const schemas = {
    zipcode: z.string().regex(/^[0-9]{5}$/),
    providerId: z.string().regex(/^[0-9]{10}$/),
    queryParams: z.object({
        start: z.coerce.number().int().positive(),
        duration: z.coerce.number().int().min(30).max(1440),
    }),
};

router.get("/:zipcode", async (req: Request, res: Response) => {
    const { zipcode } = req.params;
    const endpoint = "/api/v1/providers/:zipcode";

    // Validate zipcode
    const validationResult = schemas.zipcode.safeParse(zipcode);

    if (!validationResult.success) {
        res.status(400).json({
            endpoint,
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Zipcode Format",
            },
        });
        return;
    }

    const validatedZipcode = validationResult.data;

    try {
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/${validatedZipcode}/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        res.status(200).json({
            endpoint,
            hasError: 0,
            result: data.data.items,
            zipcode: validatedZipcode,
            country: data.country || null,
        });
        return;
    } catch (e: unknown) {
        logger.error(`Error in ${endpoint}/${validatedZipcode}: ${e}`);

        res.status(500).json({
            endpoint,
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
    const endpoint = "/api/v1/providers/lineup/:providerId";

    // Validate all inputs
    const providerIdResult = schemas.providerId.safeParse(providerId);
    const queryParamsResult = schemas.queryParams.safeParse({
        start,
        duration,
    });

    // Check validation results
    if (!providerIdResult.success) {
        res.status(400).json({
            endpoint,
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Provider ID",
            },
        });
        return;
    }

    if (!queryParamsResult.success) {
        res.status(400).json({
            endpoint,
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Query Parameters",
            },
        });
        return;
    }

    const validatedProviderId = providerIdResult.data;
    const validatedQueryParams = queryParamsResult.data;

    try {
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/${validatedProviderId}/web?start=${validatedQueryParams.start}&duration=${validatedQueryParams.duration}&apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform program details URLs and channel logo URLs
        const transformedItems = data.data.items.map((item: LineupItem) => ({
            ...item,
            channel: {
                ...item.channel,
                logo: `/images/catalog${item.channel.logo}`,
            },
            programSchedules: item.programSchedules.map(
                (program: ProgramSchedule) => ({
                    ...program,
                    programDetails: `/api/v1/programs/${program.programId}`,
                })
            ),
        }));

        res.status(200).json({
            endpoint,
            hasError: 0,
            result: transformedItems,
            providerId: validatedProviderId,
            start: validatedQueryParams.start,
            duration: validatedQueryParams.duration,
        });
        return;
    } catch (e: unknown) {
        logger.error(`Error in ${endpoint}/${validatedProviderId}: ${e}`);

        res.status(500).json({
            endpoint,
            hasError: 1,
            result: {
                error: 500,
                message: "Internal Server Error",
            },
        });
        return;
    }
});

router.get("/channels/:providerId", async (req: Request, res: Response) => {
    const { providerId } = req.params;
    const endpoint = "/api/v1/providers/channels/:providerId";

    // Validate providerId
    const validationResult = schemas.providerId.safeParse(providerId);

    if (!validationResult.success) {
        res.status(400).json({
            endpoint,
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Provider ID",
            },
        });
        return;
    }

    const validatedProviderId = validationResult.data;

    try {
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/${validatedProviderId}/sources/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        res.status(200).json({
            endpoint,
            hasError: 0,
            result: data.data.items.map((item: Channel) => ({
                ...item,
                logo: `/images/catalog${item.logo}`,
            })),
            providerId: validatedProviderId,
        });
        return;
    } catch (e: unknown) {
        logger.error(`Error in ${endpoint}/${validatedProviderId}: ${e}`);

        res.status(500).json({
            endpoint,
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
