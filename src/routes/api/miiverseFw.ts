import express, { type Request, type Response } from "express";
import { parseStringPromise } from "xml2js";

const router = express.Router();

router.get("/posts", async (req: Request, res: Response): Promise<any> => {
    const apiUrl = req.header("X-Nintendo-Olv-Api-Url");
    const serviceToken = req.header("X-Nintendo-ServiceToken");
    const paramPack = req.header("X-Nintendo-ParamPack");
    const userAgent = req.header("X-Nintendo-Olv-User-Agent");

    if (!apiUrl || !serviceToken || !paramPack || !userAgent) {
        return res.status(400).json({ error: "Missing required headers." });
    }

    // Start building query params
    const queryParams = new URLSearchParams();

    queryParams.set("language_id", "254");
    
    // Handle one or more search_key params
    const limit = req.query["limit"];

    queryParams.set("limit", String(limit));
    queryParams.set("distinct_pid", "1");
    queryParams.set("with_mii", "1");

    // Handle one or more search_key params
    const searchKeys = req.query["search_key"];

    if (Array.isArray(searchKeys)) {
        searchKeys.forEach((key) => queryParams.append("search_key", String(key)));
    } else if (searchKeys) {
        queryParams.append("search_key", String(searchKeys));
    }

    const endpoint = `${apiUrl}/v1/communities/0/posts?${queryParams.toString()}`;

    try {
        const response = await fetch(endpoint, {
            headers: {
                "X-Nintendo-ServiceToken": serviceToken,
                "X-Nintendo-ParamPack": paramPack,
                "User-Agent": userAgent
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Upstream fetch failed" });
        }

        const xmlText = await response.text();
        const json = await parseStringPromise(xmlText, { explicitArray: false });
        res.json(json);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch or parse XML", detail: (error as Error).message });
    }
});

export { router as miiverse };