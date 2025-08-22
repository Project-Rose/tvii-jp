import express, { type Request, type Response, type Router } from "express";
import sharp from "sharp";
import NodeCache from "node-cache";

const router: Router = express.Router();
const imageCache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 7, // 7 days
    checkperiod: 60 * 60, // check expired items every hour
});

// Helper: checks if image contains only white or white-transparent pixels
function isWhiteOrTransparent(pixels: Buffer, threshold = 0.98): boolean {
    const numPixels = pixels.length / 4;
    let whiteLikeCount = 0;

    for (let i = 0; i < numPixels; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];
        const a = pixels[i * 4 + 3];

        const isTransparent = a === 0;
        const isWhiteLike = r > 240 && g > 240 && b > 240;

        if (isTransparent || (isWhiteLike && a > 10)) {
            whiteLikeCount++;
        }
    }

    return whiteLikeCount / numPixels >= threshold;
}

router.get(
    "/:bucketType/:imageType/:num/:num2/:imageId.:ext",
    async (req: Request, res: Response): Promise<any> => {
        const { bucketType, imageType, num, num2, imageId, ext } = req.params;
        const { width, height } = req.query;

        const isResize = width || height;
        const w = width ? parseInt(width as string, 10) : undefined;
        const h = height ? parseInt(height as string, 10) : undefined;

        if ((w && isNaN(w)) || (h && isNaN(h))) {
            return res.status(400).json({ error: "Invalid width or height" });
        }

        const baseKey = `${bucketType}/${imageType}/${num}/${num2}/${imageId}.${ext}`;

        // Check for cached base image (already tinted if necessary)
        const cached = imageCache.get<Buffer>(baseKey);
        if (cached) {
            let sharpInstance = sharp(cached);
            if (w || h) {
                sharpInstance = sharpInstance.resize(w, h);
            }
            const resizedBuffer = await sharpInstance.png().toBuffer();
            res.set({
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Cache": "HIT",
            });
            return res.status(200).send(resizedBuffer);
        }

        const remoteUrl = `https://tvguide.com/a/img/${baseKey}`;

        try {
            const response = await fetch(remoteUrl);
            if (!response.ok) {
                return res
                    .status(404)
                    .json({ error: "Image not found on remote server" });
            }

            const arrayBuffer = await response.arrayBuffer();
            const originalBuffer = Buffer.from(arrayBuffer);

            const raw = await sharp(originalBuffer)
                .ensureAlpha()
                .raw()
                .toBuffer();
            const mostlyWhite = isWhiteOrTransparent(raw);

            let baseOutputBuffer: Buffer;

            if (mostlyWhite) {
                const { data, info } = await sharp(originalBuffer)
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });
                const tinted = Buffer.alloc(data.length);
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a === 0) {
                        tinted[i] = 0;
                        tinted[i + 1] = 0;
                        tinted[i + 2] = 0;
                        tinted[i + 3] = 0;
                    } else {
                        tinted[i] = Math.round(r * 0.1);
                        tinted[i + 1] = Math.round(g * 0.1);
                        tinted[i + 2] = Math.round(b * 0.1);
                        tinted[i + 3] = a;
                    }
                }

                baseOutputBuffer = await sharp(tinted, {
                    raw: {
                        width: info.width,
                        height: info.height,
                        channels: 4,
                    },
                })
                    .png()
                    .toBuffer();
            } else {
                baseOutputBuffer = originalBuffer;
            }

            // Cache the base (tinted or not) image
            imageCache.set(baseKey, baseOutputBuffer);

            let sharpInstance = sharp(baseOutputBuffer);
            if (w || h) {
                sharpInstance = sharpInstance.resize(w, h);
            }
            const finalBuffer = await sharpInstance.png().toBuffer();

            res.set({
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Cache": "MISS",
            });

            return res.status(200).send(finalBuffer);
        } catch (err) {
            console.error("Image proxy error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

router.get("/clearCache", (_req: Request, res: Response) => {
    imageCache.flushAll();
    res.send("Image cache cleared");
});

export { router as images };
