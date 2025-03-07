import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableHighlight,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Logout from "../Logout";
import { useFocusEffect } from "@react-navigation/native";

const CRGRDashboardScreen = ({ navigation }) => {
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

  const handleCaptureAttendance = () => {
    navigation.navigate("QRScannerScreen");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CR/GR Dashboard</Text>
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
            {/* Menu options */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate("TimetableForm")}
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="file-upload" size={24} color="#08422d" />
                <Text style={styles.menuText}>Upload Timetable</Text>
              </View>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.menuItem}
              onPress={() =>
                navigation.navigate("Request for Update Timetable")
              }
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="update" size={24} color="#08422d" />
                <Text style={styles.menuText}>
                  Request for Update Timetable
                </Text>
              </View>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate("ProfileScreen")}
              underlayColor="#fdcc0d" // Yellow highlight on press
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
              underlayColor="#fdcc0d" // Set yellow color on press
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={styles.menuText}>Close</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row", // Align items horizontally
    alignItems: "center", // Vertically center the items
    justifyContent: "space-between", // Pushes the title to the left and the menu icon to the right
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
  topBar: {
    flexDirection: "row", // Ensures items are placed in a row
    //alignItems: "center",
    justifyContent: "space-between", // Moves title left, menu right
    padding: 15,
    elevation: 2, // Adds shadow effect
    backgroundColor: "#fff", // Makes sure the shadow effect is clear
    width: "100%", // Ensures the top bar spans the full width of the screen
    marginBottom: 15, // Adds spacing below the top bar
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
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
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 18,
    color: "#08422d",
    marginLeft: 10,
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#08422d",
    marginBottom: 18,
    textAlign: "center",
  },
  singleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08422d",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
});

export default CRGRDashboardScreen;