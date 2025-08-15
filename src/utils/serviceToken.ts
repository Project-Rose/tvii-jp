import type { Request } from "express";

export function parseServiceToken(req: Request): {
    pid: number | undefined;
    serial_number: string | undefined;
    access_key: string | undefined;
} {
    const rawHeader = req.headers["x-nintendo-service-token"];
    const principalIdHex = req.headers["x-nintendo-current-principal-id"];

    let pid: number | undefined = undefined;

    if (typeof principalIdHex === "string") {
        const parsed = parseInt(principalIdHex, 16);
        if (!isNaN(parsed)) {
            pid = parsed;
        }
    }

    if (!rawHeader || typeof rawHeader !== "string") {
        return { pid, serial_number: undefined, access_key: undefined };
    }

    const cleaned = rawHeader.replace(/[\[\]]/g, "");
    const parts = cleaned.split(",").map((p) => p.trim());

    const val0 = (parts[0] ?? "").split("").reverse().join(""); // number
    const val1 = (parts[1] ?? "").split("").reverse().join(""); // short string
    const val2 = (parts[2] ?? "").split("").reverse().join(""); // long access key

    return {
        pid,
        serial_number: `${val1}${val0}`, // e.g., "FW403808391"
        access_key: val2, // reversed 3rd value
    };
}
