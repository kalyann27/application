import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the preferences schema first for reuse
const userPreferencesSchema = z.object({
  preferredClass: z.string().optional(),
  budget: z.number().optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  travelStyle: z.array(z.string()).optional(),
  favoriteDestinations: z.array(z.string()).optional(),
  accommodationPreferences: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  transportPreferences: z.array(z.string()).optional(),
  climatePreference: z.string().optional(),
  tripDurationPreference: z.string().optional(),
}).optional();

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phone_number: text("phone_number"),
  phone_verified: boolean("phone_verified").default(false),
  otp: text("otp"),
  otp_expires: timestamp("otp_expires"),
  preferences: jsonb("preferences").$type<z.infer<typeof userPreferencesSchema>>(),
  // Google auth fields
  google_id: text("google_id"),
  display_name: text("display_name"),
  avatar_url: text("avatar_url"),
});

// Create base schema from the table
const baseUserSchema = createInsertSchema(users);

// Phone number validation regex
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Extend the base schema with preferences and phone
export const insertUserSchema = baseUserSchema.extend({
  preferences: userPreferencesSchema,
  phone_number: z.string()
    .regex(phoneRegex, 'Phone number must be in E.164 format (e.g. +1234567890)')
    .optional(),
  google_id: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const phoneVerificationSchema = z.object({
  phone_number: z.string().regex(phoneRegex),
  otp: z.string().length(6),
});

export type PhoneVerification = z.infer<typeof phoneVerificationSchema>;

export type BookingType = "flight" | "hotel" | "ride" | "dining";

export type Seat = {
  id: string;
  row: number;
  column: string;
  type: "window" | "middle" | "aisle";
  status: "available" | "occupied" | "selected";
  price?: number;
};

export type FlightBooking = {
  id: string;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  price: number;
  class: string;
  amenities?: string[];
  availableSeats?: Seat[];
  selectedSeat?: Seat;
  stops?: number;
  isFavorite?: boolean;
};

export type HotelBooking = {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  price: number;
  rating: number;
  image: string;
  amenities?: string[];
  isFavorite?: boolean;
};

export type RideBooking = {
  id: string;
  type: string;
  from: string;
  to: string;
  price: number;
  driver?: string;
  pickupTime: string;
};

export type DiningBooking = {
  id: string;
  restaurant: string;
  cuisine: string;
  date: string;
  time: string;
  guests: number;
  price: number;
  rating?: number;
  location?: string;
  image?: string;
  reservationTime: string;
};

export type TravelMemory = {
  id: string;
  title: string;
  location: string;
  date: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  animation: {
    type: "flip" | "fade" | "slide";
    duration: number;
  };
};

export type PackingItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isEssential: boolean;
  weather: string[];
  tripType: string[];
  notes?: string;
};

export type PackingList = {
  id: string;
  userId: number;
  destination: string;
  tripStartDate: string;
  tripEndDate: string;
  weather: string;
  activities: string[];
  items: PackingItem[];
  recommendations: string[];
  lastUpdated: string;
};