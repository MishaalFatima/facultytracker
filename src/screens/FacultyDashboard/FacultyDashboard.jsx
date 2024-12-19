import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import Logout from "../Logout";
import ProfileSectionFD from "./profileSectionFD";
import MapSectionFD from "./mapSectionFD";
import EnableGPSButtonFD from "./enableGPSbuttonDF";
import ViewAttendanceButtonFD from "./viewAttendanceButtonFD";
import ProfileUodateButtonFD from "./ProfileUpdateButtonFD";

const FacultyDashboard = () => {
  return (
    <ScrollView style={styles.container}>
      <Logout />
      <ProfileSectionFD />
      <MapSectionFD />
      <EnableGPSButtonFD />
      <ViewAttendanceButtonFD />
      <ProfileUodateButtonFD />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
});

export default FacultyDashboard;
