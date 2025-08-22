import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { env } from "@/env";
import NodeCache from "node-cache";
import { logger } from "@/utils/logger";
import { fetchWithProxy } from "@/utils/fetchWithProxy";

const cache = new NodeCache({
    stdTTL: 7200, // 2 hours in seconds
    checkperiod: 1800, // 30 minutes cleanup
});

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
    programId: z.string().regex(/^[0-9]{10}$/),
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

    // Check cache
    const cacheKey = `zipcode:${validatedZipcode}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        res.status(200).json(cached);
        return;
    }

    try {
        const response = await fetchWithProxy(
            `https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/${validatedZipcode}/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const result = {
            endpoint,
            hasError: 0,
            result: data.data.items,
            zipcode: validatedZipcode,
            country: data.country || null,
        };

        cache.set(cacheKey, result, 604800); // Cache for 7 days

        res.status(200).json(result);
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

router.get(
    "/countries/CA",
    async (req: Request, res: Response): Promise<any> => {
        const { type, region, city } = req.query as {
            type?: string;
            region?: string;
            city?: string;
        };
        const cacheKey = "providers:CA";
        const endpoint = "/api/v1/providers/countries/CA";

        try {
            let payload = cache.get<any>(cacheKey);

            if (!payload) {
                const response = await fetchWithProxy(
                    `https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/country/CAN/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                payload = await response.json();
                cache.set(cacheKey, payload, 604800); // Cache for 7 days
            }

            if (type === "regions") {
                const items: Array<{ state: string; city: string }> =
                    payload.data.items;
                const regionMap: Record<string, Set<string>> = {};

                for (const item of items) {
                    const { state, city } = item;
                    if (!state || !city) continue;

                    if (!regionMap[state]) {
                        regionMap[state] = new Set();
                    }
                    regionMap[state].add(city);
                }

                const regions: Record<string, string[]> = {};
                const sortedStates = Object.keys(regionMap).sort();

                for (const state of sortedStates) {
                    regions[state] = Array.from(regionMap[state]).sort((a, b) =>
                        a.localeCompare(b)
                    );
                }

                return res.status(200).json({
                    endpoint,
                    hasError: 0,
                    result: regions,
                    country: payload.country || null,
                    fromCache: Boolean(payload), // optional debug info
                });
            } else if (type === "providers") {
                if (!region || !city) {
                    return res.status(400).json({
                        endpoint,
                        hasError: 1,
                        result: {
                            error: 400,
                            message: "Missing region or city query parameters",
                        },
                    });
                }

                const filteredProviders = payload.data.items.filter(
                    (item: any) => {
                        return item.state === region && item.city === city;
                    }
                );

                return res.status(200).json({
                    endpoint,
                    hasError: 0,
                    result: filteredProviders,
                    country: payload.country || null,
                    fromCache: Boolean(payload), // optional
                });
            }

            return res.status(500).json({
                endpoint,
                hasError: 1,
                result: {
                    error: 500,
                    message: "Did not provide query for request type.",
                },
            });
        } catch (e: unknown) {
            logger.error(`Error in ${endpoint}/: ${e}`);

            return res.status(500).json({
                endpoint,
                hasError: 1,
                result: {
                    error: 500,
                    message: "Internal Server Error",
                },
            });
        }
    }
);

router.get(
    "/lineup/:providerId",
    async (req: Request, res: Response): Promise<any> => {
        const { providerId } = req.params;
        let {
            start,
            duration = "120",
            offset = "0",
            limit = "100",
        } = req.query as {
            start?: string;
            duration?: string;
            offset?: string;
            limit?: string;
        };

        const numericLimit = parseInt(limit, 10);
        if (isNaN(numericLimit) || numericLimit <= 0) {
            return res
                .status(400)
                .json({ error: "Invalid 'limit' query parameter." });
        }

        const endpoint = "/api/v1/providers/lineup/:providerId";

        if (!start) {
            const now = new Date();
            now.setMinutes(0, 0, 0);
            start = Math.floor(now.getTime() / 1000).toString();
        }

        const providerIdResult = schemas.providerId.safeParse(providerId);
        const durationResult = z.enum(["120", "180"]).safeParse(duration);
        const startResult = schemas.queryParams.shape.start.safeParse(start);
        const offsetResult = z.string().regex(/^\d+$/).safeParse(offset);

        if (!providerIdResult.success) {
            return res.status(400).json({
                endpoint,
                hasError: 1,
                result: { error: 400, message: "Invalid Provider ID" },
            });
        }

        if (
            !durationResult.success ||
            !startResult.success ||
            !offsetResult.success
        ) {
            return res.status(400).json({
                endpoint,
                hasError: 1,
                result: { error: 400, message: "Invalid Query Parameters" },
            });
        }

        const validatedProviderId = providerIdResult.data;
        const validatedStart = startResult.data;
        const validatedDuration = durationResult.data;
        const validatedOffset = parseInt(offsetResult.data, 10);

        const cacheKey = `lineup:${validatedProviderId}:${validatedStart}:${validatedDuration}`;
        const cachedData = cache.get<{
            endpoint: string;
            hasError: number;
            result: LineupItem[];
            providerId: string;
            start: string;
            duration: string;
        }>(cacheKey);

        let transformedItems: LineupItem[];

        if (cachedData) {
            transformedItems = cachedData.result;
        } else {
            try {
                const response = await fetchWithProxy(
                    `https://backend.tvguide.com/tvschedules/tvguide/${validatedProviderId}/web?start=${validatedStart}&duration=${validatedDuration}&apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                transformedItems = data.data.items.map((item: LineupItem) => ({
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

                cache.set(cacheKey, {
                    endpoint,
                    hasError: 0,
                    result: transformedItems,
                    providerId: validatedProviderId,
                    start: validatedStart,
                    duration: validatedDuration,
                });
            } catch (e: unknown) {
                logger.error(`Error in ${endpoint}/${providerId}: ${e}`);
                return res.status(500).json({
                    endpoint,
                    hasError: 1,
                    result: { error: 500, message: "Internal Server Error" },
                });
            }
        }

        // Slice the data
        const paginatedItems = transformedItems.slice(
            validatedOffset,
            validatedOffset + numericLimit
        );

        // Default: JSON response
        return res.status(200).json({
            endpoint,
            hasError: 0,
            result: paginatedItems,
            providerId: validatedProviderId,
            start: validatedStart,
            duration: validatedDuration,
            offset: validatedOffset,
            limit,
            total: transformedItems.length,
        });
    }
);

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
    const cacheKey = `channels:${validatedProviderId}`;

    try {
        let data = cache.get<any>(cacheKey);

        if (!data) {
            const response = await fetchWithProxy(
                `https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/${validatedProviderId}/sources/web?apiKey=${env.VINO_JP_CONFIG_TVGUIDE_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            data = await response.json();
            cache.set(cacheKey, data, 172800); // Cache for 48 hours
        }

        res.status(200).json({
            endpoint,
            hasError: 0,
            result: data.data.items.map((item: Channel) => ({
                ...item,
                logo: `/images/catalog${item.logo}`,
            })),
            providerId: validatedProviderId,
            fromCache: Boolean(cache.get(cacheKey)), // optional debug info
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

router.get(
    "/program/:programId/details",
    async (req: Request, res: Response) => {
        const { programId } = req.params;
        const { type = "episode" } = req.query;
        const endpoint = "/api/v1/program/:programId/details";

        // Validate programId
        const validationResult = schemas.programId.safeParse(programId);

        if (!validationResult.success) {
            res.status(400).json({
                endpoint,
                hasError: 1,
                result: {
                    error: 400,
                    message: "Invalid Program ID",
                },
            });
            return;
        }

        const validatedProgramId = validationResult.data;

        // Determine endpoint based on type
        const typeString = String(type).toLowerCase();
        let apiUrl: string;
        let cacheKey: string;

        if (typeString === "program") {
            apiUrl = `https://backend.tvguide.com/shows/tvguide/${validatedProgramId}/web`;
            cacheKey = `programDetails:program:${validatedProgramId}`;
        } else if (typeString === "movies") {
            apiUrl = `https://backend.tvguide.com/movies/tvguide/${validatedProgramId}/web`;
            cacheKey = `movieDetails:episode:${validatedProgramId}`;
        } else {
            apiUrl = `https://backend.tvguide.com/tvschedules/tvguide/programdetails/${validatedProgramId}/web`;
            cacheKey = `episodeDetails:episode:${validatedProgramId}`;
        }

        // Check cache
        const cached = cache.get(cacheKey);
        if (cached) {
            res.status(200).json({
                endpoint,
                hasError: 0,
                result: cached,
                programId: validatedProgramId,
                type: typeString,
            });
            return;
        }

        // Fetch and cache
        try {
            const response = await fetchWithProxy(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            cache.set(cacheKey, data.data, 14400); //4 hour?

            res.status(200).json({
                endpoint,
                hasError: 0,
                result: data.data,
                programId: validatedProgramId,
                type: typeString,
            });
            return;
        } catch (e: unknown) {
            logger.error(
                `Error in ${endpoint}/${validatedProgramId}?type=${typeString}: ${e}`
            );

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
    }
);

export { router as providers };
