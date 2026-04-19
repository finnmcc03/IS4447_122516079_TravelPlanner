import { eq } from 'drizzle-orm';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { db } from '../../../db/client';
import { activities, locations } from '../../../db/schema';
import { AppContext } from '../../_layout';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey || '';

export default function EditActivityScreen() {
  const context = useContext(AppContext);
  const router = useRouter();
  const placesRef = useRef<any>(null);
  const { id, tripId } = useLocalSearchParams();
  const activityId = Number(id);
  const tripIdNum = Number(tripId);

  if (!context) return null;
  const { tripsList, activitiesList, categoriesList, locationsList, refreshData } = context;

  const activity = activitiesList.find((a) => a.id === activityId);
  const trip = tripsList.find((t) => t.id === tripIdNum);

  if (!activity || !trip) return null;

  // Get existing location if any
  const existingLocation = activity.locationId
    ? locationsList.find((l) => l.id === activity.locationId)
    : null;

  const [name, setName] = useState(activity.name);
  const [dayNumber, setDayNumber] = useState(activity.dayNumber);
  const [duration, setDuration] = useState(activity.duration.toString());
  const [notes, setNotes] = useState(activity.notes || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(activity.categoryId);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    lat: string;
    lng: string;
  } | null>(
    existingLocation
      ? {
          name: existingLocation.name,
          lat: existingLocation.latitude,
          lng: existingLocation.longitude,
        }
      : null
  );

  // Calculate total days in trip
  const [startDay, startMonth, startYear] = trip.startDate.split('-');
  const [endDay, endMonth, endYear] = trip.endDate.split('-');
  const start = new Date(`${startYear}-${startMonth}-${startDay}`);
  const end = new Date(`${endYear}-${endMonth}-${endDay}`);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an activity name.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration.');
      return;
    }

    try {
      let locationId = activity.locationId;

      // If a new place was selected, save it
      if (
        selectedPlace &&
        (!existingLocation || selectedPlace.name !== existingLocation.name)
      ) {
        const locationResult = await db.insert(locations).values({
          name: selectedPlace.name,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          userId: 1,
        }).returning();
        locationId = locationResult[0].id;
      } else if (!selectedPlace) {
        locationId = null;
      }

      await db
        .update(activities)
        .set({
          name: name.trim(),
          dayNumber: dayNumber,
          duration: Number(duration),
          notes: notes.trim(),
          categoryId: selectedCategoryId,
          locationId: locationId,
        })
        .where(eq(activities.id, activityId));

      await refreshData();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity. Please try again.');
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Activity</Text>
        <Text style={styles.subtitle}>{trip.name}</Text>
      </View>

      <View style={styles.form}>
        {/* Activity Name */}
        <Text style={styles.label}>Activity Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Visit Eiffel Tower"
          value={name}
          onChangeText={setName}
        />

        {/* Day Number */}
        <Text style={styles.label}>Day</Text>
        <View style={styles.dayPicker}>
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayOption,
                dayNumber === day && styles.dayOptionSelected,
              ]}
              onPress={() => setDayNumber(day)}
            >
              <Text
                style={[
                  styles.dayOptionText,
                  dayNumber === day && styles.dayOptionTextSelected,
                ]}
              >
                Day {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.label}>Duration (hours)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 3"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryPicker}>
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                {
                  backgroundColor:
                    selectedCategoryId === cat.id ? cat.colour + '30' : '#fff',
                  borderColor:
                    selectedCategoryId === cat.id ? cat.colour : '#ddd',
                },
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <View
                style={[styles.categoryDot, { backgroundColor: cat.colour }]}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  selectedCategoryId === cat.id && { color: cat.colour },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Any extra details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Location Search */}
        <Text style={styles.label}>Location (optional)</Text>
        <GooglePlacesAutocomplete
          ref={placesRef}
          placeholder="Search for a place..."
          textInputProps={{
            defaultValue: selectedPlace?.name || '',
          }}
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              setSelectedPlace({
                name: data.description,
                lat: details.geometry.location.lat.toString(),
                lng: details.geometry.location.lng.toString(),
              });
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
            textInput: styles.input,
            container: { flex: 0 },
            listView: styles.predictionsContainer,
            row: styles.predictionItem,
            description: styles.predictionText,
          }}
          enablePoweredByContainer={false}
        />

        {selectedPlace && (
          <View style={styles.selectedPlace}>
            <Text style={styles.selectedPlaceText}>{selectedPlace.name}</Text>
            <TouchableOpacity onPress={() => setSelectedPlace(null)}>
              <Text style={styles.removePlace}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#2980B9',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#D6EAF8',
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayOptionSelected: {
    backgroundColor: '#2980B9',
    borderColor: '#2980B9',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dayOptionTextSelected: {
    color: '#fff',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  predictionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
  },
  predictionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  predictionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedPlace: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#E8F8F5',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPlaceText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
    flex: 1,
  },
  removePlace: {
    fontSize: 13,
    color: '#E74C3C',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2980B9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});