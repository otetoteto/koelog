import { createStartAPIHandler } from "@tanstack/react-start/api";
import { Hono } from "hono";
import { hc } from "hono/client";

const app = new Hono();
const app1 = app.get("/api/hoge/foo", (c) => {
  return c.text("hoge foo");
});
const app2 = app1.post("/api/piyo", (c) => {
  return c.json({ message: "piyo" });
});

type App = typeof app2;

export const client = hc<App>("http://localhost:3000");

export default createStartAPIHandler(async ({ request }) => {
  return await app.fetch(request);
});
