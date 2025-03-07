import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  Text,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Logout from "../Logout";
import ProfileSectionFD from "./profileSectionFD";
import MapSectionFD from "./mapSectionFD";
import EnableGPSButtonFD from "./enableGPSbuttonDF";
import { useFocusEffect } from "@react-navigation/native";

const FacultyDashboard = ({ navigation }) => {
 
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
    <View style={styles.container}>
      {/* Top Bar with Hamburger Menu */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Faculty Dashboard</Text>
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
            {/* Moving the buttons inside the menu with icons */}
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => navigation.navigate("FacultyTimetable")}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="assignment" size={24} color="#08422d" />
                <Text style={styles.menuText}>Mark Attendance</Text>
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

      {/* Main Content */}
      <ScrollView style={styles.scrollContainer}>
        {/* Profile and Map Sections */}
        <ProfileSectionFD />
        <MapSectionFD />
        <EnableGPSButtonFD />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topBar: {
    flexDirection: "row", // Ensures items are placed in a row
    alignItems: "center",
    justifyContent: "space-between", // Moves title left, menu right
    padding: 15,
    elevation: 2,
    paddingTop: 25,
  },
  menuButton: {
    padding: 5,
  },
  title: {
    color: "#08422d",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
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
});

export default FacultyDashboard;