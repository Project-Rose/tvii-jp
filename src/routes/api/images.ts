import express, { type Request, type Response, type Router } from "express";
import crypto from "crypto";
import { logger } from "@/utils/logger";
import { z } from "zod";
import { env } from "@/env";

const router: Router = express.Router();

// Define all schemas in one place
const schemas = {
    type: z.enum(["catalog"]),
    imageType: z.string().regex(/^(provider)$/),
    num: z.string().regex(/^[0-9]{1}$/),
    imageId: z.string().regex(/^\d-\d{10}\.png$/),
    fit: z.enum(["crop"]),
    dimension: z.string().regex(/^[0-9]{2,3}$/),
};

router.get(
    "/:type/:imageType/:num/:num2/:imageId",
    async (req: Request, res: Response) => {
        const { type, imageType, num, num2, imageId } = req.params;
        const { fit = "crop", height = "64", width = "64" } = req.query;

        // Combine all validations into a single schema for cleaner validation
        const validationSchema = z.object({
            type: schemas.type,
            imageType: schemas.imageType,
            num: schemas.num,
            num2: schemas.num,
            imageId: schemas.imageId,
            fit: schemas.fit,
            height: schemas.dimension,
            width: schemas.dimension,
        });

        // Use safeParse for all validations at once
        const validationResult = validationSchema.safeParse({
            type,
            imageType,
            num,
            num2,
            imageId,
            fit,
            height,
            width,
        });

        if (!validationResult.success) {
            // Extract the first error and send a specific message
            const errorPath = validationResult.error.errors[0].path.join(" ");
            const errorMessage = `Invalid ${errorPath.charAt(0).toUpperCase() + errorPath.slice(1)}`;

            res.status(400).json({
                endpoint: "/api/v1/images/:type/:imageType/:num/:num2/:imageId",
                hasError: 1,
                result: {
                    error: 400,
                    message: errorMessage,
                },
            });
            return;
        }

        // Now we can safely access the validated data
        const validData = validationResult.data;

        const getHash = (t: string): string => {
            const e = crypto.createHmac("sha1", env.VINO_JP_CONFIG_FASTLY_KEY);
            return e.update(t).digest("hex");
        };

        try {
            const basePath = `/${validData.type}/${validData.imageType}/${validData.num}/${validData.num2}/${validData.imageId}`;
            const query = `?fit=${validData.fit}&height=${validData.height}&width=${validData.width}`;
            const fullPath = `${basePath}${query}`;
            const hash = getHash(fullPath);
            const imageUrl = `https://www.tvguide.com/a/img/resize/${hash}${fullPath}`;

            console.log(imageUrl);

            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            const contentType =
                response.headers.get("content-type") || "image/png";

            res.status(200)
                .set({
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=31536000, immutable",
                })
                .send(Buffer.from(buffer));
            return;
        } catch (e: unknown) {
            logger.error(
                `Error in /api/v1/images/${type}/${imageType}/${num}/${num2}/${imageId}: ${e}`
            );

            res.status(500).json({
                endpoint: "/api/v1/images/:type/:imageType/:num/:num2/:imageId",
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

export { router as images };
