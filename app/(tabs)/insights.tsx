import { StyleSheet, Text, View } from 'react-native';

export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📊</Text>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Charts and summaries coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
});