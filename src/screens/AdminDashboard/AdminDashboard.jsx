// AdminDashboard.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Logout from "../Logout";
import { useFocusEffect } from "@react-navigation/native";
import { firestore } from "../firebaseConfig";
import { collection, getCountFromServer } from "firebase/firestore";

const AdminDashboard = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuActive(!menuActive);
  };

  // Reset menu whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
      setMenuActive(false);
    }, [])
  );

  // Fetch counts when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        try {
          // Approved users
          const usersRef = collection(firestore, "users");
          const usersSnap = await getCountFromServer(usersRef);
          setTotalUsers(usersSnap.data().count);

          // Pending sign-up requests
          const pendingRef = collection(firestore, "pendingRequests");
          const pendingSnap = await getCountFromServer(pendingRef);
          setPendingCount(pendingSnap.data().count);
        } catch (error) {
          console.error("Error fetching counts:", error);
          setTotalUsers(0);
          setPendingCount(0);
        }
      };

      fetchCounts();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableHighlight onPress={toggleMenu} underlayColor="#fdcc0d">
          <MaterialIcons
            name="menu"
            size={28}
            color={menuActive ? "#fdcc0d" : "#08422d"}
            style={styles.menuIcon}
          />
        </TouchableHighlight>
      </View>

      {/* Hamburger Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menu}>
            {/* User Management */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("AllUsers");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="account-circle" size={24} color="#08422d" />
                <Text style={styles.menuText}>User Account Management</Text>
              </View>
            </TouchableHighlight>

            {/* Department List */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("DepaertmentList");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="domain" size={24} color="#08422d" />
                <Text style={styles.menuText}>Department List</Text>
              </View>
            </TouchableHighlight>

            {/* Room List */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("RoomList");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="meeting-room" size={24} color="#08422d" />
                <Text style={styles.menuText}>Room List</Text>
              </View>
            </TouchableHighlight>

            {/* Pending Requests */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("PendingRequests");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="hourglass-empty" size={24} color="#08422d" />
                <Text style={styles.menuText}>
                  Pending Requests ({pendingCount})
                </Text>
              </View>
            </TouchableHighlight>

            {/* View Profile */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("ProfileScreen");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="person" size={24} color="#08422d" />
                <Text style={styles.menuText}>View Profile</Text>
              </View>
            </TouchableHighlight>

            {/* Logout */}
            <Logout variant="menu" />

            {/* Close */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={toggleMenu}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={styles.menuText}>Close</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Dashboard Overview */}
      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <Text style={styles.sectionText}>Total Users: {totalUsers}</Text>
        <Text style={styles.sectionText}>
          Pending Requests: {pendingCount}
        </Text>
      </View>

      {/* Reports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reports</Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() =>
            navigation.navigate("FacultyList", { facultyType: "both" })
          }
          underlayColor="#fdcc0d"
        >
          <Text style={styles.buttonText}>View Attendance Reports</Text>
        </TouchableHighlight>
        <View style={styles.buttonSpacing} />
        <TouchableHighlight
          style={styles.button}
          onPress={() =>
            navigation.navigate("FacultyList", { facultyType: "Permanent" })
          }
          underlayColor="#fdcc0d"
        >
          <Text style={styles.buttonText}>View Location Tracking</Text>
        </TouchableHighlight>
      </View>

      {/* Timetable Management */}
      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate("Timetable")}
      >
        <Text style={styles.sectionTitle}>Timetable Management</Text>
        <Text style={styles.sectionText}>Manage uploaded timetables...</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    paddingTop: 25,
    elevation: 2,
  },
  title: { color: "#08422d", fontSize: 24, fontWeight: "bold" },
  menuIcon: { marginLeft: "auto" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "flex-start",
  },
  menuItem: { flexDirection: "row", paddingVertical: 12, width: "100%" },
  menuItemContent: { flexDirection: "row", alignItems: "center" },
  menuText: { fontSize: 18, color: "#08422d", marginLeft: 10 },

  firstSection: { marginTop: 16 },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    borderColor: "#08422d",
    borderWidth: 1,
    elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#08422d" },
  sectionText: { fontSize: 16, color: "#08422d", marginTop: 8 },

  button: {
    backgroundColor: "#08422d",
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  buttonSpacing: { marginTop: 10 },
});

export default AdminDashboard;
