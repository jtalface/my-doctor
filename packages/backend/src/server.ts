import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import apiRoutes from "./api";

// Configuration
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mydoctor:mydoctor123@localhost:27017/mydoctor?authSource=admin";
const NODE_ENV = process.env.NODE_ENV || "development";

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
      origin: NODE_ENV === "production" 
        ? process.env.ALLOWED_ORIGINS?.split(",") 
        : "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }));

    // Body parsing
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    if (NODE_ENV === "development") {
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
        description: "AI-powered medical assistant backend",
        endpoints: {
          health: "/api/health",
          session: "/api/session",
          user: "/api/user"
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
        details: NODE_ENV === "development" ? err.message : undefined
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
      
      await mongoose.connect(MONGODB_URI, {
        // Connection options
      });

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
      // Connect to database
      await this.connectDatabase();

      // Start listening
      this.app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏥 MyDoctor Backend Server                               ║
║                                                            ║
║   Environment: ${NODE_ENV.padEnd(42)}║
║   Port: ${String(PORT).padEnd(48)}║
║   MongoDB: ${MONGODB_URI.substring(0, 40).padEnd(45)}║
║                                                            ║
║   API Endpoints:                                           ║
║   • POST /api/session/start    - Start new session         ║
║   • POST /api/session/:id/input - Process user input       ║
║   • GET  /api/session/:id      - Get session details       ║
║   • GET  /api/health           - Health check              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
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

