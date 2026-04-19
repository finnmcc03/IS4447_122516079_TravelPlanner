import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TripCard from '../../components/tripcard';
import { db } from '../../db/client';
import { activities, targets, trips } from '../../db/schema';
import { AppContext } from '../_layout';

type FilterOption = 'current_upcoming' | 'current' | 'upcoming' | 'past' | 'all';

const filterLabels: Record<FilterOption, string> = {
  current_upcoming: 'Current & Upcoming',
  current: 'Current',
  upcoming: 'Upcoming',
  past: 'Past',
  all: 'All Trips',
};

export default function TripsScreen() {
  const context = useContext(AppContext);
  const router = useRouter();

  const [filter, setFilter] = useState<FilterOption>('current_upcoming');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  if (!context) return null;

  const { tripsList, activitiesList, locationsList, refreshData, theme } = context;

  // Parse DD-MM-YYYY to Date object
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}`);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredTrips = tripsList.filter((trip) => {
    const start = parseDate(trip.startDate);
    const end = parseDate(trip.endDate);
    switch (filter) {
      case 'current': return start <= today && end >= today;
      case 'upcoming': return start > today;
      case 'past': return end < today;
      case 'current_upcoming': return end >= today;
      case 'all': return true;
      default: return true;
    }
  });

  // Get location name for a trip
  const getLocationName = (locationId: number) => {
    const location = locationsList.find((l) => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  // Get activity counts for a trip
  const getActivityCounts = (tripId: number) => {
    const tripActivities = activitiesList.filter((a) => a.tripId === tripId);
    const completed = tripActivities.filter((a) => a.completed === 1).length;
    return { total: tripActivities.length, completed };
  };

  // Delete a trip and its related activities and targets
  const handleDelete = (tripId: number) => {
    Alert.alert('Delete Trip', 'Are you sure? This will delete the trip and all its activities.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(activities).where(eq(activities.tripId, tripId));
          await db.delete(targets).where(eq(targets.tripId, tripId));
          await db.delete(trips).where(eq(trips.id, tripId));
          await refreshData();
        },
      },
    ]);
  };

  const handlePress = (tripId: number) => {
    router.push(`/trip/${tripId}` as any);
  };

  const handleEdit = (tripId: number) => {
    router.push(`/trip/edit/${tripId}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Showing: {filterLabels[filter]}</Text>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.primaryLight }]}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={[styles.filterButtonText, { color: theme.primary }]}>Filter ▾</Text>
        </TouchableOpacity>
      </View>

      {showFilterDropdown && (
        <View style={[styles.dropdown, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.dropdownItem, { borderBottomColor: theme.border }, filter === option && { backgroundColor: theme.primaryLight }]}
              onPress={() => { setFilter(option); setShowFilterDropdown(false); }}
            >
              <Text style={[styles.dropdownItemText, { color: theme.text }, filter === option && { color: theme.primary, fontWeight: '600' }]}>
                {filterLabels[option]}
              </Text>
              {filter === option && <Text style={[styles.checkIcon, { color: theme.primary }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {filteredTrips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No trips yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Tap the button below to plan your first adventure!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { total, completed } = getActivityCounts(item.id);
            return (
              <TripCard
                id={item.id}
                name={item.name}
                startDate={item.startDate}
                endDate={item.endDate}
                locationName={getLocationName(item.locationId)}
                totalActivities={total}
                completedActivities={completed}
                onPress={handlePress}
                onEdit={handleEdit}
                onDelete={handleDelete}
                theme={theme}
              />
            );
          }}
        />
      )}

      {/* Add trip button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/trip/add' as any)}
      >
        <Text style={styles.addButtonText}>+ New Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

// Claude - "Design a frontend page for a travel planner app lists user trips"
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2980B9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
  filterLabel: { fontSize: 14, color: '#666' },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
  },
  filterButtonText: { color: '#2980B9', fontWeight: '600', fontSize: 14 },
  dropdown: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: { backgroundColor: '#EBF5FB' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  dropdownItemTextSelected: { color: '#2980B9', fontWeight: '600' },
  checkIcon: { color: '#2980B9', fontSize: 16, fontWeight: 'bold' },
});