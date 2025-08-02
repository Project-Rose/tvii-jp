import express, { type Request, type Response, type Router } from "express";
import { join } from "path";
import { parseServiceToken } from "@/utils/serviceToken";

const router: Router = express.Router();

// Serves the frontend HTML
router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
        const token = parseServiceToken(req);

        console.log(token)

        if (!token || !token.serial_number || !token.pid || !token.access_key) {
            console.warn(`Page Access Key/Serial Number/PID doesn't exist for: ${token.pid} ${token.serial_number}`);
            return res.sendFile(join(__dirname, "..", "..", "..", "pages", "error.html"));
        }

        res.sendFile(join(__dirname, "..", "..", "..", "pages", "index.html"));
    } catch (error) {
        console.error("Page access error:", error);
        res.sendFile(join(__dirname, "..", "..", "..", "pages", "error.html"));
    }
});

export { router as vino };