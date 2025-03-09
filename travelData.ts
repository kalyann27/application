import { z } from "zod";

export const TravelDestinationSchema = z.object({
  country: z.string(),
  cities: z.array(z.object({
    name: z.string(),
    attractions: z.array(z.string())
  })),
  events: z.array(z.object({
    name: z.string(),
    month: z.string(),
    description: z.string().optional()
  }))
});

export type TravelDestination = z.infer<typeof TravelDestinationSchema>;

export const travelDestinations: TravelDestination[] = [
  {
    country: "United States",
    cities: [
      {
        name: "New York City",
        attractions: ["Statue of Liberty", "Central Park", "Times Square", "Broadway Shows"]
      },
      {
        name: "Los Angeles",
        attractions: ["Hollywood Walk of Fame", "Griffith Observatory", "beaches of Santa Monica"]
      },
      {
        name: "Chicago",
        attractions: ["Millennium Park", "Art Institute of Chicago", "Navy Pier"]
      }
    ],
    events: [
      {
        name: "Super Bowl",
        month: "February"
      },
      {
        name: "Coachella Music Festival",
        month: "April"
      },
      {
        name: "Thanksgiving Day Parade",
        month: "November"
      }
    ]
  },
  {
    country: "Japan",
    cities: [
      {
        name: "Tokyo",
        attractions: ["Shibuya Crossing", "Tokyo Tower", "Meiji Shrine"]
      },
      {
        name: "Kyoto",
        attractions: ["Kinkaku-ji (Golden Pavilion)", "Fushimi Inari Shrine"]
      }
    ],
    events: [
      {
        name: "Cherry Blossom Festivals",
        month: "March-April",
        description: "Experience the beauty of sakura throughout Japan"
      },
      {
        name: "Gion Matsuri",
        month: "July",
        description: "One of Japan's most famous festivals"
      }
    ]
  },
  {
    country: "India",
    cities: [
      {
        name: "Delhi",
        attractions: ["India Gate", "Red Fort", "Qutub Minar"]
      },
      {
        name: "Agra",
        attractions: ["Taj Mahal", "Agra Fort"]
      }
    ],
    events: [
      {
        name: "Diwali",
        month: "October-November",
        description: "Festival of Lights"
      },
      {
        name: "Holi",
        month: "March",
        description: "Festival of Colors"
      }
    ]
  },
  {
    country: "Thailand",
    cities: [
      {
        name: "Bangkok",
        attractions: ["Grand Palace", "Wat Pho", "Chatuchak Market"]
      },
      {
        name: "Phuket",
        attractions: ["Patong Beach", "Big Buddha"]
      }
    ],
    events: [
      {
        name: "Songkran",
        month: "April",
        description: "Thai New Year Water Festival"
      },
      {
        name: "Loy Krathong",
        month: "November",
        description: "Festival of Light"
      }
    ]
  },
  {
    country: "Australia",
    cities: [
      {
        name: "Sydney",
        attractions: ["Sydney Opera House", "Harbour Bridge", "Bondi Beach"]
      },
      {
        name: "Great Barrier Reef",
        attractions: ["Snorkeling", "Diving", "Coral Reefs"]
      }
    ],
    events: [
      {
        name: "Sydney New Year's Eve",
        month: "December",
        description: "Spectacular fireworks display"
      },
      {
        name: "Vivid Sydney",
        month: "May-June",
        description: "Festival of Light, Music and Ideas"
      }
    ]
  },
  {
    country: "New Zealand",
    cities: [
      {
        name: "Auckland",
        attractions: ["Sky Tower", "Black Sand Beaches"]
      },
      {
        name: "Queenstown",
        attractions: ["Skiing Resorts", "Bungee Jumping Sites", "Adventure Sports"]
      }
    ],
    events: [
      {
        name: "Waitangi Day",
        month: "February",
        description: "New Zealand's National Day"
      },
      {
        name: "International Film Festival",
        month: "July"
      }
    ]
  },
  {
    country: "Mexico",
    cities: [
      {
        name: "Mexico City",
        attractions: ["Zócalo", "Frida Kahlo Museum", "Teotihuacan"]
      },
      {
        name: "Cancun",
        attractions: ["Beaches", "Cenotes", "Mayan Ruins"]
      }
    ],
    events: [
      {
        name: "Dia de los Muertos",
        month: "November",
        description: "Day of the Dead celebrations"
      },
      {
        name: "Spring Break",
        month: "March",
        description: "Peak tourist season"
      }
    ]
  },
  {
    country: "Brazil",
    cities: [
      {
        name: "Rio de Janeiro",
        attractions: ["Christ the Redeemer", "Sugarloaf Mountain", "Copacabana Beach"]
      }
    ],
    events: [
      {
        name: "Carnival",
        month: "February-March",
        description: "World's biggest carnival"
      },
      {
        name: "Festa Junina",
        month: "June",
        description: "Traditional Brazilian winter festival"
      }
    ]
  },
  {
    country: "Canada",
    cities: [
      {
        name: "Toronto",
        attractions: ["CN Tower", "Royal Ontario Museum", "Toronto Islands"]
      },
      {
        name: "Vancouver",
        attractions: ["Stanley Park", "Capilano Suspension Bridge", "Granville Island"]
      },
      {
        name: "Montreal",
        attractions: ["Old Montreal", "Mount Royal"]
      }
    ],
    events: [
      {
        name: "Montreal International Jazz Festival",
        month: "July"
      }
    ]
  },
  {
    country: "United Kingdom",
    cities: [
      {
        name: "London",
        attractions: ["Buckingham Palace", "Tower of London", "British Museum", "West End Shows"]
      },
      {
        name: "Edinburgh",
        attractions: ["Edinburgh Castle", "Royal Mile"]
      }
    ],
    events: [
      {
        name: "Edinburgh Festival Fringe",
        month: "August"
      }
    ]
  },
  {
    country: "France",
    cities: [
      {
        name: "Paris",
        attractions: ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral"]
      }
    ],
    events: [
      {
        name: "Bastille Day",
        month: "July"
      },
      {
        name: "Nuit Blanche",
        month: "October"
      }
    ]
  },
  {
    country: "Italy",
    cities: [
      {
        name: "Rome",
        attractions: ["Colosseum", "Vatican City", "Trevi Fountain"]
      },
      {
        name: "Venice",
        attractions: ["Grand Canal", "St. Mark's Square"]
      }
    ],
    events: [
      {
        name: "Venice Carnival",
        month: "February"
      }
    ]
  },
  {
    country: "Germany",
    cities: [
      {
        name: "Berlin",
        attractions: ["Brandenburg Gate", "Berlin Wall", "Museum Island"]
      },
      {
        name: "Munich",
        attractions: ["Marienplatz", "English Garden"]
      }
    ],
    events: [
      {
        name: "Oktoberfest",
        month: "September-October"
      },
      {
        name: "Christmas Markets",
        month: "December"
      }
    ]
  }
];