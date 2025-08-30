import { vino } from "@/routes/ui/vino-jp";
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
];

export { routes as exports };
