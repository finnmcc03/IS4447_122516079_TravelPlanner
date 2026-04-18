import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { db } from '../db/client';
import { activities, categories, locations, targets, trips } from '../db/schema';
import { seedDatabase } from '../db/seed';

// Types
export type Trip = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  locationId: number;
  userId: number;
};

export type Category = {
  id: number;
  name: string;
  colour: string;
  icon: string;
  userId: number;
};

export type Location = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  userId: number;
};

export type Activity = {
  id: number;
  name: string;
  dayNumber: number;
  duration: number;
  notes: string;
  completed: number;
  tripId: number;
  categoryId: number;
  locationId: number | null;
  userId: number;
};

export type Target = {
  id: number;
  targetValue: number;
  tripId: number;
  categoryId: number;
  userId: number;
};

// Context type
type AppContextType = {
  tripsList: Trip[];
  setTripsList: React.Dispatch<React.SetStateAction<Trip[]>>;
  categoriesList: Category[];
  setCategoriesList: React.Dispatch<React.SetStateAction<Category[]>>;
  locationsList: Location[];
  setLocationsList: React.Dispatch<React.SetStateAction<Location[]>>;
  activitiesList: Activity[];
  setActivitiesList: React.Dispatch<React.SetStateAction<Activity[]>>;
  targetsList: Target[];
  setTargetsList: React.Dispatch<React.SetStateAction<Target[]>>;
  refreshData: () => Promise<void>;
};

export const AppContext = createContext<AppContextType | null>(null);

export default function RootLayout() {
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [targetsList, setTargetsList] = useState<Target[]>([]);

  // Load all data from database
  const refreshData = async () => {
    const allTrips = await db.select().from(trips);
    const allCategories = await db.select().from(categories);
    const allLocations = await db.select().from(locations);
    const allActivities = await db.select().from(activities);
    const allTargets = await db.select().from(targets);

    setTripsList(allTrips as Trip[]);
    setCategoriesList(allCategories as Category[]);
    setLocationsList(allLocations as Location[]);
    setActivitiesList(allActivities as Activity[]);
    setTargetsList(allTargets as Target[]);
  };

  // Seed + load on startup
  useEffect(() => {
    const init = async () => {
      await seedDatabase(1); // userId 1 for now, will use real userId after login
      await refreshData();
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        tripsList,
        setTripsList,
        categoriesList,
        setCategoriesList,
        locationsList,
        setLocationsList,
        activitiesList,
        setActivitiesList,
        targetsList,
        setTargetsList,
        refreshData,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </AppContext.Provider>
  );
}