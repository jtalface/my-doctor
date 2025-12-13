import { config, logConfig } from "./config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import apiRoutes from "./api";

/**
 * MyDoctor Backend Server
 * 
 * AI-powered medical assistant API
 */
class Server {
  private app: Express;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: config.isProduction ? config.corsOrigins : "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }));

    // Body parsing
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging (development only)
    if (config.isDevelopment) {
      this.app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Root endpoint
    this.app.get("/", (_req: Request, res: Response) => {
      res.json({
        name: "MyDoctor API",
        version: "1.0.0",
        environment: config.nodeEnv,
        description: "AI-powered medical assistant backend",
        endpoints: {
          health: "/api/health",
          session: "/api/session",
          user: "/api/user",
          llm: "/api/llm"
        }
      });
    });

    // API routes
    this.app.use("/api", apiRoutes);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: "Not Found",
        code: "NOT_FOUND"
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[Server] Unhandled error:", err);
      
      res.status(500).json({
        error: "Internal Server Error",
        code: "INTERNAL_ERROR",
        details: config.isDevelopment ? err.message : undefined
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: Error) => {
      console.error("[Server] Uncaught Exception:", err);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("[Server] Unhandled Rejection:", reason);
    });
  }

  /**
   * Connect to MongoDB
   */
  private async connectDatabase(): Promise<void> {
    try {
      console.log("[Server] Connecting to MongoDB...");
      
      await mongoose.connect(config.mongoUri);

      console.log("[Server] MongoDB connected successfully");

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("[Server] MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("[Server] MongoDB disconnected");
      });

    } catch (error) {
      console.error("[Server] Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Log configuration
      logConfig();

      // Connect to database
      await this.connectDatabase();

      // Start listening
      this.app.listen(config.port, '0.0.0.0', () => {
        console.log(`
🏥 MyDoctor Backend Server is running!

   → Local:   http://localhost:${config.port}
   → Health:  http://localhost:${config.port}/api/health
   → LLM:     http://localhost:${config.port}/api/llm/providers
        `);
      });

    } catch (error) {
      console.error("[Server] Failed to start:", error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log("[Server] Shutting down...");
    
    try {
      await mongoose.connection.close();
      console.log("[Server] MongoDB connection closed");
    } catch (error) {
      console.error("[Server] Error during shutdown:", error);
    }
    
    process.exit(0);
  }
}

// Create and start server
const server = new Server();

// Handle shutdown signals
process.on("SIGINT", () => server.shutdown());
process.on("SIGTERM", () => server.shutdown());

// Start the server
server.start();

export default server;
