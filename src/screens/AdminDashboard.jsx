import React from 'react';
import { View, Text, TouchableHighlight, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import Logout from './Logout';

const AdminDashboard = () => {
  
  const navigation = useNavigation();

  const handleAvailabilityReport = () => {
    navigation.navigate("Availability");
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Logout/>
      </View>

      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <Text style={styles.sectionText}>Total Users: 100</Text>
        <Text style={styles.sectionText}>Recent Activities: Last login times, recent updates...</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() => navigation.navigate('UserRequests')}
          underlayColor="#fdcc0d" // Change color on press
        >
          <Text style={styles.buttonText}>Manage User Requests</Text>
        </TouchableHighlight>
        <View style={styles.buttonSpacing} />
        <TouchableHighlight
          style={styles.button}
          onPress={() => navigation.navigate('UserAccounts')}
          underlayColor="#fdcc0d" // Change color on press
        >
          <Text style={styles.buttonText}>User Account Management</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reports</Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() => navigation.navigate('AttendanceReports')}
          underlayColor="#fdcc0d" // Change color on press
        >
          <Text style={styles.buttonText}>View Attendance Reports</Text>
        </TouchableHighlight>
        <View style={styles.buttonSpacing} />
        <TouchableHighlight
          style={styles.button}
          onPress={handleAvailabilityReport}
          underlayColor="#fdcc0d" // Change color on press
        >
          <Text style={styles.buttonText}>View Location Tracking</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timetable Management</Text>
        <Text style={styles.sectionText}>Manage uploaded timetables...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: 'white',
  },
  header: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#08422d',
  },
  logoutButton: {
    backgroundColor: '#dc2e20', // Set background color for the logout button
    padding: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderColor: '#08422d',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  firstSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#08422d',
  },
  sectionText: {
    color: '#08422d',
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#08422d',
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});

export default AdminDashboard;