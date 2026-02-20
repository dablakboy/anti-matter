import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { ipaStorageRouter } from "./routes/ipa-storage";
import { appAssetsRouter } from "./routes/app-assets";
import { appsRouter } from "./routes/apps";
import { developerRouter } from "./routes/developer";
import { webhooksRouter } from "./routes/webhooks";
import { pushRouter } from "./routes/push";
import { sampleRouter } from "./routes/sample";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/ipa-storage", ipaStorageRouter);
app.route("/api/app-assets", appAssetsRouter);
app.route("/api/apps", appsRouter);
app.route("/api/developer", developerRouter);
app.route("/api/webhooks", webhooksRouter);
app.route("/api/push", pushRouter);
app.route("/api/sample", sampleRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
