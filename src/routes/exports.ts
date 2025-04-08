import { vino } from "@/routes/ui/vino-jp";
import { vinoDebug } from "@/routes/ui/debug";
import { providers } from "@/routes/api/providers";
import { programs } from "@/routes/api/programs";
import { type Router } from "express";

interface Routes {
    name: string;
    path: string;
    route: Router;
}

const routes: Routes[] = [
    {
        name: "Vino UI (JP)",
        path: "/",
        route: vino,
    },
    {
        name: "Debug Vino UI (JP)",
        path: "/debug",
        route: vinoDebug,
    },
    {
        name: "Vino API Providers (JP)",
        path: "/api/v1/providers",
        route: providers,
    },
    {
        name: "Vino API Programs (JP)",
        path: "/api/v1/programs",
        route: programs,
    },
];

export { routes as exports };
