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
  // — DATA —
  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState({});
  const [programs, setPrograms] = useState({});
  const [faculty, setFaculty] = useState({});

  // — LOADING STATES —
  const [loadingTimetables, setLoadingTimetables] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(true);

  // — DROPDOWN STATES —
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

  // — EDIT MODAL STATE —
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  // --- FETCH TIMETABLES ---
  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const col = collection(firestore, "timetables");
        const snap = await getDocs(col);
        setTimetables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        Alert.alert("Error", "Failed to fetch timetables.");
        console.error(err);
      } finally {
        setLoadingTimetables(false);
      }
    };
    fetchTimetables();
  }, []);

  // --- FETCH DEPARTMENTS ---
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const col = collection(firestore, "departments");
        const snap = await getDocs(col);
        const map = {};
        snap.docs.forEach(d => map[d.id] = d.data().name);
        setDepartments(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch departments.");
        console.error(err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // --- FETCH PROGRAMS ---
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const col = collection(firestore, "programs");
        const snap = await getDocs(col);
        const map = {};
        snap.docs.forEach(d => map[d.id] = d.data().name);
        setPrograms(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch programs.");
        console.error(err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  // --- FETCH FACULTY ---
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("role", "==", "Faculty")
        );
        const snap = await getDocs(q);
        const map = {};
        snap.docs.forEach(d => map[d.id] = d.data().name);
        setFaculty(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch faculty.");
        console.error(err);
      } finally {
        setLoadingFaculty(false);
      }
    };
    fetchFaculty();
  }, []);

  // --- BUILD DROPDOWN ITEMS when lookups arrive ---
  useEffect(() => {
    setDeptItems([
      { label: "All Departments", value: "" },
      ...Object.entries(departments).map(([id, name]) => ({ label: name, value: id })),
    ]);
  }, [departments]);

  useEffect(() => {
    setProgramItems([
      { label: "All Programs", value: "" },
      ...Object.entries(programs).map(([id, name]) => ({ label: name, value: id })),
    ]);
  }, [programs]);

  useEffect(() => {
    setFacultyItems([
      { label: "All Faculty", value: "" },
      ...Object.entries(faculty).map(([id, name]) => ({ label: name, value: id })),
    ]);
  }, [faculty]);

  // — SHOW LOADER until ALL four are done —
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

  // --- FILTER LOGIC ---
  const filtered = timetables.filter(tt => {
    if (deptValue && tt.department !== deptValue) return false;
    if (programValue && tt.program !== programValue) return false;
    if (facultyValue && tt.facultyId !== facultyValue) return false;
    if (shiftValue && tt.shift !== shiftValue) return false;
    return true;
  });

  // --- HANDLERS ---
  const handleEdit = rec => {
    setSelectedTimetable(rec);
    setEditModalVisible(true);
  };
  const handleDelete = id => {
    Alert.alert(
      "Confirm Delete",
      "Delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "timetables", id));
              setTimetables(t => t.filter(x => x.id !== id));
            } catch (err) {
              Alert.alert("Error", "Failed to delete.");
            }
          },
        },
      ]
    );
  };
  const handleSave = async updated => {
    try {
      await updateDoc(doc(firestore, "timetables", selectedTimetable.id), updated);
      setTimetables(t =>
        t.map(x => (x.id === selectedTimetable.id ? { ...x, ...updated } : x))
      );
    } catch {
      Alert.alert("Error", "Failed to update.");
    } finally {
      setEditModalVisible(false);
      setSelectedTimetable(null);
    }
  };

  // --- RENDER ROW ---
  const renderRow = ({ item: tt }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{departments[tt.department]}</Text>
      <Text style={styles.tableCell}>{programs[tt.program]}</Text>
      <Text style={styles.tableCell}>{tt.semester}</Text>
      <Text style={styles.tableCell}>{tt.day}</Text>
      <Text style={styles.tableCell}>{tt.course}</Text>
      <Text style={styles.tableCell}>
        {tt.startTime} - {tt.endTime}
      </Text>
      <Text style={styles.tableCell}>{faculty[tt.facultyId]}</Text>
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
      <View style={[styles.container, { zIndex: 4000 }]}>
        <Text style={styles.title}>Timetable</Text>

        {/* FILTERS */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Filters:</Text>

          <View style={{ zIndex: 3000, marginBottom: 12 }}>
            <DropDownPicker
              open={deptOpen}
              value={deptValue}
              items={deptItems}
              setOpen={setDeptOpen}
              setValue={setDeptValue}
              setItems={setDeptItems}
              placeholder="Select Department"
              searchable
              listMode="MODAL"
            />
          </View>

          <View style={{ zIndex: 2500, marginBottom: 12 }}>
            <DropDownPicker
              open={programOpen}
              value={programValue}
              items={programItems}
              setOpen={setProgramOpen}
              setValue={setProgramValue}
              setItems={setProgramItems}
              placeholder="Select Program"
              searchable
              listMode="MODAL"
            />
          </View>

          <View style={{ zIndex: 2000, marginBottom: 12 }}>
            <DropDownPicker
              open={facultyOpen}
              value={facultyValue}
              items={facultyItems}
              setOpen={setFacultyOpen}
              setValue={setFacultyValue}
              setItems={setFacultyItems}
              placeholder="Select Faculty"
              searchable
              listMode="MODAL"
            />
          </View>

          <View style={{ zIndex: 1500, marginBottom: 12 }}>
            <DropDownPicker
              open={shiftOpen}
              value={shiftValue}
              items={shiftItems}
              setOpen={setShiftOpen}
              setValue={setShiftValue}
              setItems={setShiftItems}
              placeholder="Select Shift"
              searchable
              listMode="MODAL"
            />
          </View>
        </View>

        {/* TIMETABLE TABLE */}
        <ScrollView horizontal nestedScrollEnabled>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {[
                "Department",
                "Program",
                "Semester",
                "Day",
                "Course",
                "Time",
                "Faculty",
                "Room Number",
                "Shift",
                "Actions",
              ].map(h => (
                <Text key={h} style={styles.headerCell}>{h}</Text>
              ))}
            </View>
            <FlatList
              data={filtered}
              keyExtractor={x => x.id}
              renderItem={renderRow}
              nestedScrollEnabled
              ListEmptyComponent={
                <Text style={styles.noData}>No timetable entries found.</Text>
              }
            />
          </View>
        </ScrollView>
      </View>

      {/* EDIT MODAL */}
      {selectedTimetable && (
        <EditTimetable
          visible={editModalVisible}
          record={selectedTimetable}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedTimetable(null);
          }}
          onSave={handleSave}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 20,
    textAlign: "center",
  },
  filtersContainer: { marginBottom: 20 },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#08422d",
  },
  table: { borderWidth: 1, borderColor: "#ccc" },
  tableHeader: { flexDirection: "row", backgroundColor: "#08422d" },
  headerCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: 120,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: { flexDirection: "row" },
  tableCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: 120,
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