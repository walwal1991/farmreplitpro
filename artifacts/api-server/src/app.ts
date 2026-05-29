import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Capture raw body for the Chargily webhook BEFORE express.json() parses it
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/img",
  express.static(path.resolve(process.cwd(), "public", "img"), {
    maxAge: "7d",
  }),
);

app.use(
  "/api/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    maxAge: "7d",
  }),
);

app.use("/api", router);

// Serve frontend static files in production
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(process.cwd(), "artifacts/vermifert/dist/public");
  app.use(express.static(frontendDist, { maxAge: "1d" }));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
