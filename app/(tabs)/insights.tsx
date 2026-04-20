import { useContext, useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { AppContext } from '../_layout';

// Claude - "Help me come up with interesting insights and stats, this is what I already have: Total trips, # of upcoming trips, activity breakdown and activity completion %"

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
  const context = useContext(AppContext);

  if (!context) return null;

  const { tripsList, activitiesList, categoriesList, theme } = context;

  // basic stats
  const totalTrips = tripsList.length;
  const totalActivities = activitiesList.length;
  const completedActivities = activitiesList.filter((a) => a.completed === 1).length;
  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Parse DD-MM-YYYY to Date
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}`);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upcoming trips
  const upcomingTrips = tripsList.filter((t) => parseDate(t.startDate) > today).length;

  // Past trips
  const pastTrips = tripsList.filter((t) => parseDate(t.endDate) < today).length;

  // Current trips
  const currentTrips = tripsList.filter((t) => parseDate(t.startDate) <= today && parseDate(t.endDate) >= today).length;

  // Total hours planned
  const totalHours = activitiesList.reduce((sum, a) => sum + a.duration, 0);

  // Average activities per trip
  const avgActivitiesPerTrip = totalTrips > 0 ? (totalActivities / totalTrips).toFixed(1) : '0';

  // Streak calculation
  const tripStreak = useMemo(() => {
    if (tripsList.length === 0 || activitiesList.length === 0) return 0;

    // Get all trips sorted by start date
    const sortedTrips = [...tripsList].sort((a, b) => {
      return parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime();
    });

    // Build a list of all trip days in order
    const allDays: { tripId: number; dayNumber: number; allCompleted: boolean }[] = [];

    sortedTrips.forEach((trip) => {
      const [startDay, startMonth, startYear] = trip.startDate.split('-');
      const [endDay, endMonth, endYear] = trip.endDate.split('-');
      const start = new Date(`${startYear}-${startMonth}-${startDay}`);
      const end = new Date(`${endYear}-${endMonth}-${endDay}`);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      for (let d = 1; d <= totalDays; d++) {
        const dayActivities = activitiesList.filter(
          (a) => a.tripId === trip.id && a.dayNumber === d
        );

        // Only count days that have activities
        if (dayActivities.length > 0) {
          const allCompleted = dayActivities.every((a) => a.completed === 1);
          allDays.push({ tripId: trip.id, dayNumber: d, allCompleted });
        }
      }
    });

    // Calculate streak from the end 
    let streak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].allCompleted) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [tripsList, activitiesList]);

  // Highest streak
  const bestStreak = useMemo(() => {
    if (tripsList.length === 0 || activitiesList.length === 0) return 0;

    const sortedTrips = [...tripsList].sort((a, b) => {
      return parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime();
    });

    const allDays: boolean[] = [];

    sortedTrips.forEach((trip) => {
      const [startDay, startMonth, startYear] = trip.startDate.split('-');
      const [endDay, endMonth, endYear] = trip.endDate.split('-');
      const start = new Date(`${startYear}-${startMonth}-${startDay}`);
      const end = new Date(`${endYear}-${endMonth}-${endDay}`);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      for (let d = 1; d <= totalDays; d++) {
        const dayActivities = activitiesList.filter(
          (a) => a.tripId === trip.id && a.dayNumber === d
        );
        if (dayActivities.length > 0) {
          allDays.push(dayActivities.every((a) => a.completed === 1));
        }
      }
    });

    let best = 0;
    let current = 0;
    allDays.forEach((completed) => {
      if (completed) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

    return best;
  }, [tripsList, activitiesList]);

  // Past trip completion rate
  const pastTripCompletion = useMemo(() => {
    const past = tripsList.filter((t) => parseDate(t.endDate) < today);
    if (past.length === 0) return 0;

    const pastActivities = activitiesList.filter((a) =>
      past.some((t) => t.id === a.tripId)
    );

    if (pastActivities.length === 0) return 0;

    const completed = pastActivities.filter((a) => a.completed === 1).length;
    return Math.round((completed / pastActivities.length) * 100);
  }, [tripsList, activitiesList]);

  // activity category pie chart
  const categoryData = useMemo(() => {
    return categoriesList
      .map((cat) => {
        const count = activitiesList.filter((a) => a.categoryId === cat.id).length;
        return {
          name: cat.name,
          count: count,
          color: cat.colour,
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        };
      })
      .filter((c) => c.count > 0);
  }, [activitiesList, categoriesList, theme]);

  // Activities per trip bar chart
  const barChartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];

    tripsList.slice(0, 6).forEach((trip) => {
      const label = trip.name.length > 8 ? trip.name.substring(0, 8) + '...' : trip.name;
      labels.push(label);
      data.push(activitiesList.filter((a) => a.tripId === trip.id).length);
    });

    return { labels, datasets: [{ data: data.length > 0 ? data : [0] }] };
  }, [tripsList, activitiesList]);

  // Most active trip
  const mostActiveTrip = useMemo(() => {
    if (tripsList.length === 0) return null;

    let maxCount = 0;
    let maxTrip = tripsList[0];

    tripsList.forEach((trip) => {
      const count = activitiesList.filter((a) => a.tripId === trip.id).length;
      if (count > maxCount) {
        maxCount = count;
        maxTrip = trip;
      }
    });

    return { name: maxTrip.name, count: maxCount };
  }, [tripsList, activitiesList]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statEmoji}></Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{totalTrips}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Trips</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statEmoji}></Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{totalActivities}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Activities</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statEmoji}></Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{upcomingTrips}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statEmoji}></Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{totalHours}h</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Planned</Text>
          </View>
        </View>

        {/* Streak Section */}
        <View style={[styles.streakCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Trip Day Streak</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: '#E67E22' }]}>{tripStreak}</Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Current Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: '#27AE60' }]}>{bestStreak}</Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Best Streak</Text>
            </View>
          </View>
          <Text style={[styles.streakHint, { color: theme.textMuted }]}>
            Complete all activities in a trip day to build your streak!
          </Text>
        </View>

        {/* Completion Rate */}
        <View style={[styles.completionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Completion Rate</Text>
          <View style={styles.completionRow}>
            <View style={styles.completionItem}>
              <Text style={[styles.completionPercent, { color: theme.primary }]}>{completionRate}%</Text>
              <Text style={[styles.completionLabel, { color: theme.textSecondary }]}>Overall</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={[styles.completionPercent, { color: '#27AE60' }]}>{pastTripCompletion}%</Text>
              <Text style={[styles.completionLabel, { color: theme.textSecondary }]}>Past Trips</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={[styles.completionPercent, { color: '#8E44AD' }]}>{avgActivitiesPerTrip}</Text>
              <Text style={[styles.completionLabel, { color: theme.textSecondary }]}>Avg/Trip</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={[styles.completionBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.completionFill,
                { width: `${completionRate}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
          <Text style={[styles.completionText, { color: theme.textMuted }]}>
            {completedActivities} of {totalActivities} activities completed
          </Text>
        </View>

        {/* Category Breakdown Pie Chart */}
        {categoryData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Categories</Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                color: () => theme.text,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Activities Per Trip Bar Chart */}
        {tripsList.length > 0 && barChartData.datasets[0].data.some((d) => d > 0) && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Activities Per Trip</Text>
            <BarChart
              data={barChartData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: () => theme.primary,
                labelColor: () => theme.textSecondary,
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        {/* Quick Facts */}
        <View style={[styles.factsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Facts</Text>

          <View style={styles.factRow}>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>Current Trips</Text>
            <Text style={[styles.factValue, { color: theme.text }]}>{currentTrips}</Text>
          </View>
          <View style={[styles.factDivider, { backgroundColor: theme.border }]} />

          <View style={styles.factRow}>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>Past Trips</Text>
            <Text style={[styles.factValue, { color: theme.text }]}>{pastTrips}</Text>
          </View>
          <View style={[styles.factDivider, { backgroundColor: theme.border }]} />

          {mostActiveTrip && (
            <>
              <View style={styles.factRow}>
                <Text style={[styles.factLabel, { color: theme.textSecondary }]}>Most Active Trip</Text>
                <Text style={[styles.factValue, { color: theme.text }]}>
                  {mostActiveTrip.name} ({mostActiveTrip.count})
                </Text>
              </View>
              <View style={[styles.factDivider, { backgroundColor: theme.border }]} />
            </>
          )}

          <View style={styles.factRow}>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>Categories Used</Text>
            <Text style={[styles.factValue, { color: theme.text }]}>{categoryData.length}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  streakCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#ddd',
  },
  streakHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  completionItem: {
    alignItems: 'center',
  },
  completionPercent: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  completionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  completionBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  completionFill: {
    height: '100%',
    borderRadius: 5,
  },
  completionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    alignItems: 'center',
  },
  factsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  factLabel: {
    fontSize: 14,
  },
  factValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  factDivider: {
    height: 1,
  },
});