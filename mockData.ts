import { FlightBooking, HotelBooking, RideBooking, DiningBooking, TravelMemory } from "./schema";

const cities = ["New York", "London", "Paris", "Tokyo", "Dubai", "Singapore", "San Francisco", "Miami"];
const airlines = ["American Airlines", "United Airlines", "Delta Air Lines", "Southwest Airlines", "Air Canada"];
const amenities = ["wifi", "meals", "legroom"];
const flightClasses = ["Economy", "Premium Economy", "Business", "First"];

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return idCounter.toString();
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function generateFutureDate(minDays: number = 1, maxDays: number = 30): Date {
  const date = new Date();
  const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

export function generateFlights(count: number): FlightBooking[] {
  return Array(count).fill(null).map(() => {
    const from = randomFromArray(cities);
    let to;
    do {
      to = randomFromArray(cities);
    } while (to === from);

    // Generate future departure and arrival times
    const departure = generateFutureDate();
    const arrival = new Date(departure);
    arrival.setHours(arrival.getHours() + 2 + Math.floor(Math.random() * 8));

    // Random selection of amenities (1-3 amenities)
    const numAmenities = Math.floor(Math.random() * 3) + 1;
    const flightAmenities = Array.from(new Set(
      Array(numAmenities).fill(null).map(() => randomFromArray(amenities))
    ));

    return {
      id: generateId(),
      airline: randomFromArray(airlines),
      from,
      to,
      departure: departure.toISOString(),
      arrival: arrival.toISOString(),
      price: randomPrice(200, 2000),
      class: randomFromArray(flightClasses),
      amenities: flightAmenities,
      stops: Math.floor(Math.random() * 3),
      isFavorite: Math.random() > 0.7 // 30% chance of being favorited
    };
  });
}

export function generateHotels(count: number): HotelBooking[] {
  return Array(count).fill(null).map(() => {
    const checkIn = generateFutureDate();
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 1);

    return {
      id: generateId(),
      name: randomFromArray(hotelNames),
      location: randomFromArray(cities),
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      price: randomPrice(100, 1000),
      rating: Math.floor(Math.random() * 2) + 3,
      image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1470`,
      isFavorite: Math.random() > 0.7 // 30% chance of being favorited
    };
  });
}

export function generateRides(count: number): RideBooking[] {
  return Array(count).fill(null).map(() => {
    const from = randomFromArray(cities);
    const to = randomFromArray(cities.filter(c => c !== from));
    const pickupTime = generateFutureDate(0, 7).toISOString(); // Next 7 days

    return {
      id: generateId(),
      type: randomFromArray(rideTypes),
      from,
      to,
      price: randomPrice(20, 200),
      driver: `Driver ${Math.floor(Math.random() * 100)}`,
      pickupTime
    };
  });
}

export function generateDining(count: number): DiningBooking[] {
  return Array(count).fill(null).map(() => {
    const reservationDate = generateFutureDate(0, 14); // Next 2 weeks
    const hour = Math.floor(Math.random() * 12) + 1;
    const meridian = Math.random() > 0.5 ? 'AM' : 'PM';
    const time = `${hour}:00 ${meridian}`;

    return {
      id: generateId(),
      restaurant: randomFromArray(restaurants),
      cuisine: randomFromArray(cuisines),
      date: reservationDate.toISOString(),
      time,
      guests: Math.floor(Math.random() * 6) + 1,
      price: randomPrice(50, 300),
      reservationTime: reservationDate.toISOString()
    };
  });
}

export function generateTravelMemories(count: number): TravelMemory[] {
  const locations = [
    { 
      city: "Paris",
      country: "France",
      tags: ["culture", "food", "architecture"],
      image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Kyoto",
      country: "Japan",
      tags: ["culture", "temples", "nature"],
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Santorini",
      country: "Greece",
      tags: ["beach", "relaxation", "sunset"],
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "New York",
      country: "USA",
      tags: ["city", "food", "shopping"],
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Bali",
      country: "Indonesia",
      tags: ["adventure", "nature", "beach"],
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Venice",
      country: "Italy",
      tags: ["romance", "culture", "architecture"],
      image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Cape Town",
      country: "South Africa",
      tags: ["nature", "adventure", "wine"],
      image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=2070"
    },
    { 
      city: "Dubai",
      country: "UAE",
      tags: ["luxury", "shopping", "desert"],
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=2070"
    }
  ];

  const descriptions = [
    "An unforgettable journey through the heart of {city}, where every corner told a story of its rich heritage and vibrant present.",
    "Exploring the hidden gems of {city} revealed a tapestry of cultural wonders and breathtaking moments.",
    "From sunrise to sunset, {city} captivated us with its unique blend of tradition and modernity.",
    "Our adventure in {city} was filled with unexpected discoveries and magical moments that will stay with us forever.",
    "The streets of {city} came alive with local flavors, friendly faces, and unforgettable experiences."
  ];

  return Array(count).fill(null).map((_, index) => {
    const location = locations[index % locations.length];
    const { city, country, tags, image } = location;
    const description = descriptions[index % descriptions.length].replace("{city}", city);

    // Generate a date within the last 3 years
    const date = new Date();
    date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 3));
    date.setMonth(Math.floor(Math.random() * 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);

    return {
      id: (index + 1).toString(),
      title: `Discovering ${city}`,
      location: `${city}, ${country}`,
      date: date.toISOString(),
      description,
      imageUrl: image,
      tags: [...tags],
      animation: {
        type: "fade",
        duration: 0.5,
      },
    };
  });
}

export interface MockLocalEvent {
  name: string;
  type: 'sport' | 'cultural' | 'entertainment';
  date: string;
  venue: string;
  description: string;
  ticketPrice?: number;
  category: string;
}

export function generateLocalEvents(city: string): MockLocalEvent[] {
  const events: MockLocalEvent[] = [
    {
      name: "Local Soccer Championship",
      type: "sport",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      venue: `${city} Stadium`,
      description: "Annual soccer championship featuring local teams competing for the city title.",
      ticketPrice: 45,
      category: "Sports"
    },
    {
      name: "Cultural Festival",
      type: "cultural",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      venue: `${city} Convention Center`,
      description: "A celebration of local arts, music, and traditional performances.",
      ticketPrice: 25,
      category: "Arts & Culture"
    },
    {
      name: "Food & Wine Festival",
      type: "entertainment",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      venue: `${city} Square`,
      description: "Taste local cuisine and wine from the region's best restaurants and wineries.",
      ticketPrice: 35,
      category: "Food"
    }
  ];

  return events;
}

export function generateProactiveSuggestions(count: number = 3) {
  const destinations = [
    {
      city: "Barcelona",
      reason: "Upcoming major soccer tournament and cultural festivals",
      timing: "Next month",
      weather: "Sunny, perfect for outdoor events",
      budget: 2500
    },
    {
      city: "Tokyo",
      reason: "Cherry blossom season and traditional festivals",
      timing: "Spring 2025",
      weather: "Mild and pleasant",
      budget: 3500
    },
    {
      city: "New York",
      reason: "Broadway season and major sports events",
      timing: "Fall 2024",
      weather: "Cool and comfortable",
      budget: 3000
    }
  ];

  return destinations.slice(0, count).map(dest => ({
    destination: dest.city,
    reason: dest.reason,
    timing: dest.timing,
    confidence: 0.85 + Math.random() * 0.1,
    estimatedBudget: dest.budget,
    activities: ["Sightseeing", "Local Events", "Cultural Tours", "Sports"],
    weatherPrediction: dest.weather,
    localEvents: generateLocalEvents(dest.city),
    popularAttractions: ["Famous Landmark", "Historic Site", "Local Market"],
    seasonalHighlights: ["Special Festival", "Seasonal Activity", "Local Tradition"],
    eventHighlight: {
      name: generateLocalEvents(dest.city)[0].name,
      date: generateLocalEvents(dest.city)[0].date,
      type: generateLocalEvents(dest.city)[0].type,
      description: generateLocalEvents(dest.city)[0].description,
      significance: "Major seasonal event"
    }
  }));
}

const hotelNames = ["Grand Hotel", "Luxury Suites", "City View Inn", "Ocean Resort"];
const rideTypes = ["Economy", "Premium", "SUV", "Luxury"];
const restaurants = ["Le Bistro", "Sushi Master", "Spice Garden", "The Steakhouse"];
const cuisines = ["French", "Japanese", "Indian", "American"];