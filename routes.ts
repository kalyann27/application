import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { flightService } from "./services/flightService";
import { aiService } from "./services/aiService";
import { paymentService } from "./services/paymentService";
import { hotelService } from "./services/hotelService";
import { User } from "@shared/schema";
import { storage } from "./storage";

interface WsClient extends WebSocket {
  userId?: string;
  username?: string;
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/chat',
    clientTracking: true
  });

  // Add logging middleware for all routes
  app.use((req, res, next) => {
    console.log('Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      session: req.session?.id
    });
    next();
  });

  // Setup authentication first - before any other routes
  setupAuth(app);

  // Guest login endpoint
  app.post("/api/guest-login", async (req, res, next) => {
    try {
      console.log('Guest login attempt');
      const guestUser = await storage.getUserByUsername('guest');

      if (!guestUser) {
        console.error('Guest user not found in storage');
        return res.status(500).json({ message: "Guest login unavailable" });
      }

      req.login(guestUser, (err) => {
        if (err) {
          console.error('Guest login error:', err);
          return next(err);
        }
        console.log('Guest login successful:', { userId: guestUser.id });
        res.json(guestUser);
      });
    } catch (error) {
      console.error('Guest login error:', error);
      next(error);
    }
  });

  // Basic health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Handle auth routes specifically
  app.use('/api/auth/*', (req, res, next) => {
    console.log('Auth route accessed:', {
      method: req.method,
      path: req.path,
      headers: req.headers,
      session: req.session?.id
    });
    next();
  });

  // Make airport search public
  app.get("/api/airports/search", async (req, res) => {
    try {
      const { keyword } = req.query;

      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({
          message: 'Keyword parameter is required'
        });
      }

      console.log('Airport search request:', { keyword });

      const airports = await flightService.getAirportsByKeyword(keyword);

      console.log('Airport search response:', {
        count: airports.length,
        sample: airports.slice(0, 2)
      });

      res.json(airports);
    } catch (error) {
      console.error('Airport search error:', error);
      res.status(500).json({
        message: 'Failed to search airports',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });


  // Protected routes follow
  app.get("/api/session", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user || null
    });
  });

  // Flight search endpoints (protected)
  app.get("/api/flights/search", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const { from, to, date, class: travelClass, passengers } = req.query;

      if (!from || !to || !date) {
        return res.status(400).json({
          message: 'Missing required parameters: from, to, and date are required'
        });
      }

      console.log('Flight search request:', { from, to, date, travelClass, passengers });

      const flights = await flightService.searchFlights({
        originLocationCode: from as string,
        destinationLocationCode: to as string,
        departureDate: date as string,
        travelClass: travelClass as string,
        adults: passengers ? parseInt(passengers as string) : 1,
      });

      res.json(flights);
    } catch (error) {
      console.error('Flight search error:', error);
      res.status(500).json({ message: 'Failed to search flights' });
    }
  });

  // Mock data endpoints
  app.get("/api/hotels", async (req, res) => {
    try {
      const { location, rating, priceRange } = req.query;
      const hotels = await hotelService.searchHotels({
        location: location as string,
        rating: rating ? parseInt(rating as string) : undefined,
        priceRange: priceRange as string,
      });
      res.json(hotels);
    } catch (error) {
      console.error('Hotel search error:', error);
      const mockHotels = generateHotels(5);
      res.json(mockHotels);
    }
  });

  app.get("/api/rides", (_req, res) => {
    const rides = generateRides(5);
    res.json(rides);
  });

  app.get("/api/dining", (_req, res) => {
    const dining = generateDining(6);
    res.json(dining);
  });

  app.post("/api/payment/create-intent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { amount, bookingType, metadata } = req.body;

      const paymentIntent = await paymentService.createPaymentIntent(
        amount,
        bookingType,
        metadata
      );

      res.json(paymentIntent);
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  app.post("/api/payment/confirm/:paymentIntentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { paymentIntentId } = req.params;
      const result = await paymentService.confirmPayment(paymentIntentId);

      res.json(result);
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      res.status(500).json({ message: 'Failed to confirm payment' });
    }
  });

  app.post("/api/chatbot", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log('Unauthorized chat attempt');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { message, chatHistory, currentLocation } = req.body;

      console.log('Chat request received:', {
        userId: (req.user as User)?.id,
        messageLength: message?.length,
        currentLocation,
        historyLength: chatHistory?.length
      });

      if (!message?.trim()) {
        return res.status(400).json({ message: 'Message is required' });
      }

      const response = await aiService.handleChatbotMessage(
        message,
        req.user as User,
        currentLocation,
        chatHistory
      );

      console.log('Chat response generated:', {
        userId: (req.user as User)?.id,
        responseType: response.type,
        hasResponse: !!response.message
      });

      res.json(response);
    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to process chatbot request',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.post("/api/ai/cultural-insights", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { location } = req.body;
      console.log('Cultural insights request:', {
        userId: (req.user as User)?.id,
        location
      });

      if (!location) {
        return res.status(400).json({ message: 'Location is required' });
      }

      const insights = await aiService.getCulturalInsights(location);
      console.log('Cultural insights generated:', {
        userId: (req.user as User)?.id,
        location,
        hasInsights: !!insights
      });

      res.json({ insights });
    } catch (error) {
      console.error('Cultural insights error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to get cultural insights'
      });
    }
  });

  app.post("/api/ai/smart-booking", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { destination, dates, preferences } = req.body;

      if (!destination || !dates) {
        return res.status(400).json({ message: 'Destination and dates are required' });
      }

      console.log('Smart booking request:', {
        userId: (req.user as User)?.id,
        destination,
        dates
      });

      const recommendations = await aiService.getSmartBookingRecommendations(
        destination,
        dates,
        preferences
      );

      res.json({ recommendations });
    } catch (error) {
      console.error('Smart booking error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to get booking recommendations'
      });
    }
  });

  app.post("/api/ai/travel-trends", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { destination } = req.body;

      if (!destination) {
        return res.status(400).json({ message: 'Destination is required' });
      }

      console.log('Travel trends request:', {
        userId: (req.user as User)?.id,
        destination
      });

      const trends = await aiService.analyzeTravelTrends(destination);
      res.json({ trends });
    } catch (error) {
      console.error('Travel trends error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to analyze travel trends'
      });
    }
  });

  app.post("/api/ai/trip-plan", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { destination, dates, preferences } = req.body;

      if (!destination || !dates) {
        return res.status(400).json({ message: 'Destination and dates are required' });
      }

      console.log('Trip plan request:', {
        userId: (req.user as User)?.id,
        destination,
        dates
      });

      const plan = await aiService.generateDetailedTripPlan(
        destination,
        dates,
        preferences,
        req.user as User
      );

      // Get additional insights
      const insights = await aiService.generateTripInsights(destination, dates);

      res.json({
        plan,
        insights
      });
    } catch (error) {
      console.error('Trip planning error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate trip plan'
      });
    }
  });

  app.post("/api/ai/optimize-schedule", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { plan, constraints } = req.body;

      if (!plan) {
        return res.status(400).json({ message: 'Existing plan is required' });
      }

      console.log('Schedule optimization request:', {
        userId: (req.user as User)?.id,
        planId: plan.id
      });

      const optimizedPlan = await aiService.optimizeTripSchedule(plan, constraints);
      res.json({ plan: optimizedPlan });
    } catch (error) {
      console.error('Schedule optimization error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to optimize schedule'
      });
    }
  });

  app.post("/api/ai/activity-alternatives", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { activity, context } = req.body;

      if (!activity || !context) {
        return res.status(400).json({ message: 'Activity and context are required' });
      }

      console.log('Alternative activities request:', {
        userId: (req.user as User)?.id,
        activityId: activity.id
      });

      const alternatives = await aiService.suggestDynamicAlternatives(activity, context);
      res.json({ alternatives });
    } catch (error) {
      console.error('Activity alternatives error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to suggest alternatives'
      });
    }
  });

  app.post("/api/ai/analyze-behavior", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { searchHistory, bookingHistory } = req.body;
      console.log('Analyzing behavior for user:', (req.user as User)?.id);

      const analysis = await aiService.analyzeUserBehavior(
        req.user as User,
        searchHistory,
        bookingHistory
      );

      res.json({ analysis });
    } catch (error) {
      console.error('Behavior analysis error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to analyze behavior'
      });
    }
  });

  app.post("/api/ai/itinerary-optimization", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { itinerary, preferences } = req.body;
      if (!itinerary) {
        return res.status(400).json({ message: 'Itinerary is required' });
      }

      console.log('Itinerary optimization request:', {
        userId: (req.user as User)?.id,
        itineraryLength: itinerary.length
      });

      const optimization = await aiService.getItineraryOptimizations(itinerary, preferences);
      res.json({ optimization });
    } catch (error) {
      console.error('Itinerary optimization error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to optimize itinerary'
      });
    }
  });

  app.post("/api/ai/travel-guide", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { destination, duration } = req.body;
      if (!destination || !duration) {
        return res.status(400).json({ message: 'Destination and duration are required' });
      }

      console.log('Travel guide request:', {
        userId: (req.user as User)?.id,
        destination,
        duration
      });

      const guide = await aiService.getCustomizedTravelGuide(
        destination,
        (req.user as User).preferences,
        duration
      );
      res.json({ guide });
    } catch (error) {
      console.error('Travel guide error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate travel guide'
      });
    }
  });

  app.get("/api/ai/proactive-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = req.user as User;
      console.log('Generating proactive suggestions for user:', user.id);

      // First analyze user behavior
      const analysis = await aiService.analyzeUserBehavior(
        user,
        [],
        []
      );

      // Generate suggestions based on the analysis and include local events
      const suggestions = await aiService.generateProactiveSuggestions(
        analysis,
        new Date().toISOString()
      );

      // For each suggestion, fetch relevant local events
      const enhancedSuggestions = await Promise.all(
        suggestions.map(async (suggestion) => {
          const events = await aiService.getLocalEvents(
            suggestion.destination,
            {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          );

          // Generate a personalized travel guide for each destination
          const guide = await aiService.getCustomizedTravelGuide(
            suggestion.destination,
            user.preferences,
            7
          );

          // Analyze travel trends for the destination
          const trends = await aiService.analyzeTravelTrends(suggestion.destination);

          // Get smart booking recommendations
          const bookingOptions = await aiService.getSmartBookingRecommendations(
            suggestion.destination,
            {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            user.preferences
          );

          return {
            ...suggestion,
            events,
            guide,
            trends,
            bookingOptions
          };
        })
      );

      res.json({
        suggestions: enhancedSuggestions,
        userAnalysis: analysis
      });
    } catch (error) {
      console.error('Enhanced proactive suggestions error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate suggestions'
      });
    }
  });

  app.post("/api/ai/local-events", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { location, dates } = req.body;

      if (!location || !dates) {
        return res.status(400).json({ message: 'Location and dates are required' });
      }

      const events = await aiService.getLocalEvents(location, dates);
      res.json({ events });
    } catch (error) {
      console.error('Local events error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch local events'
      });
    }
  });

  wss.on('connection', (ws: WsClient) => {
    console.log('New WebSocket connection');

    ws.on('message', (rawData: string) => {
      try {
        const data = JSON.parse(rawData) as ChatMessage;
        console.log('Received message:', data);

        if (data.type === 'auth' && data.userId && data.username) {
          ws.userId = data.userId;
          ws.username = data.username;
          console.log('User authenticated:', ws.username);

          // Send welcome message
          const joinMessage: ChatMessage = {
            id: `join-${Date.now()}-${Math.random()}`,
            type: 'status',
            content: `${ws.username} joined the chat`,
            timestamp: Date.now()
          };

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(joinMessage));
            }
          });
        } else if (data.type === 'message' && ws.username) {
          // Broadcast message to all clients
          const chatMessage: ChatMessage = {
            id: data.id,
            type: 'message',
            sender: ws.username,
            content: data.content,
            timestamp: Date.now()
          };

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(chatMessage));
            }
          });
        } else if (data.type === 'receipt' && ws.username) {
          // Broadcast receipt to all clients (so sender can update message status)
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'receipt',
                messageId: data.messageId,
                status: data.status,
                recipient: ws.username
              }));
            }
          });
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.username) {
        console.log('User disconnected:', ws.username);
        const leaveMessage: ChatMessage = {
          id: `leave-${Date.now()}-${Math.random()}`,
          type: 'status',
          content: `${ws.username} left the chat`,
          timestamp: Date.now()
        };

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(leaveMessage));
          }
        });
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Add a graceful shutdown handler
  function gracefulShutdown() {
    console.log('Starting graceful shutdown...');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  }

  // Handle process termination
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Add error handling middleware
  app.use((err: any, _req: any, res: any, next: any) => {
    console.error('Route error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });

  return httpServer;
}

export function setupLoggingEndpoint(app: Express): void {
  app.post("/api/log", (req, res) => {
    try {
      console.error('Client-side error:', req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error logging client error:', error);
      res.status(500).json({ success: false });
    }
  });
}

const generateHotels = (num: number) => [];
const generateRides = (num: number) => [];
const generateDining = (num: number) => [];

interface ChatMessage {
  id: string;
  type: 'message' | 'status' | 'auth' | 'receipt';
  content?: string;
  sender?: string;
  timestamp?: number;
  messageId?: string;
  status?: string;
  userId?: string;
  username?: string;
}