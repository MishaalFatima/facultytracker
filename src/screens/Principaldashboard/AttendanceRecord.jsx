import React, { useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { DataTable } from "react-native-paper";

const AttendanceRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Expect a uid parameter for the selected faculty.
  const { uid } = route.params || {};

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      console.error("No faculty ID provided.");
      setLoading(false);
      return;
    }
    const fetchAttendance = async () => {
      try {
        const q = query(
          collection(firestore, "attendance"),
          where("facultyId", "==", uid)
        );
        const querySnapshot = await getDocs(q);
        const attendanceData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendance(attendanceData);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If no uid is provided, offer a link back to the FacultyList screen.
  if (!uid) {
    return (
      <View style={styles.center}>
        <Text>No faculty selected.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("FacultyList")}>
          <Text style={styles.link}>Go to Faculty List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Course</DataTable.Title>
          <DataTable.Title>Day</DataTable.Title>
          <DataTable.Title>Start Time</DataTable.Title>
          <DataTable.Title>End Time</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>
        {attendance.length > 0 ? (
          attendance.map((record) => (
            <DataTable.Row key={record.id}>
              <DataTable.Cell>{record.course}</DataTable.Cell>
              <DataTable.Cell>{record.day}</DataTable.Cell>
              <DataTable.Cell>{record.startTime}</DataTable.Cell>
              <DataTable.Cell>{record.endTime}</DataTable.Cell>
              <DataTable.Cell>{record.status}</DataTable.Cell>
            </DataTable.Row>
          ))
        ) : (
          <DataTable.Row>
            <DataTable.Cell>No attendance records found</DataTable.Cell>
          </DataTable.Row>
        )}
      </DataTable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    marginTop: 10,
    color: "blue",
    textDecorationLine: "underline",
  },
});

export default AttendanceRecord;
