import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TripCardProps = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  locationName: string;
  totalActivities: number;
  completedActivities: number;
  onPress: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  theme?: any;
};

export default function TripCard({
  id,
  name,
  startDate,
  endDate,
  locationName,
  totalActivities,
  completedActivities,
  onPress,
  onEdit,
  onDelete,
  theme,
}: TripCardProps) {
  const progress = totalActivities > 0 ? completedActivities / totalActivities : 0;

  // Calculate number of days
  const [startDay, startMonth, startYear] = startDate.split('-');
  const [endDay, endMonth, endYear] = endDate.split('-');
  const start = new Date(`${startYear}-${startMonth}-${startDay}`);
  const end = new Date(`${endYear}-${endMonth}-${endDay}`);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme?.card || '#fff' }]} onPress={() => onPress(id)}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme?.text || '#333' }]}>{name}</Text>
        <Text style={[styles.days, { color: theme?.primary || '#2980B9', backgroundColor: theme?.primaryLight || '#EBF5FB' }]}>{days} days</Text>
      </View>

      <Text style={[styles.location, { color: theme?.textSecondary || '#666' }]}>{locationName}</Text>
      <Text style={[styles.dates, { color: theme?.textMuted || '#999' }]}>
        {startDate} → {endDate}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme?.border || '#EEE' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress === 1 ? '#27AE60' : theme?.primary || '#2980B9',
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme?.textSecondary || '#666' }]}>
          {completedActivities}/{totalActivities} activities
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme?.primaryLight || '#EBF5FB' }]} onPress={() => onEdit(id)}>
          <Text style={[styles.editText, { color: theme?.primary || '#2980B9' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/* Claude - "Design a simple front-end for a trip planner component" */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  days: {
    fontSize: 14,
    color: '#2980B9',
    fontWeight: '600',
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dates: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
  },
  editText: {
    color: '#2980B9',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FDEDEC',
    borderRadius: 6,
  },
  deleteText: {
    color: '#E74C3C',
    fontWeight: '600',
    fontSize: 14,
  },
});