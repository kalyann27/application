import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log('Starting password comparison...');

    if (!stored || !stored.includes('.')) {
      console.error('Invalid stored password format:', { hasStoredPassword: !!stored, containsDot: stored?.includes('.') });
      return false;
    }

    const [hashed, salt] = stored.split(".");
    console.log('Password format check:', { 
      hasHash: !!hashed, 
      hasSalt: !!salt 
    });

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log('Password comparison completed:', { result });

    return result;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
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

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
  }

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Local auth attempt:', { username });

      if (!username || !password) {
        console.log('Missing credentials:', { hasUsername: !!username, hasPassword: !!password });
        return done(null, false, { message: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log('Found user:', { id: user.id, username: user.username });

      // Log password details before comparison
      console.log('Password details:', {
        hashedPasswordLength: user.password.length,
        containsSalt: user.password.includes('.'),
        providedPasswordLength: password.length
      });

      const isValid = await comparePasswords(password, user.password);

      if (!isValid) {
        console.log('Invalid password for user:', username);
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log('Login successful:', { userId: user.id });
      return done(null, user);
    } catch (error) {
      console.error('Local strategy error:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user: SelectUser, done) => {
    try {
      console.log('Serializing user:', user.id);
      done(null, user.id);
    } catch (error) {
      console.error('Serialization error:', error);
      done(error, null);
    }
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      console.log('User deserialized successfully:', user.id);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error, null);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', {
      hasUsername: !!req.body.username,
      hasPassword: !!req.body.password
    });

    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }
        console.log('Login successful:', { userId: user.id });
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration request received:', {
        hasUsername: !!req.body.username,
        hasPassword: !!req.body.password
      });

      if (!req.body.username || !req.body.password) {
        return res.status(400).json({
          message: "Username and password are required"
        });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Username already exists:', req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log('Password hashed successfully');

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      console.log('User registered successfully:', { userId: user.id });

      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login after registration failed:', err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = (req.user as SelectUser)?.id;
    console.log('Logout attempt:', { userId });

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout successful:', { userId });
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}