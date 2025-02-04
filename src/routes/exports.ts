import { vino } from "@/routes/ui/vino-jp";
import { vinoDebug } from "@/routes/ui/debug";
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
];

export { routes as exports };
