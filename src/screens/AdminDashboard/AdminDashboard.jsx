import React, { useState } from 'react';
import { View, Text, TouchableHighlight, StyleSheet, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Logout from '../Logout';

const AdminDashboard = () => {
  
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false); // State to track if menu is active

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuActive(!menuActive); // Toggle menu active state
  };

  const handleAvailabilityReport = () => {
    navigation.navigate("Availability");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar with Hamburger Menu */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableHighlight onPress={toggleMenu} underlayColor="#fdcc0d">
          <MaterialIcons
            name="menu"
            size={28}
            color={menuActive ? "#fdcc0d" : "#08422d"} // Change icon color based on menu state
            style={styles.menuIcon} // Add the style here
          />
        </TouchableHighlight>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menu}>
            {/* Dashboard Menu Item with Icon */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate('Dashboard')}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="dashboard" size={24} color="#08422d" />
                <Text style={styles.menuText}>Dashboard</Text>
              </View>
            </TouchableHighlight>

            {/* Manage User Requests Menu Item with Icon */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate('UserRequests')}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="group" size={24} color="#08422d" />
                <Text style={styles.menuText}>Manage User Requests</Text>
              </View>
            </TouchableHighlight>

            {/* User Account Management Menu Item with Icon */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate('UserAccounts')}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="account-circle" size={24} color="#08422d" />
                <Text style={styles.menuText}>User Account Management</Text>
              </View>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate('DepaertmentList')}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="account-circle" size={24} color="#08422d" />
                <Text style={styles.menuText}>Department List</Text>
              </View>
            </TouchableHighlight>

            {/* Close Menu Item with Icon */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={toggleMenu}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={styles.menuText}>Close Menu</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <Text style={styles.sectionText}>Total Users: 100</Text>
        <Text style={styles.sectionText}>Recent Activities: Last login times, recent updates...</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reports</Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() => navigation.navigate('AttendanceReports')}
          underlayColor="#fdcc0d"
        >
          <Text style={styles.buttonText}>View Attendance Reports</Text>
        </TouchableHighlight>
        <View style={styles.buttonSpacing} />
        <TouchableHighlight
          style={styles.button}
          onPress={handleAvailabilityReport}
          underlayColor="#fdcc0d"
        >
          <Text style={styles.buttonText}>View Location Tracking</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timetable Management</Text>
        <Text style={styles.sectionText}>Manage uploaded timetables...</Text>
      </View>
      <View style={{ marginHorizontal: 16 }}>
        <Logout />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Vertically center the items
    justifyContent: 'space-between', // Pushes the title to the left and the menu icon to the right
    padding: 15,
    elevation: 2,
    paddingTop: 25,
  },
  title: {
    color: "#08422d",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left", // Align the title text to the left
  },
  menuIcon: {
    marginLeft: 'auto', // Ensures the menu icon is aligned to the right
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 16, // Add horizontal margin
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'flex-start',
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    color: '#08422d',
    marginLeft: 10, // Add margin to space out the icon and text
  },
});

export default AdminDashboard;