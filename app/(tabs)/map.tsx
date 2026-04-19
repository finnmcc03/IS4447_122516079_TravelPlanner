import { useContext, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AppContext } from '../_layout';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey || '';

type ActivityWithLocation = {
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
  locationName: string;
  latitude: number;
  longitude: number;
  tripName: string;
  categoryName: string;
  categoryColour: string;
};

export default function MapScreen() {
  const context = useContext(AppContext);
  const mapRef = useRef<MapView>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithLocation | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  if (!context) return null;

  const { activitiesList, tripsList, categoriesList, locationsList } = context;

  // Get all activities that have a location
  const activitiesWithLocation = useMemo(() => {
    return activitiesList
      .filter((a) => a.locationId !== null)
      .map((activity) => {
        const location = locationsList.find((l) => l.id === activity.locationId);
        const trip = tripsList.find((t) => t.id === activity.tripId);
        const category = categoriesList.find((c) => c.id === activity.categoryId);

        if (!location) return null;

        return {
          ...activity,
          locationName: location.name,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          tripName: trip ? trip.name : 'Unknown Trip',
          categoryName: category ? category.name : 'Unknown',
          categoryColour: category ? category.colour : '#999',
        };
      })
      .filter((a) => a !== null && !isNaN(a.latitude) && !isNaN(a.longitude)) as ActivityWithLocation[];
  }, [activitiesList, locationsList, tripsList, categoriesList]);

  // Filter activities by search and category
  const filteredActivities = useMemo(() => {
    if (selectedCategoryId === null) return activitiesWithLocation;
    return activitiesWithLocation.filter((a) => a.categoryId === selectedCategoryId);
  }, [activitiesWithLocation, selectedCategoryId]);

  // Calculate initial region to fit all markers
  const initialRegion = useMemo(() => {
    if (activitiesWithLocation.length === 0) {
      return {
        latitude: 30,
        longitude: 0,
        latitudeDelta: 100,
        longitudeDelta: 100,
      };
    }

    const lats = activitiesWithLocation.map((a) => a.latitude);
    const lngs = activitiesWithLocation.map((a) => a.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    const deltaLat = Math.max((maxLat - minLat) * 1.5, 0.5);
    const deltaLng = Math.max((maxLng - minLng) * 1.5, 0.5);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  }, [activitiesWithLocation]);

  const [currentRegion, setCurrentRegion] = useState(initialRegion);

  // Zoom to fit filtered activities
  const zoomToFitFiltered = () => {
    if (filteredActivities.length === 0) return;

    const lats = filteredActivities.map((a) => a.latitude);
    const lngs = filteredActivities.map((a) => a.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    mapRef.current?.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
      },
      500
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search for a place..."
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              setSelectedActivity(null);
              mapRef.current?.animateToRegion(
                {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                500
              );
            }
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: 'en',
          }}
          fetchDetails={true}
          listViewDisplayed="auto"
          keyboardShouldPersistTaps="handled"
          styles={{
            textInput: styles.searchInput,
            container: { flex: 0 },
            listView: {
              backgroundColor: '#fff',
              borderRadius: 8,
              elevation: 3,
            },
          }}
          enablePoweredByContainer={false}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCategoryId === null && styles.filterChipSelected,
          ]}
          onPress={() => {
            setSelectedCategoryId(null);
            setSelectedActivity(null);
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCategoryId === null && styles.filterChipTextSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categoriesList.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              selectedCategoryId === cat.id && {
                backgroundColor: cat.colour + '20',
                borderColor: cat.colour,
              },
            ]}
            onPress={() => {
              setSelectedCategoryId(
                selectedCategoryId === cat.id ? null : cat.id
              );
              setSelectedActivity(null);
            }}
          >
            <View
              style={[styles.filterDot, { backgroundColor: cat.colour }]}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedCategoryId === cat.id && { color: cat.colour },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No activities found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCategoryId !== null
              ? 'Try a different search or filter'
              : 'Add activities with locations to see them on the map'}
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onRegionChangeComplete={(region) => setCurrentRegion(region)}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            zoomControlsEnabled={false}
            onPress={() => setSelectedActivity(null)}
          >
            {filteredActivities.map((activity) => (
              <Marker
                key={activity.id}
                coordinate={{
                  latitude: activity.latitude,
                  longitude: activity.longitude,
                }}
                pinColor={activity.categoryColour}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedActivity(activity);
                  mapRef.current?.animateToRegion(
                    {
                      latitude: activity.latitude,
                      longitude: activity.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    500
                  );
                }}
              />
            ))}
          </MapView>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  ...currentRegion,
                  latitudeDelta: currentRegion.latitudeDelta / 2,
                  longitudeDelta: currentRegion.longitudeDelta / 2,
                });
              }}
            >
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  ...currentRegion,
                  latitudeDelta: currentRegion.latitudeDelta * 2,
                  longitudeDelta: currentRegion.longitudeDelta * 2,
                });
              }}
            >
              <Text style={styles.zoomText}>−</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Card - shows when a marker is tapped */}
          {selectedActivity && (
            <View style={styles.bottomCard}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedActivity(null)}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>

              <Text style={styles.cardTitle}>{selectedActivity.name}</Text>
              <Text style={styles.cardTrip}>{selectedActivity.tripName}</Text>
              <Text style={styles.cardLocation}>{selectedActivity.locationName}</Text>

              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.cardBadge,
                    { backgroundColor: selectedActivity.categoryColour + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardBadgeText,
                      { color: selectedActivity.categoryColour },
                    ]}
                  >
                    {selectedActivity.categoryName}
                  </Text>
                </View>
                <Text style={styles.cardDuration}>{selectedActivity.duration}h</Text>
                <Text style={styles.cardDay}>Day {selectedActivity.dayNumber}</Text>
              </View>

              {selectedActivity.notes ? (
                <Text style={styles.cardNotes}>{selectedActivity.notes}</Text>
              ) : null}

              <View
                style={[
                  styles.cardStatus,
                  {
                    backgroundColor:
                      selectedActivity.completed === 1 ? '#E8F8F5' : '#FEF5E7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardStatusText,
                    {
                      color:
                        selectedActivity.completed === 1 ? '#27AE60' : '#E67E22',
                    },
                  ]}
                >
                  {selectedActivity.completed === 1
                    ? 'Completed'
                    : 'Not completed'}
                </Text>
              </View>
            </View>
          )}

          {/* Legend - hide when card is showing */}
          {!selectedActivity && (
            <View style={styles.legend}>
              {categoriesList.map((cat) => {
                const count = filteredActivities.filter(
                  (a) => a.categoryId === cat.id
                ).length;
                if (count === 0) return null;
                return (
                  <View key={cat.id} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: cat.colour },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {cat.name} ({count})
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
    paddingRight: 36,
    fontSize: 15,
  },
  filterContainer: {
    maxHeight: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#EBF5FB',
    borderColor: '#2980B9',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#2980B9',
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  map: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
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
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  zoomText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    paddingRight: 30,
  },
  cardTrip: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  cardLocation: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDuration: {
    fontSize: 13,
    color: '#666',
  },
  cardDay: {
    fontSize: 13,
    color: '#666',
  },
  cardNotes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardStatus: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  cardStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#555',
  },
});