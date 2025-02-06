import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import Logout from "../Logout"; 

const CRGRDashboardScreen = ({ navigation }) => {

  const handleUploadTimetable = () => {
    navigation.navigate('TimetableForm');
  };

  const handleReloadTimetable = () => {
    console.log("Reload timetable clicked");
  };

  const handleCaptureAttendance = () => {
    navigation.navigate('QRScannerScreen')
  
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CR/GR Dashboard</Text>
      {/* Logout Button */}
      <Logout />

      {/* <FaceRecognition  /> */}

      {/* Timetable Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Timetable</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessible={true}
            style={styles.button}
            onPress={handleUploadTimetable}
          >
            <MaterialIcons name="file-upload" size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Upload Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessible={true}
            style={styles.buttonSecondary}
            onPress={handleReloadTimetable}
          >
            <FontAwesome name="refresh" size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Reload Timetable</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendance Submission Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Tracking</Text>
        <TouchableOpacity
          accessible={true}
          style={styles.singleButton}
          onPress={handleCaptureAttendance}
        >
          <MaterialIcons name="camera-alt" size={20} color="white" style={styles.icon} />
          <Text style={styles.buttonText}>Capture Attendance Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Management</Text>
        <TouchableOpacity
          accessible={true}
          style={styles.singleButton}
          onPress={handleUpdateProfile}
        >
          <FontAwesome name="edit" size={20} color="white" style={styles.icon} />
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 30,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f", // Red color for logout
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 20,
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08422d",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  buttonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a573c",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
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
});

export default CRGRDashboardScreen;
