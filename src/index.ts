import express, { type Application } from "express";
import { env } from "@/env";
import { join } from "path";
import { exports } from "./routes/exports";
import { logger } from "@/utils/logger";

const app: Application = express();
const port: number = Number(env.VINO_JP_CONFIG_PORT);

// Middleware
app.use(express.static(join(__dirname, "..", "static"))); // Serves our static files

// Auto imports routes instead of import of bunch manually
for (let i = 0; i < exports.length; i++) {
    const route = exports[i];
    logger.attempt(
        `Attempting to import '${route.name}' routes at '${route.path}'...`
    );
    try {
        app.use(route.path, route.route);
        logger.success(
            `Successfully imported '${route.name}' routes at '${route.path}'!`
        );
    } catch (e) {
        logger.error(
            `Could not import '${route.name}' routes at '${route.path}'! ${e}`
        );
    }
}

// Starts the server
app.listen(port, () => {
    logger.info("Server is running on port: %d!", port);
});
