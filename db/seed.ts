// Claude - "Write a database seeding script for a travel planner app with these tables (SS attached)"

import { db } from './client';
import { activities, categories, locations, targets, trips } from './schema';

export async function seedDatabase(userId: number) {
  // Check if this user already has data
const existingCategories = await db.select().from(categories);
// Claude - SS of categories not appearing in add activites, "Why are the categories not appearing anymore"
const userCategories = existingCategories.filter((c: any) => c.userId === userId);
if (userCategories.length > 0) return;

  // Seed categories
  await db.insert(categories).values([
    { name: 'Sightseeing', colour: '#E74C3C', icon: 'camera', userId },
    { name: 'Food & Drink', colour: '#F39C12', icon: 'restaurant', userId },
    { name: 'Outdoor', colour: '#27AE60', icon: 'leaf', userId },
    { name: 'Shopping', colour: '#8E44AD', icon: 'cart', userId },
    { name: 'Culture', colour: '#2980B9', icon: 'book', userId },
  ]);

  // Seed locations
  await db.insert(locations).values([
    { name: 'Paris, France', latitude: '48.8566', longitude: '2.3522', userId },
    { name: 'Barcelona, Spain', latitude: '41.3874', longitude: '2.1686', userId },
    { name: 'Tokyo, Japan', latitude: '35.6762', longitude: '139.6503', userId },
    { name: 'Eiffel Tower', latitude: '48.8584', longitude: '2.2945', userId },
    { name: 'Louvre Museum', latitude: '48.8606', longitude: '2.3376', userId },
    { name: 'Seine River', latitude: '48.8566', longitude: '2.3415', userId },
    { name: 'Champs-Élysées', latitude: '48.8698', longitude: '2.3075', userId },
    { name: 'Sagrada Familia', latitude: '41.4036', longitude: '2.1744', userId },
    { name: 'La Boqueria Market', latitude: '41.3816', longitude: '2.1719', userId },
    { name: 'Park Güell', latitude: '41.4145', longitude: '2.1527', userId },
    { name: 'Gothic Quarter', latitude: '41.3833', longitude: '2.1761', userId },
    { name: 'Barceloneta Beach', latitude: '41.3785', longitude: '2.1924', userId },
    { name: 'Shibuya Crossing', latitude: '35.6595', longitude: '139.7004', userId },
    { name: 'Tsukiji Market', latitude: '35.6654', longitude: '139.7707', userId },
    { name: 'Mount Takao', latitude: '35.6254', longitude: '139.2437', userId },
    { name: 'Akihabara', latitude: '35.7023', longitude: '139.7745', userId },
    { name: 'Senso-ji Temple', latitude: '35.7148', longitude: '139.7967', userId },
  ]);

  // Seed trips (locationId 1=Paris, 2=Barcelona, 3=Tokyo)
  await db.insert(trips).values([
    { name: 'Paris Weekend', startDate: '10-06-2025', endDate: '13-06-2025', locationId: 1, userId },
    { name: 'Barcelona Summer', startDate: '20-07-2025', endDate: '25-07-2025', locationId: 2, userId },
    { name: 'Tokyo Adventure', startDate: '01-09-2025', endDate: '05-09-2025', locationId: 3, userId },
  ]);

  // Seed activities using dayNumber (Day 1, Day 2, etc.)
  await db.insert(activities).values([
    // Paris Weekend (4 days: Day 1-4)
    { name: 'Eiffel Tower Visit', dayNumber: 1, duration: 3, notes: 'Book tickets in advance', completed: 1, tripId: 1, categoryId: 1, locationId: 4, userId },
    { name: 'Louvre Museum', dayNumber: 2, duration: 4, notes: 'Go early to avoid queues', completed: 1, tripId: 1, categoryId: 5, locationId: 5, userId },
    { name: 'Croissant Tour', dayNumber: 2, duration: 2, notes: 'Try Du Pain et des Idées', completed: 1, tripId: 1, categoryId: 2, locationId: null, userId },
    { name: 'Seine River Walk', dayNumber: 3, duration: 2, notes: '', completed: 1, tripId: 1, categoryId: 3, locationId: 6, userId },
    { name: 'Champs-Élysées Shopping', dayNumber: 4, duration: 3, notes: 'Budget: €200', completed: 1, tripId: 1, categoryId: 4, locationId: 7, userId },

    // Barcelona Summer (6 days: Day 1-6)
    { name: 'Sagrada Familia', dayNumber: 1, duration: 3, notes: 'Book online', completed: 1, tripId: 2, categoryId: 1, locationId: 8, userId },
    { name: 'La Boqueria Market', dayNumber: 2, duration: 2, notes: 'Fresh juices and tapas', completed: 1, tripId: 2, categoryId: 2, locationId: 9, userId },
    { name: 'Park Güell Hike', dayNumber: 3, duration: 3, notes: 'Wear comfortable shoes', completed: 0, tripId: 2, categoryId: 3, locationId: 10, userId },
    { name: 'Gothic Quarter Walk', dayNumber: 4, duration: 2, notes: '', completed: 0, tripId: 2, categoryId: 1, locationId: 11, userId },
    { name: 'Beach Day', dayNumber: 5, duration: 5, notes: 'Barceloneta Beach', completed: 0, tripId: 2, categoryId: 3, locationId: 12, userId },
    { name: 'Tapas Dinner', dayNumber: 6, duration: 2, notes: 'Try El Xampanyet', completed: 0, tripId: 2, categoryId: 2, locationId: null, userId },

    // Tokyo Adventure (5 days: Day 1-5)
    { name: 'Shibuya Crossing', dayNumber: 1, duration: 1, notes: 'Best at night', completed: 0, tripId: 3, categoryId: 1, locationId: 13, userId },
    { name: 'Tsukiji Fish Market', dayNumber: 2, duration: 3, notes: 'Sushi breakfast', completed: 0, tripId: 3, categoryId: 2, locationId: 14, userId },
    { name: 'Mount Takao Hike', dayNumber: 3, duration: 5, notes: 'Trail 1 is most popular', completed: 0, tripId: 3, categoryId: 3, locationId: 15, userId },
    { name: 'Akihabara Shopping', dayNumber: 4, duration: 4, notes: 'Electronics and manga', completed: 0, tripId: 3, categoryId: 4, locationId: 16, userId },
    { name: 'Senso-ji Temple', dayNumber: 5, duration: 2, notes: 'Asakusa area', completed: 0, tripId: 3, categoryId: 5, locationId: 17, userId },
  ]);

  // Seed targets (per-category per-trip)
  await db.insert(targets).values([
    // Paris targets
    { targetValue: 2, tripId: 1, categoryId: 1, userId }, // 2 sightseeing activities
    { targetValue: 1, tripId: 1, categoryId: 2, userId }, // 1 food activity
    { targetValue: 1, tripId: 1, categoryId: 3, userId }, // 1 outdoor activity

    // Barcelona targets
    { targetValue: 2, tripId: 2, categoryId: 1, userId }, // 2 sightseeing
    { targetValue: 2, tripId: 2, categoryId: 2, userId }, // 2 food
    { targetValue: 2, tripId: 2, categoryId: 3, userId }, // 2 outdoor

    // Tokyo targets
    { targetValue: 1, tripId: 3, categoryId: 1, userId }, // 1 sightseeing
    { targetValue: 1, tripId: 3, categoryId: 2, userId }, // 1 food
    { targetValue: 1, tripId: 3, categoryId: 3, userId }, // 1 outdoor
    { targetValue: 1, tripId: 3, categoryId: 5, userId }, // 1 culture
  ]);
}