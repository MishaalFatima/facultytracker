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
      {/* Header Section */}
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

      {/* Hamburger Menu Modal */}
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
              onPress={() => navigation.navigate("AllUsers")}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="people" size={24} color="#08422d" />
                <Text style={styles.menuText}>View Users Profile</Text>
              </View>
            </TouchableHighlight>

            {/* Attendance Reports: Show all faculty (both permanent and visiting) */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() =>
                navigation.navigate("FacultyList", { facultyType: "both" })
              }
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="list" size={24} color="#08422d" />
                <Text style={styles.menuText}>Attendance Reports</Text>
              </View>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate("ProfileScreen")}
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
                <Text style={styles.menuText}>Close</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Faculty Availability Section (Permanent Only) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faculty Availability</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("FacultyList", { facultyType: "Permanent" })
          }
        >
          <Ionicons name="eye" size={20} color="white" />
          <Text style={styles.buttonText}>View Real-Time Availability</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Report Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Report</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("DailyAttendaceReport")}
        >
          <Ionicons name="document-text" size={20} color="white" />
          <Text style={styles.buttonText}>Daily Report</Text>
        </TouchableOpacity>
      </View>

      {/* Timetable Section */}
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
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menu: {
    width: "85%",
    backgroundColor: "#ffffff",
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
});

export default PrincipalDashboardScreen;
