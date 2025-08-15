import express, { type Request, type Response, type Router } from "express";
import { join } from "path";

const router: Router = express.Router();

// Serves the first debug HTML page
router.get("/01", (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, "..", "..", "..", "pages", "debug1.html"));
});

export { router as vinoDebug };
