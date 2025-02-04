import express, { type Request, type Response, type Router } from "express";
import { join } from "path";

const router: Router = express.Router();

// Serves the frontend HTML
router.get("/", (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, "..", "..", "..", "pages", "index.html"));
});

export { router as vino };
