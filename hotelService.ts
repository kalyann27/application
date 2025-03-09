import { HotelBooking } from "@shared/schema";

// Mock hotel data for demonstration
const mockHotels: HotelBooking[] = [
  {
    id: "1",
    name: "Luxury Palace Hotel",
    location: "New York",
    rating: 5,
    price: 299,
    checkIn: new Date("2025-03-01").toISOString(),
    checkOut: new Date("2025-03-05").toISOString(),
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
  },
  {
    id: "2",
    name: "Business Comfort Inn",
    location: "London",
    rating: 4,
    price: 199,
    checkIn: new Date("2025-03-02").toISOString(),
    checkOut: new Date("2025-03-06").toISOString(),
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800",
  },
  {
    id: "3",
    name: "Seaside Resort",
    location: "Tokyo",
    rating: 5,
    price: 399,
    checkIn: new Date("2025-03-03").toISOString(),
    checkOut: new Date("2025-03-07").toISOString(),
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800",
  },
  {
    id: "4",
    name: "Mountain View Lodge",
    location: "Switzerland",
    rating: 4,
    price: 299,
    checkIn: new Date("2025-03-04").toISOString(),
    checkOut: new Date("2025-03-08").toISOString(),
    image: "https://images.unsplash.com/photo-1585544314038-a0d3769d0193?auto=format&fit=crop&w=800",
  },
  {
    id: "5",
    name: "Desert Oasis Resort",
    location: "Dubai",
    rating: 5,
    price: 499,
    checkIn: new Date("2025-03-05").toISOString(),
    checkOut: new Date("2025-03-09").toISOString(),
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800",
  }
];

export class HotelService {
  async searchHotels(filters: {
    location?: string;
    rating?: number;
    priceRange?: string;
  }): Promise<HotelBooking[]> {
    let filteredHotels = [...mockHotels];

    // Case-insensitive location search
    if (filters.location) {
      filteredHotels = filteredHotels.filter(hotel =>
        hotel.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Rating filter - minimum rating
    if (filters.rating) {
      filteredHotels = filteredHotels.filter(hotel =>
        hotel.rating >= filters.rating!
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const priceRanges = {
        budget: { min: 0, max: 150 },
        mid: { min: 151, max: 300 },
        luxury: { min: 301, max: Infinity }
      };
      const range = priceRanges[filters.priceRange as keyof typeof priceRanges];
      if (range) {
        filteredHotels = filteredHotels.filter(hotel =>
          hotel.price >= range.min && hotel.price <= range.max
        );
      }
    }

    return filteredHotels;
  }

  async getHotel(id: string): Promise<HotelBooking | undefined> {
    return mockHotels.find(hotel => hotel.id === id);
  }
}

export const hotelService = new HotelService();