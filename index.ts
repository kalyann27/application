import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, setupLoggingEndpoint } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { getDatabaseStatus } from "./db";
import { setupAuth } from "./auth";
import cors from "cors";
import session from "express-session";
import { storage } from "./storage";

const app = express();

// Enable detailed request logging
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'GET' && req.url.startsWith('/api/auth/google')) {
    console.log('Google Auth Request Details:', {
      url: req.url,
      headers: req.headers,
      session: req.session?.id
    });
  }
  next();
};

app.use(requestLogger);

// Basic middleware setup first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS with credentials support
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// In production, update cookie settings
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Setup auth after session but before routes
setupAuth(app);

// Initialize server with routes
async function startServer() {
  try {
    console.log('Starting server initialization...');

    // Setup logging endpoint first
    setupLoggingEndpoint(app);

    // Basic health check
    app.get("/api/health", async (_req, res) => {
      const dbStatus = await getDatabaseStatus();
      res.json({ 
        status: "ok",
        timestamp: new Date().toISOString(),
        env: app.get("env"),
        database: dbStatus
      });
    });

    // Register routes
    const server = registerRoutes(app);
    console.log('Routes registered successfully');

    // Start listening
    const PORT = 5000;
    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);

      if (app.get("env") === "development") {
        await setupVite(app, server);
        console.log('Vite setup completed');
      } else {
        serveStatic(app);
        console.log('Static file serving setup completed');
      }

      // Log available routes
      console.log('Auth routes available:', {
        google: '/api/auth/google',
        googleCallback: '/api/auth/google/callback',
        login: '/api/login',
        register: '/api/register',
        logout: '/api/logout'
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Error handling middleware with detailed logging
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    status: err.status
  });

  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    ...(app.get("env") === "development" ? { error: err.stack } : {})
  });
});

startServer();