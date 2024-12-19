import React from "react";
import { View, Button, StyleSheet } from "react-native";

const ViewAttendanceButtonFD = () => {
  const handleViewAttendance = () => {
    alert("Redirecting to attendance view...");
  };

  return (
    <View style={styles.attendanceContainer}>
      <Button title="View Attendance" color="#08422d" onPress={handleViewAttendance} />
    </View>
  );
};

const styles = StyleSheet.create({
  attendanceContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderColor: "#08422d",
    borderWidth: 1,
  },
});

export default ViewAttendanceButtonFD;
