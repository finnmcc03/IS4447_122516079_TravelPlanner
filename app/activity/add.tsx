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
import { db } from '../../db/client';
import { activities, locations } from '../../db/schema';
import { AppContext } from '../_layout';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey || '';

export default function AddActivityScreen() {
  const context = useContext(AppContext);
  const router = useRouter();
  const placesRef = useRef<any>(null);
  const { tripId } = useLocalSearchParams();
  const tripIdNum = Number(tripId);

  const [name, setName] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    lat: string;
    lng: string;
  } | null>(null);

  if (!context) return null;
  const { tripsList, categoriesList, refreshData, userId, theme } = context;

  const trip = tripsList.find((t) => t.id === tripIdNum);
  if (!trip) return null;

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
      let locationId = null;

      // If a place was selected, save it as a location
      if (selectedPlace) {
        const locationResult = await db.insert(locations).values({
          name: selectedPlace.name,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          userId: userId,
        }).returning();
        locationId = locationResult[0].id;
      }

      await db.insert(activities).values({
        name: name.trim(),
        dayNumber: dayNumber,
        duration: Number(duration),
        notes: notes.trim(),
        completed: 0,
        tripId: tripIdNum,
        categoryId: selectedCategoryId,
        locationId: locationId,
        userId: userId,
      });

      await refreshData();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save activity. Please try again.');
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Activity</Text>
        <Text style={styles.subtitle}>{trip.name}</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.text }]}>Activity Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. Visit Eiffel Tower"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: theme.text }]}>Day</Text>
        <View style={styles.dayPicker}>
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayOption,
                { backgroundColor: theme.card, borderColor: theme.border },
                dayNumber === day && styles.dayOptionSelected,
              ]}
              onPress={() => setDayNumber(day)}
            >
              <Text
                style={[
                  styles.dayOptionText,
                  { color: theme.text },
                  dayNumber === day && styles.dayOptionTextSelected,
                ]}
              >
                Day {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Duration (hours)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. 3"
          placeholderTextColor={theme.textMuted}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
        <View style={styles.categoryPicker}>
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                {
                  backgroundColor:
                    selectedCategoryId === cat.id ? cat.colour + '30' : theme.card,
                  borderColor:
                    selectedCategoryId === cat.id ? cat.colour : theme.border,
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
                  { color: theme.text },
                  selectedCategoryId === cat.id && { color: cat.colour },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Any extra details..."
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: theme.text }]}>Location (optional)</Text>
        <GooglePlacesAutocomplete
          ref={placesRef}
          placeholder="Search for a place..."
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
            textInput: [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }],
            container: { flex: 0 },
            listView: [styles.predictionsContainer, { backgroundColor: theme.card, borderColor: theme.border }],
            row: styles.predictionItem,
            description: [styles.predictionText, { color: theme.text }],
          }}
          enablePoweredByContainer={false}
        />

        {selectedPlace && (
          <View style={styles.selectedPlace}>
            <Text style={styles.selectedPlaceText}>{selectedPlace.name}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Activity</Text>
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
  },
  selectedPlaceText: {
    fontSize: 14,
    color: '#27AE60',
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