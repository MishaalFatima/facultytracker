import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AttendanceRecordVF = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Fetch stored attendance data from AsyncStorage
        const storedData = await AsyncStorage.getItem("AttendanceRecord");
        if (storedData) {
          setAttendanceData(JSON.parse(storedData));
        } else {
          setAttendanceData([]); // No data found
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Record</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#08422d" />
      ) : attendanceData.length > 0 ? (
        <FlatList
          data={attendanceData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.recordItem}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.statusText}>
                {item.status === "Present" ? "✅ Present" : "❌ Absent"}
              </Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No attendance records available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    elevation: 3,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 10,
    textAlign: "center",
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dateText: {
    fontSize: 16,
    color: "#08422d",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 10,
  },
});

export default AttendanceRecordVF;
