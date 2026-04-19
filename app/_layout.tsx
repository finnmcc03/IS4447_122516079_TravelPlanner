import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import LoginScreen from '../components/loginscreen';
import RegisterScreen from '../components/registerscreen';
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
  userId: number;
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
  logout: () => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export default function RootLayout() {
  const [userId, setUserId] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [targetsList, setTargetsList] = useState<Target[]>([]);

  // Load all data from database for the logged-in user
  const refreshData = async () => {
    if (!userId) return;

    const allTrips = await db.select().from(trips);
    const allCategories = await db.select().from(categories);
    const allLocations = await db.select().from(locations);
    const allActivities = await db.select().from(activities);
    const allTargets = await db.select().from(targets);

    // Filter by userId
    setTripsList((allTrips as Trip[]).filter((t) => t.userId === userId));
    setCategoriesList((allCategories as Category[]).filter((c) => c.userId === userId));
    setLocationsList((allLocations as Location[]).filter((l) => l.userId === userId));
    setActivitiesList((allActivities as Activity[]).filter((a) => a.userId === userId));
    setTargetsList((allTargets as Target[]).filter((t) => t.userId === userId));
  };

  const logout = () => {
    setUserId(null);
    setShowRegister(false);
    setTripsList([]);
    setCategoriesList([]);
    setLocationsList([]);
    setActivitiesList([]);
    setTargetsList([]);
  };

  const handleLogin = async (id: number) => {
    setUserId(id);
  };

  const handleRegister = async (id: number) => {
    setUserId(id);
  };

  // Load data when userId changes
  useEffect(() => {
    if (userId) {
      const init = async () => {
        await seedDatabase(userId);
        await refreshData();
      };
      init();
    }
  }, [userId]);

  // Not logged in - show login or register
  if (!userId) {
    if (showRegister) {
      return (
        <RegisterScreen
          onRegister={handleRegister}
          onBack={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Logged in - show app
  return (
    <AppContext.Provider
      value={{
        userId,
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
        logout,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </AppContext.Provider>
  );
}