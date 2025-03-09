import { z } from 'zod';

export const EventSchema = z.object({
  name: z.string(),
  month: z.string().optional(),
  description: z.string().optional()
});

export const AttractionSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional()
});

export const CitySchema = z.object({
  name: z.string(),
  attractions: z.array(AttractionSchema)
});

export const CountrySchema = z.object({
  name: z.string(),
  cities: z.array(CitySchema),
  events: z.array(EventSchema).optional()
});

export type Event = z.infer<typeof EventSchema>;
export type Attraction = z.infer<typeof AttractionSchema>;
export type City = z.infer<typeof CitySchema>;
export type Country = z.infer<typeof CountrySchema>;

export const travelDestinations: Country[] = [
  {
    name: "United States",
    cities: [
      {
        name: "New York City",
        attractions: [
          { name: "Statue of Liberty", type: "Monument" },
          { name: "Central Park", type: "Park" },
          { name: "Times Square", type: "Landmark" },
          { name: "Broadway Shows", type: "Entertainment" }
        ]
      },
      {
        name: "Los Angeles",
        attractions: [
          { name: "Hollywood Walk of Fame", type: "Landmark" },
          { name: "Griffith Observatory", type: "Science" },
          { name: "Santa Monica Beach", type: "Beach" }
        ]
      },
      {
        name: "Chicago",
        attractions: [
          { name: "Millennium Park", type: "Park" },
          { name: "Art Institute of Chicago", type: "Museum" },
          { name: "Navy Pier", type: "Entertainment" }
        ]
      }
    ],
    events: [
      { name: "Super Bowl", month: "February" },
      { name: "Coachella Music Festival", month: "April" },
      { name: "Thanksgiving Day Parade", month: "November" }
    ]
  },
  {
    name: "Canada",
    cities: [
      {
        name: "Toronto",
        attractions: [
          { name: "CN Tower", type: "Landmark" },
          { name: "Royal Ontario Museum", type: "Museum" },
          { name: "Toronto Islands", type: "Nature" }
        ]
      },
      {
        name: "Vancouver",
        attractions: [
          { name: "Stanley Park", type: "Park" },
          { name: "Capilano Suspension Bridge", type: "Landmark" },
          { name: "Granville Island", type: "Entertainment" }
        ]
      },
      {
        name: "Montreal",
        attractions: [
          { name: "Old Montreal", type: "Historic" },
          { name: "Mount Royal", type: "Nature" }
        ]
      }
    ],
    events: [
      { name: "Montreal International Jazz Festival", month: "July" }
    ]
  },
  {
    name: "United Kingdom",
    cities: [
      {
        name: "London",
        attractions: [
          { name: "Buckingham Palace", type: "Palace" },
          { name: "Tower of London", type: "Historic" },
          { name: "British Museum", type: "Museum" },
          { name: "West End Shows", type: "Entertainment" }
        ]
      },
      {
        name: "Edinburgh",
        attractions: [
          { name: "Edinburgh Castle", type: "Castle" },
          { name: "Royal Mile", type: "Historic" }
        ]
      }
    ],
    events: [
      { name: "Edinburgh Festival Fringe", month: "August" }
    ]
  }
];
