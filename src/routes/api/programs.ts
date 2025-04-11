import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";

const router: Router = express.Router();

router.get("/:programId", async (req: Request, res: Response) => {
    const { programId } = req.params;

    const programIdSchema = z.string().regex(/^[0-9]{10}$/);

    const idResult = programIdSchema.safeParse(programId);

    if (!idResult.success) {
        res.status(400).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Program ID",
            },
        });
        return;
    }

    try {
        const response = await fetch(
            `https://backend.tvguide.com/tvschedules/tvguide/programdetails/${idResult.data}/web`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform any /Date(timestamp)/ format to string timestamp
        const dateReplacer = (_key: string, value: unknown): unknown => {
            if (typeof value === "string" && value.match(/^\/Date\(\d+\)\/$/)) {
                return value.replace(/^\/Date\((\d+)\)\/$/, "$1");
            }
            return value;
        };

        res.status(200).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 0,
            result: JSON.parse(JSON.stringify(data.data.item, dateReplacer)),
            programId: idResult.data,
        });
        return;
    } catch (e: unknown) {
        console.error(`Error in /api/v1/programs/${idResult.data}: ${e}`);

        res.status(500).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 1,
            result: {
                error: 500,
                message: "Internal Server Error",
            },
        });
        return;
    }
});

export { router as programs };
