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
import { Calendar } from 'react-native-calendars';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { db } from '../../../db/client';
import { locations, trips } from '../../../db/schema';
import { AppContext } from '../../_layout';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey || '';

export default function EditTripScreen() {
  const context = useContext(AppContext);
  const router = useRouter();
  const placesRef = useRef<any>(null);
  const { id } = useLocalSearchParams();
  const tripId = Number(id);

  if (!context) return null;
  const { tripsList, locationsList, refreshData, userId, theme } = context;

  const trip = tripsList.find((t) => t.id === tripId);
  if (!trip) return null;

  const existingLocation = locationsList.find((l) => l.id === trip.locationId);

  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
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

  // Convert DD-MM-YYYY to YYYY-MM-DD for calendar
  const toCalendarDate = (displayDate: string) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY for storage
  const toDisplayDate = (calendarDate: string) => {
    const [year, month, day] = calendarDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a trip name.');
      return;
    }
    if (!startDate) {
      Alert.alert('Error', 'Please select a start date.');
      return;
    }
    if (!endDate) {
      Alert.alert('Error', 'Please select an end date.');
      return;
    }
    if (!selectedPlace) {
      Alert.alert('Error', 'Please search and select a location.');
      return;
    }

    try {
      let locationId = trip.locationId;

      // If location changed, create a new one
      if (!existingLocation || selectedPlace.name !== existingLocation.name) {
        const locationResult = await db.insert(locations).values({
          name: selectedPlace.name,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          userId: userId,
        }).returning();
        locationId = locationResult[0].id;
      }

      await db
        .update(trips)
        .set({
          name: name.trim(),
          startDate: startDate,
          endDate: endDate,
          locationId: locationId,
        })
        .where(eq(trips.id, tripId));

      await refreshData();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update trip. Please try again.');
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
        <Text style={styles.title}>Edit Trip</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.text }]}>Trip Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. Paris Weekend"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          onPress={() => {
            setShowStartCalendar(!showStartCalendar);
            setShowEndCalendar(false);
          }}
        >
          <Text style={startDate ? [styles.dateText, { color: theme.text }] : [styles.placeholderText, { color: theme.textMuted }]}>
            {startDate || 'Select start date'}
          </Text>
        </TouchableOpacity>

        {showStartCalendar && (
          <Calendar
            onDayPress={(day: any) => {
              setStartDate(toDisplayDate(day.dateString));
              setShowStartCalendar(false);
              if (endDate) {
                const endCalendar = toCalendarDate(endDate);
                if (endCalendar < day.dateString) {
                  setEndDate('');
                }
              }
            }}
            markedDates={
              startDate
                ? { [toCalendarDate(startDate)]: { selected: true, selectedColor: theme.primary } }
                : {}
            }
            theme={{
              todayTextColor: theme.primary,
              arrowColor: theme.primary,
              calendarBackground: theme.card,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
            }}
            style={[styles.calendar, { backgroundColor: theme.card }]}
          />
        )}

        <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          onPress={() => {
            if (!startDate) {
              Alert.alert('Error', 'Please select a start date first.');
              return;
            }
            setShowEndCalendar(!showEndCalendar);
            setShowStartCalendar(false);
          }}
        >
          <Text style={endDate ? [styles.dateText, { color: theme.text }] : [styles.placeholderText, { color: theme.textMuted }]}>
            {endDate || 'Select end date'}
          </Text>
        </TouchableOpacity>

        {showEndCalendar && (
          <Calendar
            onDayPress={(day: any) => {
              const startCalendar = toCalendarDate(startDate);
              if (day.dateString < startCalendar) {
                Alert.alert('Error', 'End date must be after start date.');
                return;
              }
              setEndDate(toDisplayDate(day.dateString));
              setShowEndCalendar(false);
            }}
            minDate={toCalendarDate(startDate)}
            markedDates={
              endDate
                ? { [toCalendarDate(endDate)]: { selected: true, selectedColor: theme.primary } }
                : {}
            }
            theme={{
              todayTextColor: theme.primary,
              arrowColor: theme.primary,
              calendarBackground: theme.card,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
            }}
            style={[styles.calendar, { backgroundColor: theme.card }]}
          />
        )}

        <Text style={[styles.label, { color: theme.text }]}>Location</Text>
        <GooglePlacesAutocomplete
          ref={placesRef}
          placeholder="Search for a city..."
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
            types: '(cities)',
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
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  calendar: {
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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