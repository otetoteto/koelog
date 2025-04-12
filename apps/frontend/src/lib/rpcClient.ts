import { HonoApp } from "@koelog/backend";
import { hc } from "hono/client";

export const rpcClient = hc<HonoApp>("http://localhost:3000")