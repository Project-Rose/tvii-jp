import express from "express";
import { env } from "./env";

const app = express();
const port = env.PORT;

app.listen(port);
