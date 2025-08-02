import { vino } from "@/routes/ui/vino-jp";
import { vinoDebug } from "@/routes/ui/debug";
import { providers } from "@/routes/api/providers";
import { programs } from "@/routes/api/programs";
import { miis } from "@/routes/api/miis";
import { images } from "@/routes/images";
import { socials } from "@/routes/api/social";
import { account } from "@/routes/api/act";
import { miiverse } from "@/routes/api/miiverseFw";
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
    {
        name: "Vino API Miis (JP)",
        path: "/api/v1/miis",
        route: miis,
    },
    {
        name: "Vino TV Guide Images (JP)",
        path: "/images",
        route: images,
    },
    {
        name: "Vino Social Media (JP)",
        path: "/api/v1/socials",
        route: socials,
    },
    {
        name: "Vino Account Handler (JP)",
        path: "/api/v1/act",
        route: account,
    },
        {
        name: "Vino Miiverse Forwarder (JP)",
        path: "/api/v1/olvapi",
        route: miiverse,
    }
];

export { routes as exports };
