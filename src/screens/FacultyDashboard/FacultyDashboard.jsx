import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text, Modal } from "react-native";
import Logout from "../Logout";
import ProfileSectionFD from "./profileSectionFD";
import MapSectionFD from "./mapSectionFD";
import EnableGPSButtonFD from "./enableGPSbuttonDF";
import ViewAttendanceButtonFD from "./viewAttendanceButtonFD";
import ProfileUodateButtonFD from "./ProfileUpdateButtonFD";

const FacultyDashboard = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Logout />
        <ProfileSectionFD />
        <MapSectionFD />
        <EnableGPSButtonFD />
        <ViewAttendanceButtonFD />
        <ProfileUodateButtonFD />
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
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f4f4f4",
    elevation: 4,
  },
  menuButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
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
    width: 200,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  menuText: {
    fontSize: 16,
  },
});

export default FacultyDashboard;
