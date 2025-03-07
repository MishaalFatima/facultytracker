import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { DataTable } from "react-native-paper";

const DailyAttendaceReport = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([]);

  // Fetch all faculty with role "Faculty"
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("role", "==", "Faculty")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || "N/A",
          name: doc.data().name || "N/A",
          registrationNumber: doc.data().registrationNumber || "N/A",
          department: doc.data().department || "N/A",
        }));
        setFacultyList(data);
      } catch (error) {
        console.error("Error fetching faculty:", error);
        Alert.alert("Error", "Failed to fetch faculty");
      } finally {
        setLoadingFaculty(false);
      }
    };

    fetchFaculty();
  }, []);

  // Build department dropdown items based on fetched faculty
  useEffect(() => {
    const departments = Array.from(
      new Set(facultyList.map((faculty) => faculty.department))
    );
    const items = [{ label: "All", value: "" }, ...departments.map((dept) => ({ label: dept, value: dept }))];
    setDeptItems(items);
  }, [facultyList]);

  // Filter the faculty list by search and department
  const filteredFaculty = facultyList.filter((faculty) => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptValue ? faculty.department === deptValue : true;
    return matchesSearch && matchesDept;
  });

  // Fetch attendance for a selected faculty for today
  const fetchAttendanceForFaculty = async (faculty) => {
    setLoadingAttendance(true);
    try {
      const todayDay = new Date().toLocaleString("en-us", { weekday: "long" });
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        where("facultyId", "==", faculty.uid),
        where("day", "==", todayDay)
      );
      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      Alert.alert("Error", "Failed to fetch attendance records");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    fetchAttendanceForFaculty(faculty);
  };

  if (loadingFaculty) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Daily Attendance Report</Text>
        {!selectedFaculty ? (
          <>
            <Text style={styles.subtitle}>Select a Faculty:</Text>
            {/* Filter UI */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search Faculty..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.dropdownContainer}>
              <DropDownPicker
                open={deptOpen}
                value={deptValue}
                items={deptItems}
                setOpen={setDeptOpen}
                setValue={setDeptValue}
                setItems={setDeptItems}
                placeholder="Select Department"
                containerStyle={{ marginBottom: 10 }}
              />
            </View>
            {loadingFaculty ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <FlatList
                data={filteredFaculty}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.facultyItem}
                    onPress={() => handleFacultySelect(item)}
                  >
                    <Text style={styles.facultyName}>{item.name}</Text>
                    <Text style={styles.facultyDetails}>
                      {item.registrationNumber} - {item.department}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noDataText}>No faculty found.</Text>
                }
              />
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedFaculty(null);
                setAttendanceRecords([]);
              }}
            >
              <Text style={styles.backButtonText}>← Back to Faculty List</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>
              Attendance for {selectedFaculty.name} on{" "}
              {new Date().toLocaleString("en-us", { weekday: "long" })}
            </Text>
            {loadingAttendance ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Course</DataTable.Title>
                  <DataTable.Title>Start Time</DataTable.Title>
                  <DataTable.Title>End Time</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                </DataTable.Header>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <DataTable.Row key={record.id}>
                      <DataTable.Cell>{record.course}</DataTable.Cell>
                      <DataTable.Cell>{record.startTime}</DataTable.Cell>
                      <DataTable.Cell>{record.endTime}</DataTable.Cell>
                      <DataTable.Cell>{record.status}</DataTable.Cell>
                    </DataTable.Row>
                  ))
                ) : (
                  <DataTable.Row>
                    <DataTable.Cell>No attendance records for today.</DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#08422d",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    color: "#08422d",
  },
  searchInput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  dropdownContainer: {
    zIndex: 1000,
    marginBottom: 10,
  },
  facultyItem: {
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  facultyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#08422d",
  },
  facultyDetails: {
    fontSize: 14,
    color: "#555",
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
  },
  backButton: {
    marginBottom: 10,
    padding: 10,
  },
  backButtonText: {
    color: "#08422d",
    fontSize: 16,
  },
});

export default DailyAttendaceReport;
