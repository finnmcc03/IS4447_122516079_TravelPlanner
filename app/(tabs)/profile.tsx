import { eq } from 'drizzle-orm';
import { useContext, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { AppContext } from '../_layout';

export default function ProfileScreen() {
  const context = useContext(AppContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [userDetails, setUserDetails] = useState<{
    username: string;
    email: string;
  } | null>(null);

  if (!context) return null;
  const { userId, tripsList, activitiesList, categoriesList, locationsList, logout } = context;

  // Load user details
  const loadUserDetails = async () => {
    const result = await db.select().from(users).where(eq(users.id, userId));
    if (result.length > 0) {
      const user = result[0];
      setUserDetails({ username: user.username, email: user.email });
      setEditUsername(user.username);
      setEditEmail(user.email);
      setEditPassword('');
    }
  };

  // Load on first render
  if (!userDetails) {
    loadUserDetails();
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    if (!editEmail.trim()) {
      Alert.alert('Error', 'Email cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      const updateData: any = {
        username: editUsername.trim(),
        email: editEmail.trim().toLowerCase(),
      };

      if (editPassword.trim()) {
        if (editPassword.length < 4) {
          Alert.alert('Error', 'Password must be at least 4 characters.');
          return;
        }
        updateData.password = editPassword;
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));

      setUserDetails({ username: editUsername.trim(), email: editEmail.trim().toLowerCase() });
      setShowEditProfile(false);
      setEditPassword('');
      Alert.alert('Success', 'Profile updated.');
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) {
        Alert.alert('Error', 'Username or email already taken.');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    }
  };

  // Delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all user data
              const { activities, targets, trips, locations, categories } = require('../../db/schema');
              await db.delete(activities).where(eq(activities.userId, userId));
              await db.delete(targets).where(eq(targets.userId, userId));
              await db.delete(trips).where(eq(trips.userId, userId));
              await db.delete(locations).where(eq(locations.userId, userId));
              await db.delete(categories).where(eq(categories.userId, userId));
              await db.delete(users).where(eq(users.id, userId));
              logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Export data as CSV
  const handleExportCSV = async () => {
    try {
      let csv = 'Trip,Activity,Day,Duration (hours),Category,Location,Completed,Notes\n';

      activitiesList.forEach((activity) => {
        const trip = tripsList.find((t) => t.id === activity.tripId);
        const category = categoriesList.find((c) => c.id === activity.categoryId);
        const location = activity.locationId
          ? locationsList.find((l) => l.id === activity.locationId)
          : null;

        const tripName = trip ? trip.name.replace(/,/g, ';') : 'Unknown';
        const activityName = activity.name.replace(/,/g, ';');
        const categoryName = category ? category.name : 'Unknown';
        const locationName = location ? location.name.replace(/,/g, ';') : '';
        const completed = activity.completed === 1 ? 'Yes' : 'No';
        const notes = (activity.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');

        csv += `${tripName},${activityName},Day ${activity.dayNumber},${activity.duration},${categoryName},${locationName},${completed},${notes}\n`;
      });

      await Share.share({
        message: csv,
        title: 'Travel Planner Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
      console.error(error);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

          {!showEditProfile ? (
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => setShowEditProfile(true)}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {userDetails?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userDetails?.username || 'Loading...'}</Text>
                <Text style={styles.profileEmail}>{userDetails?.email || ''}</Text>
              </View>
              <Text style={styles.profileArrow}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editCard}>
              <Text style={styles.editLabel}>Username</Text>
              <TextInput
                style={styles.editInput}
                value={editUsername}
                onChangeText={setEditUsername}
                autoCapitalize="none"
              />

              <Text style={styles.editLabel}>Email</Text>
              <TextInput
                style={styles.editInput}
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.editLabel}>New Password (leave blank to keep current)</Text>
              <TextInput
                style={styles.editInput}
                value={editPassword}
                onChangeText={setEditPassword}
                secureTextEntry
                placeholder="Enter new password"
              />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowEditProfile(false);
                    loadUserDetails();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>Get reminders before activities</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ddd', true: '#2980B9' }}
              thumbColor={notificationsEnabled ? '#fff' : '#fff'}
            />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch to dark theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#ddd', true: '#2980B9' }}
              thumbColor={darkModeEnabled ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
            <Text style={styles.actionIcon}>📄</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Export Data (CSV)</Text>
              <Text style={styles.actionDescription}>
                Download all your trips and activities
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 15,
    backgroundColor: '#2980B9',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2980B9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  profileEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  profileArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  editCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 12,
  },
  editInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2980B9',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  actionDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  logoutText: {
    color: '#2980B9',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDEDEC',
  },
  deleteAccountText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
});