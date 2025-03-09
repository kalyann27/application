import OpenAI from "openai";
import { User } from "@shared/schema";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface CulturalInsight {
  customs: string[];
  etiquette: string[];
  localTips: string[];
  significance: string;
  doAndDonts: {
    do: string[];
    dont: string[];
  };
}

export interface UserBehaviorAnalysis {
  interests: string[];
  travelStyle: string;
  preferredDestinations: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  seasonalPreferences: string[];
  confidence: number;
}

export interface ProactiveSuggestion {
  destination: string;
  reason: string;
  timing: string;
  confidence: number;
  estimatedBudget: number;
  activities: string[];
  weatherPrediction: string;
  localEvents: string[];
}

interface SmartBookingRecommendation {
  type: 'flight' | 'hotel' | 'package';
  destination: string;
  startDate: string;
  endDate: string;
  price: number;
  confidence: number;
  reason: string;
  flightDetails?: {
    airline: string;
    stops: number;
    duration: string;
    departureTime: string;
    arrivalTime: string;
  };
  hotelDetails?: {
    name: string;
    rating: number;
    amenities: string[];
    location: string;
  };
}

export interface TripPlan {
  id: string;
  title: string;
  destination: string;
  duration: number;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    breakdown: {
      accommodation: number;
      activities: number;
      transportation: number;
      food: number;
      other: number;
    };
  };
  schedule: Array<{
    day: number;
    date: string;
    activities: Array<{
      id: string;
      title: string;
      type: 'sightseeing' | 'activity' | 'meal' | 'transport' | 'rest';
      startTime: string;
      endTime: string;
      location: string;
      description: string;
      cost: number;
      bookingRequired: boolean;
      bookingUrl?: string;
      weatherDependent: boolean;
      alternativeOptions?: Array<{
        id: string;
        title: string;
        reason: string;
      }>;
    }>;
    summary: {
      totalActivities: number;
      totalCost: number;
      walkingDistance: number;
      weatherForecast?: string;
    };
  }>;
  recommendations: {
    packingList: string[];
    localTips: string[];
    weatherAdvice: string;
    culturalNotes: string[];
  };
}

export interface TripPreferences {
  pace: 'relaxed' | 'moderate' | 'intensive';
  interests: string[];
  mustSeeAttractions: string[];
  avoidTypes: string[];
  mealPreferences: string[];
  budgetLevel: 'budget' | 'moderate' | 'luxury';
  transportationPreferences: string[];
  specialRequirements?: string[];
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private async getAICompletion(systemPrompt: string, userMessage: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    return JSON.parse(content);
  }

  async handleChatbotMessage(
    message: string,
    user: User,
    currentLocation?: string,
    chatHistory: ChatCompletionMessageParam[] = []
  ): Promise<{
    message: string;
    culturalContext?: CulturalInsight;
    suggestions: string[];
    type: "general" | "cultural" | "recommendation" | "translation";
  }> {
    try {
      const systemPrompt = `You are an AI travel companion with expertise in global cultures and travel planning. 
      Current user preferences: ${JSON.stringify(user.preferences)}
      ${currentLocation ? `Current location context: ${currentLocation}` : ''}

      Respond in a helpful and friendly manner. Focus on providing accurate travel advice and cultural insights.
      Keep responses concise but informative.`;

      const result = await this.getAICompletion(systemPrompt, message);

      if (currentLocation && (
        message.toLowerCase().includes(currentLocation.toLowerCase()) ||
        message.toLowerCase().includes('culture') ||
        result.type === 'cultural'
      )) {
        try {
          const culturalContext = await this.getCulturalInsights(currentLocation);
          return { ...result, culturalContext };
        } catch (error) {
          console.error('Failed to get cultural insights:', error);
          return result;
        }
      }

      return result;
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        message: "I apologize, but I'm having trouble understanding that right now. Could you please rephrase your question?",
        suggestions: ["Ask about a specific destination", "Ask about travel planning", "Ask about local culture"],
        type: "general"
      };
    }
  }

  async getCulturalInsights(location: string): Promise<CulturalInsight> {
    const systemPrompt = `Generate cultural insights for ${location} in JSON format with customs, etiquette, local tips, and do's/don'ts.`;
    return this.getAICompletion(systemPrompt, location);
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a professional translator. Translate the provided text into ${targetLanguage}. Only respond with the translation in JSON format: { "translation": "translated text" }`;
    const result = await this.getAICompletion(systemPrompt, text);
    return result.translation;
  }

  async generateLocalExperiences(location: string, user: User) {
    const systemPrompt = `Generate personalized local experiences and activities based on user preferences and travel style.
    Focus on unique, authentic experiences that match their interests.`;
    return this.getAICompletion(systemPrompt, `Generate local experience recommendations for ${location}. User preferences: ${JSON.stringify(user.preferences)}`);
  }

  async generateTravelRecommendations(user: User) {
    const systemPrompt = "Based on the user's preferences, generate personalized travel recommendations with suggested destinations and activities.";
    return this.getAICompletion(systemPrompt, `Generate travel recommendations for user with preferences: ${JSON.stringify(user.preferences)}`);
  }

  async analyzeTravelPreferences(searchHistory: any[]) {
    const systemPrompt = "Analyze the user's travel search history and identify preferences and patterns.";
    return this.getAICompletion(systemPrompt, `Analyze this travel search history: ${JSON.stringify(searchHistory)}`);
  }

  async getPersonalizedDescription(item: any, userPreferences: any) {
    const systemPrompt = "Generate a personalized description highlighting aspects that match the user's interests.";
    return this.getAICompletion(systemPrompt, `Generate a personalized description for: ${JSON.stringify(item)} based on preferences: ${JSON.stringify(userPreferences)}`);
  }

  async analyzeUserBehavior(
    user: User,
    searchHistory: any[],
    bookingHistory: any[]
  ): Promise<UserBehaviorAnalysis> {
    const systemPrompt = `Analyze the user's travel behavior and preferences based on their search and booking history.
    Generate insights about interests, travel style, and preferences.`;

    return this.getAICompletion(
      systemPrompt,
      `User preferences: ${JSON.stringify(user.preferences)}
      Search history: ${JSON.stringify(searchHistory)}
      Booking history: ${JSON.stringify(bookingHistory)}`
    );
  }

  async getLocalEvents(location: string, dates: { start: string; end: string }) {
    const systemPrompt = `Generate local events and activities for the specified location and dates.
    Include various types of events (cultural, sports, entertainment) with detailed information.`;

    return this.getAICompletion(
      systemPrompt,
      `Generate events for:
      Location: ${location}
      Dates: ${JSON.stringify(dates)}`
    );
  }

  async generateProactiveSuggestions(
    userBehavior: UserBehaviorAnalysis,
    currentDate: string,
    upcomingEvents?: string[]
  ): Promise<ProactiveSuggestion[]> {
    const systemPrompt = `Generate personalized travel suggestions based on user behavior and upcoming events.
    Consider travel style, interests, and timing preferences.`;

    return this.getAICompletion(
      systemPrompt,
      `User behavior: ${JSON.stringify(userBehavior)}
      Current date: ${currentDate}
      Upcoming events: ${JSON.stringify(upcomingEvents || [])}`
    );
  }

  async getSmartBookingRecommendations(
    destination: string,
    dates: { start: string; end: string },
    preferences: any
  ): Promise<SmartBookingRecommendation[]> {
    const systemPrompt = `Generate personalized travel booking recommendations based on preferences and trends.
    Include detailed flight and hotel options with confidence scores.`;

    return this.getAICompletion(
      systemPrompt,
      `Generate booking recommendations for:
      Destination: ${destination}
      Dates: ${JSON.stringify(dates)}
      Preferences: ${JSON.stringify(preferences)}`
    );
  }

  async analyzeTravelTrends(destination: string): Promise<{
    bestTimeToBook: string;
    priceHistory: Array<{ date: string; price: number }>;
    pricePrediction: {
      nextWeek: number;
      nextMonth: number;
      trend: 'rising' | 'falling' | 'stable';
    };
  }> {
    const systemPrompt = `Analyze travel trends and generate price predictions for the destination.
    Include historical data and future predictions.`;

    return this.getAICompletion(systemPrompt, `Analyze travel trends for: ${destination}`);
  }

  async getItineraryOptimizations(
    itinerary: any[],
    preferences: any
  ): Promise<{
    optimizedOrder: any[];
    suggestions: string[];
    timeSaved: number;
    costSaved: number;
  }> {
    const systemPrompt = `Optimize travel itinerary based on preferences, locations, and timing.
    Consider factors like distance, cost, and user preferences.`;

    return this.getAICompletion(
      systemPrompt,
      `Optimize itinerary:
      Current plan: ${JSON.stringify(itinerary)}
      Preferences: ${JSON.stringify(preferences)}`
    );
  }

  async getCustomizedTravelGuide(
    destination: string,
    userPreferences: any,
    duration: number
  ): Promise<{
    highlights: string[];
    dayByDayPlan: Array<{
      day: number;
      activities: string[];
      meals: string[];
      tips: string[];
    }>;
    customTips: string[];
  }> {
    const systemPrompt = `Create a personalized travel guide based on user preferences and trip duration.
    Include daily activities, dining suggestions, and custom tips.`;

    return this.getAICompletion(
      systemPrompt,
      `Create guide for:
      Destination: ${destination}
      Duration: ${duration} days
      Preferences: ${JSON.stringify(userPreferences)}`
    );
  }
  async generateDetailedTripPlan(
    destination: string,
    dates: { start: string; end: string },
    preferences: TripPreferences,
    user: User
  ): Promise<TripPlan> {
    const systemPrompt = `Create a detailed, personalized trip plan for ${destination}.
    Consider user preferences, weather, local events, and optimal activity scheduling.
    Include detailed daily schedules with timing, costs, and alternatives.`;

    const planRequest = {
      destination,
      dates,
      preferences,
      userProfile: {
        preferences: user.preferences,
        // Add any relevant user profile data
      }
    };

    return this.getAICompletion(systemPrompt, JSON.stringify(planRequest));
  }

  async optimizeTripSchedule(
    plan: TripPlan,
    constraints: {
      weatherUpdate?: string;
      crowdLevels?: Record<string, 'low' | 'medium' | 'high'>;
      closures?: string[];
      specialEvents?: Array<{ name: string; date: string; location: string }>;
    }
  ): Promise<TripPlan> {
    const systemPrompt = `Optimize the existing trip schedule based on new constraints.
    Maintain the overall structure while adjusting for weather, crowds, and special events.
    Suggest alternative activities when needed.`;

    const optimizationRequest = {
      currentPlan: plan,
      constraints,
      optimizationGoals: [
        'Minimize travel time between activities',
        'Avoid peak crowds',
        'Account for weather conditions',
        'Maximize special event opportunities'
      ]
    };

    return this.getAICompletion(systemPrompt, JSON.stringify(optimizationRequest));
  }

  async suggestDynamicAlternatives(
    activity: TripPlan['schedule'][0]['activities'][0],
    context: {
      currentLocation: string;
      timeConstraints: { start: string; end: string };
      weather?: string;
      crowdLevel?: 'low' | 'medium' | 'high';
    }
  ): Promise<Array<{
    id: string;
    title: string;
    type: string;
    reason: string;
    score: number;
  }>> {
    const systemPrompt = `Suggest alternative activities based on current conditions and constraints.
    Consider location, time available, weather, and crowd levels.
    Rank suggestions by suitability.`;

    return this.getAICompletion(systemPrompt, JSON.stringify({
      originalActivity: activity,
      context
    }));
  }

  async generateTripInsights(
    destination: string,
    dates: { start: string; end: string }
  ): Promise<{
    localEvents: Array<{ name: string; date: string; type: string; significance: string }>;
    seasonalHighlights: string[];
    crowdPredictions: Record<string, 'low' | 'medium' | 'high'>;
    weatherInsights: string;
    culturalCalendar: Array<{ event: string; date: string; impact: string }>;
  }> {
    const systemPrompt = `Generate comprehensive travel insights for the destination and dates.
    Include local events, seasonal activities, crowd predictions, and cultural calendar.`;

    return this.getAICompletion(systemPrompt, JSON.stringify({ destination, dates }));
  }

  async generatePackingRecommendations(data: {
    destination: string;
    tripStartDate: string;
    tripEndDate: string;
    activities: string[];
    user: User;
  }): Promise<{
    items: PackingItem[];
    recommendations: string[];
    weather: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a travel packing expert. Generate a detailed packing list and recommendations based on the destination, dates, activities, and user preferences. Consider weather, activities, duration, and local culture. 
            Response should be in JSON format with:
            {
              "items": [
                {
                  "id": "unique-string",
                  "name": "string",
                  "category": "clothing|toiletries|electronics|documents|accessories",
                  "quantity": number,
                  "isEssential": boolean,
                  "weather": ["sunny", "rainy", "cold", etc],
                  "tripType": ["business", "leisure", "adventure", etc],
                  "notes": "string"
                }
              ],
              "recommendations": ["string array of specific tips"],
              "weather": "expected weather conditions"
            }`
          },
          {
            role: "user",
            content: `Generate packing recommendations for:
            Destination: ${data.destination}
            Start Date: ${data.tripStartDate}
            End Date: ${data.tripEndDate}
            Activities: ${data.activities.join(", ")}
            User Preferences: ${JSON.stringify(data.user.preferences)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{"items": [], "recommendations": [], "weather": ""}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating packing recommendations:', error);
      throw new Error('Failed to generate packing recommendations');
    }
  }
}

type PackingItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isEssential: boolean;
  weather: string[];
  tripType: string[];
  notes: string;
};

export const aiService = new AIService();