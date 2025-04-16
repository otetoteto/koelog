import { app } from "@koelog/backend";
import { createStartAPIHandler } from "@tanstack/react-start/api";

export default createStartAPIHandler(({ request }) => app.fetch(request));
