import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firestore } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import EditTimetable from "../AdminDashboard/EditTimetable";

const Timetable = () => {
  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState({});
  const [programs, setPrograms] = useState({});
  const [faculty, setFaculty] = useState({});

  const [loadingTimetables, setLoadingTimetables] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(true);

  // Dropdown filter states
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([]);

  const [programOpen, setProgramOpen] = useState(false);
  const [programValue, setProgramValue] = useState("");
  const [programItems, setProgramItems] = useState([]);

  const [facultyOpen, setFacultyOpen] = useState(false);
  const [facultyValue, setFacultyValue] = useState("");
  const [facultyItems, setFacultyItems] = useState([]);

  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftValue, setShiftValue] = useState("");
  const [shiftItems, setShiftItems] = useState([
    { label: "Both Shifts", value: "" },
    { label: "Morning", value: "Morning" },
    { label: "Evening", value: "Evening" },
  ]);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  // --- Fetching Data ---
  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const timetableCollection = collection(firestore, "timetables");
        const timetableSnapshot = await getDocs(timetableCollection);
        const timetableData = timetableSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTimetables(timetableData);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch timetables.");
        console.error("Error fetching timetables: ", error);
      } finally {
        setLoadingTimetables(false);
      }
    };

    fetchTimetables();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentCollection = collection(firestore, "departments");
        const departmentSnapshot = await getDocs(departmentCollection);
        const deptMap = {};
        departmentSnapshot.docs.forEach((doc) => {
          deptMap[doc.id] = doc.data().name;
        });
        setDepartments(deptMap);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch departments.");
        console.error("Error fetching departments: ", error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const programCollection = collection(firestore, "programs");
        const programSnapshot = await getDocs(programCollection);
        const progMap = {};
        programSnapshot.docs.forEach((doc) => {
          progMap[doc.id] = doc.data().name;
        });
        setPrograms(progMap);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch programs.");
        console.error("Error fetching programs: ", error);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const facultyQuery = query(
          collection(firestore, "users"),
          where("role", "==", "Faculty")
        );
        const facultySnapshot = await getDocs(facultyQuery);
        const facultyMap = {};
        facultySnapshot.docs.forEach((doc) => {
          facultyMap[doc.id] = doc.data().name;
        });
        setFaculty(facultyMap);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch faculty names.");
        console.error("Error fetching faculty: ", error);
      } finally {
        setLoadingFaculty(false);
      }
    };

    fetchFaculty();
  }, []);

  // Set dropdown items when lookup data is loaded
  useEffect(() => {
    const deptArray = [
      { label: "All Departments", value: "" },
      ...Object.entries(departments).map(([id, name]) => ({
        label: name,
        value: id,
      })),
    ];
    setDeptItems(deptArray);
  }, [departments]);

  useEffect(() => {
    const progArray = [
      { label: "All Programs", value: "" },
      ...Object.entries(programs).map(([id, name]) => ({
        label: name,
        value: id,
      })),
    ];
    setProgramItems(progArray);
  }, [programs]);

  useEffect(() => {
    const facArray = [
      { label: "All Faculty Members", value: "" },
      ...Object.entries(faculty).map(([id, name]) => ({
        label: name,
        value: id,
      })),
    ];
    setFacultyItems(facArray);
  }, [faculty]);

  if (
    loadingTimetables ||
    loadingDepartments ||
    loadingPrograms ||
    loadingFaculty
  ) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#08422d" />
      </SafeAreaView>
    );
  }

  // --- Filtering ---
  const filteredTimetables = timetables.filter((tt) => {
    if (deptValue && tt.department !== deptValue) return false;
    if (programValue && tt.program !== programValue) return false;
    if (facultyValue && tt.facultyId !== facultyValue) return false;
    if (shiftValue && tt.shift !== shiftValue) return false;
    return true;
  });

  // --- Handlers ---
  const handleEdit = (record) => {
    setSelectedTimetable(record);
    setEditModalVisible(true);
  };

  const handleDelete = (recordId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this timetable entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "timetables", recordId));
              setTimetables((prev) => prev.filter((tt) => tt.id !== recordId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete timetable entry.");
              console.error("Error deleting timetable: ", error);
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateDoc(doc(firestore, "timetables", selectedTimetable.id), updatedData);
      setTimetables((prev) =>
        prev.map((tt) =>
          tt.id === selectedTimetable.id ? { ...tt, ...updatedData } : tt
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update timetable entry.");
      console.error("Error updating timetable: ", error);
    } finally {
      setEditModalVisible(false);
      setSelectedTimetable(null);
    }
  };

  // --- Render Table Row ---
  const renderTableRow = ({ item: tt }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>
        {departments[tt.department] || tt.department}
      </Text>
      <Text style={styles.tableCell}>
        {programs[tt.program] || tt.program}
      </Text>
      <Text style={styles.tableCell}>{tt.semester}</Text>
      <Text style={styles.tableCell}>{tt.day}</Text>
      <Text style={styles.tableCell}>{tt.course}</Text>
      <Text style={styles.tableCell}>
        {tt.startTime} - {tt.endTime}
      </Text>
      <Text style={styles.tableCell}>
        {faculty[tt.facultyId] || tt.facultyId}
      </Text>
      <Text style={styles.tableCell}>{tt.roomNumber}</Text>
      <Text style={styles.tableCell}>{tt.shift}</Text>
      <View style={[styles.tableCell, styles.actionCell]}>
        <TouchableOpacity onPress={() => handleEdit(tt)}>
          <Icon name="edit" size={20} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(tt.id)}>
          <Icon name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Timetable</Text>
        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Filters:</Text>
          <View style={{ zIndex: 3000, marginBottom: 10 }}>
            <DropDownPicker
              open={deptOpen}
              value={deptValue}
              items={deptItems}
              setOpen={setDeptOpen}
              setValue={setDeptValue}
              setItems={setDeptItems}
              searchable={true}
              placeholder="Select Department"
              containerStyle={styles.dropdownContainer}
            />
          </View>
          <View style={{ zIndex: 2500, marginBottom: 10 }}>
            <DropDownPicker
              open={programOpen}
              value={programValue}
              items={programItems}
              setOpen={setProgramOpen}
              setValue={setProgramValue}
              setItems={setProgramItems}
              searchable={true}
              placeholder="Select Program"
              containerStyle={styles.dropdownContainer}
            />
          </View>
          <View style={{ zIndex: 2000, marginBottom: 10 }}>
            <DropDownPicker
              open={facultyOpen}
              value={facultyValue}
              items={facultyItems}
              setOpen={setFacultyOpen}
              setValue={setFacultyValue}
              setItems={setFacultyItems}
              searchable={true}
              placeholder="Select Faculty"
              containerStyle={styles.dropdownContainer}
            />
          </View>
          <View style={{ zIndex: 1500, marginBottom: 10 }}>
            <DropDownPicker
              open={shiftOpen}
              value={shiftValue}
              items={shiftItems}
              setOpen={setShiftOpen}
              setValue={setShiftValue}
              setItems={setShiftItems}
              searchable={true}
              placeholder="Select Shift"
              containerStyle={styles.dropdownContainer}
            />
          </View>
        </View>
        {/* Table Section */}
        <ScrollView horizontal nestedScrollEnabled={true}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Department</Text>
              <Text style={styles.headerCell}>Program</Text>
              <Text style={styles.headerCell}>Semester</Text>
              <Text style={styles.headerCell}>Day</Text>
              <Text style={styles.headerCell}>Course</Text>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Faculty</Text>
              <Text style={styles.headerCell}>Room Number</Text>
              <Text style={styles.headerCell}>Shift</Text>
              <Text style={styles.headerCell}>Actions</Text>
            </View>
            <FlatList
              data={filteredTimetables}
              keyExtractor={(item) => item.id}
              renderItem={renderTableRow}
              nestedScrollEnabled={true}
              ListEmptyComponent={
                <Text style={styles.noData}>No timetable entries found.</Text>
              }
            />
          </View>
        </ScrollView>
      </View>
      {selectedTimetable && (
        <EditTimetable
          visible={editModalVisible}
          record={selectedTimetable}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedTimetable(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 20,
    textAlign: "center",
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#08422d",
  },
  dropdownContainer: {
    // Additional styling if needed
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#08422d",
  },
  headerCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: 120, // Fixed width for consistency
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: 120, // Fixed width for consistency
    textAlign: "center",
  },
  actionCell: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  noData: {
    padding: 8,
    textAlign: "center",
    color: "#08422d",
  },
});

export default Timetable;
