import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableHighlight,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import Logout from "../Logout";

const PrincipalDashboardScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuActive(!menuActive);
  };

  // Reset the menu state every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
      setMenuActive(false);
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Principal Dashboard</Text>
        <TouchableHighlight onPress={toggleMenu} underlayColor="#fdcc0d">
          <MaterialIcons
            name="menu"
            size={28}
            color={menuActive ? "#fdcc0d" : "#08422d"}
            style={styles.menuIcon}
          />
        </TouchableHighlight>
      </View>

      {/* Dashboard Sections */}
      {/* 1. Attendance Record */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Record</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
                navigation.navigate("FacultyList", { facultyType: "both" })
              }
        >
          <MaterialIcons name="history" size={20} color="white" />
          <Text style={styles.buttonText}>View Records</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Faculty Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faculty Availability</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("FacultyList", { facultyType: "Permanent" })
          }
        >
          <Ionicons name="eye" size={20} color="white" />
          <Text style={styles.buttonText}>Real-Time Availability</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Timetable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timetable</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Timetable")}
        >
          <MaterialIcons name="schedule" size={20} color="white" />
          <Text style={styles.buttonText}>View Timetable</Text>
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={toggleMenu}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menu}>
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("AllUsers");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="people" size={24} color="#08422d" />
                <Text style={styles.menuText}>View Users Profile</Text>
              </View>
            </TouchableHighlight>

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

            <Logout variant="menu" />

            <TouchableHighlight
              style={styles.menuItem}
              onPress={toggleMenu}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={styles.menuText}>Close Menu</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#08422d",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#08422d",
    marginBottom: 15,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08422d",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 18,
    marginLeft: 12,
    color: "#08422d",
  },
});

export default PrincipalDashboardScreen;
