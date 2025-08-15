import express, { type Request, type Response, type Router } from "express";
import { join } from "path";
import { parseServiceToken } from "@/utils/serviceToken";
import db from "@/utils/db";

const router: Router = express.Router();

// Serves the frontend HTML
router.get("/", async (_req: Request, res: Response): Promise<any> => {
    const token = parseServiceToken(_req);

    const account = await db('account')
        .where({ pid: token.pid, serial_number: token.serial_number, access_key: token.access_key })
        .first();

    //Vino client detects if the checkLogIn is false anyway to effectuate setup
    if (!account) {
        return res.sendFile(join(__dirname, "..", "..", "..", "pages", "setup.html"));
    }

    try {
        res.sendFile(join(__dirname, "..", "..", "..", "pages", "index.html"));
    } catch (error) {
        console.error("Page access error:", error);
        res.sendFile(join(__dirname, "..", "..", "..", "pages", "error.html"));
    }
});


export { router as vinoRoute };
