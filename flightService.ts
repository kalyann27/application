import Amadeus from "amadeus";
import type { FlightBooking } from "@shared/schema";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
  detailedName: string;
}

declare module 'amadeus' {
  interface SearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    adults?: number;
    travelClass?: string;
    max?: number;
  }
}

export class FlightService {
  private amadeus: Amadeus;

  constructor() {
    console.log('Initializing FlightService with Amadeus credentials...');

    if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
      throw new Error('Amadeus API credentials are not configured');
    }

    this.amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
    });

    console.log('FlightService initialized successfully');
  }

  async getAirportsByKeyword(keyword: string): Promise<Airport[]> {
    try {
      console.log('Searching airports with keyword:', keyword);

      if (!keyword || keyword.length < 2) {
        console.log('Search keyword too short');
        return [];
      }

      const response = await this.amadeus.referenceData.locations.get({
        keyword,
        subType: Amadeus.location.airport,
        page: { limit: 10 },
        view: 'FULL'  // Get detailed airport information
      });

      console.log('Amadeus API Response:', {
        statusCode: response.statusCode,
        resultCount: response.result.length
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.log('No airports found or invalid response format');
        return [];
      }

      return response.data.map((location: any): Airport => ({
        code: location.iataCode,
        name: location.name,
        city: location.address.cityName,
        country: location.address.countryName,
        terminal: location.terminal,
        detailedName: `${location.address.cityName} (${location.iataCode}) - ${location.name}`
      }));

    } catch (error) {
      console.error('Error fetching airports:', error);
      throw new Error('Failed to fetch airports');
    }
  }

  async searchFlights(params: SearchParams): Promise<FlightBooking[]> {
    try {
      console.log('Searching flights with params:', params);

      const searchParams = {
        ...params,
        adults: params.adults || 1,
        max: 20,
        currencyCode: 'USD'
      };

      const response = await this.amadeus.shopping.flightOffersSearch.get(searchParams);

      if (!response.data || !Array.isArray(response.data)) {
        console.log('No flights found or invalid response format');
        return [];
      }

      return response.data.map((offer: any) => ({
        id: offer.id,
        airline: this.getAirlineName(offer.validatingAirlineCodes[0]),
        from: offer.itineraries[0].segments[0].departure.iataCode,
        to: offer.itineraries[0].segments[0].arrival.iataCode,
        departure: offer.itineraries[0].segments[0].departure.at,
        arrival: offer.itineraries[0].segments[0].arrival.at,
        price: parseFloat(offer.price.total),
        class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
        stops: offer.itineraries[0].segments.length - 1,
        duration: this.calculateDuration(
          offer.itineraries[0].segments[0].departure.at,
          offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at
        ),
        formattedDeparture: this.formatTimeForMobile(offer.itineraries[0].segments[0].departure.at),
        formattedArrival: this.formatTimeForMobile(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at),
        formattedPrice: `$${parseFloat(offer.price.total).toFixed(2)}`,
      }));
    } catch (error) {
      console.error('Error searching flights:', error);
      throw new Error('Failed to search flights');
    }
  }

  private getAirlineName(code: string): string {
    const airlines: { [key: string]: string } = {
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'DL': 'Delta Air Lines',
      'WN': 'Southwest Airlines',
      'AC': 'Air Canada',
    };
    return airlines[code] || code;
  }

  private calculateDuration(departure: string, arrival: string): string {
    const start = new Date(departure);
    const end = new Date(arrival);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  private formatTimeForMobile(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const monthDay = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${time} | ${monthDay}`;
  }
}

export const flightService = new FlightService();