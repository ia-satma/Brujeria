import express, { type Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { openApiSpec } from "./openapi-spec";
import { initializeDefaultSkills, upgradeExistingSkillsWithKnowledge } from "./skills";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-top: 20px }
  `,
  customSiteTitle: "Web Benchmarking API Documentation",
}));

app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);
      
      try {
        const skillsResult = await initializeDefaultSkills();
        if (skillsResult.skillsCreated > 0) {
          log(`Initialized ${skillsResult.skillsCreated} default skills for agents`, "skills");
        }
        if (skillsResult.subagentsCreated > 0) {
          log(`Initialized ${skillsResult.subagentsCreated} default subagents for agents`, "skills");
        }
        if (skillsResult.errors.length > 0) {
          log(`Skills initialization had ${skillsResult.errors.length} errors`, "skills");
        }
        
        const upgradeResult = await upgradeExistingSkillsWithKnowledge();
        if (upgradeResult.upgraded > 0) {
          log(`Upgraded ${upgradeResult.upgraded} skills with predefined knowledge`, "skills");
        }
        if (upgradeResult.errors.length > 0) {
          log(`Skills upgrade had ${upgradeResult.errors.length} errors`, "skills");
        }
      } catch (err: any) {
        log(`Skills initialization failed: ${err.message}`, "skills");
      }
    },
  );
})();
