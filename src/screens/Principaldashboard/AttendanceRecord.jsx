import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { DataTable, IconButton } from "react-native-paper";

const AttendanceRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { uid, deptValue } = route.params || {};  // <-- pull in deptValue

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!uid) {
      console.error("No faculty ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Base query: only this faculty
      let q = query(
        collection(firestore, "attendance"),
        where("facultyId", "==", uid)
      );

      // If a department is selected, add another where-clause
      if (deptValue) {
        q = query(
          collection(firestore, "attendance"),
          where("facultyId", "==", uid),
          where("departmentId", "==", deptValue)
        );
      }

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
  }, [uid, deptValue]);

  // Initial fetch + refetch on focus
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    if (isFocused) fetchAttendance();
  }, [isFocused, fetchAttendance]);

  const handleDelete = async (recordId) => {
    try {
      await deleteDoc(doc(firestore, "attendance", recordId));
      setAttendance((prev) =>
        prev.filter((record) => record.id !== recordId)
      );
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleUpdate = (record) => {
    navigation.navigate("UpdateAttendance", { record });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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
    <ScrollView horizontal>
      <View style={styles.container}>
        <ScrollView>
          <DataTable style={styles.table}>
            <DataTable.Header>
              <DataTable.Title style={styles.cell}>Course</DataTable.Title>
              <DataTable.Title style={styles.cell}>Day</DataTable.Title>
              <DataTable.Title style={styles.cell}>Start Time</DataTable.Title>
              <DataTable.Title style={styles.cell}>End Time</DataTable.Title>
              <DataTable.Title style={styles.cell}>Status</DataTable.Title>
              <DataTable.Title style={styles.actionsCell}>
                Actions
              </DataTable.Title>
            </DataTable.Header>

            {attendance.length > 0 ? (
              attendance.map((record) => (
                <DataTable.Row key={record.id}>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.cellText}>{record.course}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.cellText}>{record.day}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.cellText}>{record.startTime}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.cellText}>{record.endTime}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.cellText}>{record.status}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleUpdate(record)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(record.id)}
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))
            ) : (
              <DataTable.Row>
                <DataTable.Cell>
                  <Text>No attendance records found</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  table: {
    width: "100%",
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
  cell: {
    flex: 1,
    justifyContent: "center",
    minWidth: 120,
  },
  cellText: {
    flexWrap: "wrap",
  },
  actionsCell: {
    minWidth: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});

export default AttendanceRecord;
