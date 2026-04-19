import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../db/client';
import { activities } from '../../db/schema';
import { AppContext } from '../_layout';

export default function TripDetailScreen() {
  const context = useContext(AppContext);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const tripId = Number(id);

  if (!context) return null;

  const { tripsList, activitiesList, categoriesList, locationsList, refreshData, theme } = context;

  const trip = tripsList.find((t) => t.id === tripId);
  if (!trip) return null;

  // Get trip activities
  const tripActivities = activitiesList.filter((a) => a.tripId === tripId);

  // Calculate number of days in the trip
  const [startDay, startMonth, startYear] = trip.startDate.split('-');
  const [endDay, endMonth, endYear] = trip.endDate.split('-');
  const start = new Date(`${startYear}-${startMonth}-${startDay}`);
  const end = new Date(`${endYear}-${endMonth}-${endDay}`);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Get location name
  const location = locationsList.find((l) => l.id === trip.locationId);
  const locationName = location ? location.name : 'Unknown';

  // Get category info
  const getCategoryName = (categoryId: number) => {
    const cat = categoriesList.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const getCategoryColour = (categoryId: number) => {
    const cat = categoriesList.find((c) => c.id === categoryId);
    return cat ? cat.colour : '#999';
  };

  // Get activity location name
  const getActivityLocation = (locationId: number | null) => {
    if (!locationId) return null;
    const loc = locationsList.find((l) => l.id === locationId);
    return loc ? loc.name : null;
  };

  // Toggle activity completed
  const toggleCompleted = async (activityId: number, currentValue: number) => {
    await db
      .update(activities)
      .set({ completed: currentValue === 1 ? 0 : 1 })
      .where(eq(activities.id, activityId));
    await refreshData();
  };

  // Delete activity
  const handleDeleteActivity = (activityId: number) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(activities).where(eq(activities.id, activityId));
          await refreshData();
        },
      },
    ]);
  };

  // Group activities by day
  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const dayActivities = tripActivities.filter((a) => a.dayNumber === d);
    days.push({ dayNumber: d, activities: dayActivities });
  }

  // Calculate overall progress
  const completedCount = tripActivities.filter((a) => a.completed === 1).length;
  const totalCount = tripActivities.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{trip.name}</Text>
        <Text style={styles.subtitle}>{locationName}</Text>
        <Text style={styles.dates}>
          {trip.startDate} → {trip.endDate} · {totalDays} days
        </Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                  backgroundColor: completedCount === totalCount && totalCount > 0 ? '#27AE60' : '#fff',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} completed
          </Text>
        </View>
      </View>

      {/* Days and Activities */}
      <View style={styles.content}>
        {days.map((day) => (
          <View key={day.dayNumber} style={styles.daySection}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>Day {day.dayNumber}</Text>

            {day.activities.map((activity) => (
              <View key={activity.id} style={[styles.activityCard, { backgroundColor: theme.card }]}>
                <View style={styles.activityHeader}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: theme.border },
                      activity.completed === 1 && styles.checkboxChecked,
                    ]}
                    onPress={() => toggleCompleted(activity.id, activity.completed)}
                  >
                    {activity.completed === 1 && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>

                  <View style={styles.activityInfo}>
                    <Text
                      style={[
                        styles.activityName,
                        { color: theme.text },
                        activity.completed === 1 && { textDecorationLine: 'line-through', color: theme.textMuted },
                      ]}
                    >
                      {activity.name}
                    </Text>
                    <View style={styles.activityMeta}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColour(activity.categoryId) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            { color: getCategoryColour(activity.categoryId) },
                          ]}
                        >
                          {getCategoryName(activity.categoryId)}
                        </Text>
                      </View>
                      <Text style={[styles.duration, { color: theme.textSecondary }]}>{activity.duration}h</Text>
                    </View>
                    {getActivityLocation(activity.locationId) && (
                      <Text style={[styles.activityLocation, { color: theme.textMuted }]}>
                        {getActivityLocation(activity.locationId)}
                      </Text>
                    )}
                    {activity.notes ? (
                      <Text style={[styles.activityNotes, { color: theme.textMuted }]}>{activity.notes}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.activityActions}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: theme.primaryLight }]}
                    onPress={() =>
                      router.push(`/activity/edit/${activity.id}?tripId=${tripId}` as any)
                    }
                  >
                    <Text style={[styles.editText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteActivity(activity.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {day.activities.length === 0 && (
              <Text style={[styles.noActivities, { color: theme.textMuted }]}>No activities planned</Text>
            )}
          </View>
        ))}

        {/* Add Activity Card */}
        <TouchableOpacity
          style={[styles.addActivityCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push(`/activity/add?tripId=${tripId}` as any)}
        >
          <Text style={[styles.addActivityIcon, { color: theme.textMuted }]}>+</Text>
          <Text style={[styles.addActivityText, { color: theme.textMuted }]}>Add Activity</Text>
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
    paddingBottom: 20,
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
    marginBottom: 4,
  },
  subtitle: {
    color: '#D6EAF8',
    fontSize: 14,
    marginBottom: 4,
  },
  dates: {
    color: '#D6EAF8',
    fontSize: 13,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  activityNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  activityLocation: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  activityNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
  },
  editText: {
    color: '#2980B9',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#FDEDEC',
    borderRadius: 6,
  },
  deleteText: {
    color: '#E74C3C',
    fontWeight: '600',
    fontSize: 13,
  },
  noActivities: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 4,
    marginBottom: 8,
  },
  addActivityCard: {
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addActivityIcon: {
    fontSize: 28,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addActivityText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },
});