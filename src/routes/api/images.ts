import express, { type Request, type Response, type Router } from "express";
import { logger } from "@/utils/logger";
import { z } from "zod";

const router: Router = express.Router();

// TODO: Do more research on how TV Guide handles images
// NOTE: The API exposes this part of the URL: /:imageType/:num/:num2/:imageId, however there is a second, longer string (possibly a hash according to GPT),
// that is not exposed in the API, but is used in the URL.
router.get(
    "/:imageType/:num/:num2/:imageId",
    async (req: Request, res: Response) => {
        const { imageType, num, num2, imageId } = req.params;

        const imageTypeSchema = z.string().regex(/^(provider)$/);
        const numSchema = z.string().regex(/^[0-9]{1}$/);
        const imageIdSchema = z.string().regex(/^\d-\d{10}\.png$/);

        const imageTypeResult = imageTypeSchema.safeParse(imageType);
        const numResult = numSchema.safeParse(num);
        const num2Result = numSchema.safeParse(num2);
        const imageIdResult = imageIdSchema.safeParse(imageId);

        if (!imageTypeResult.success) {
            res.status(400).json({
                endpoint: "/api/v1/images/:imageType/:num/:num2/:imageId",
                hasError: 1,
                result: {
                    error: 400,
                    message: "Invalid Image Type",
                },
            });
            return;
        }

        if (!numResult.success || !num2Result.success) {
            res.status(400).json({
                endpoint: "/api/v1/images/:imageType/:num/:num2/:imageId",
                hasError: 1,
                result: {
                    error: 400,
                    message: "Invalid Numbers",
                },
            });
            return;
        }

        if (!imageIdResult.success) {
            res.status(400).json({
                endpoint: "/api/v1/images/:imageType/:num/:num2/:imageId",
                hasError: 1,
                result: {
                    error: 400,
                    message: "Invalid Image ID",
                },
            });
            return;
        }

        try {
            // valid working URL: https://www.tvguide.com/a/img/resize/1380f342c040eeea449c1a634695dd0292fdd77a/catalog/provider/8/4/8-9200000057.png?fit=crop&height=64&width=64
            const response = await fetch(
                `https://www.tvguide.com/a/img/resize/1380f342c040eeea449c1a634695dd0292fdd77a/catalog/${imageType}/${num}/${num2}/${imageId}?fit=crop&height=64&width=64`
            );

            if (!response.ok) {
                logger.error(`${response.status}`);
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
                `Error in /api/v1/images/${imageType}/${num}/${num2}/${imageId}: ${e}`
            );

            res.status(500).json({
                endpoint: "/api/v1/images/:imageType/:num/:num2/:imageId",
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
