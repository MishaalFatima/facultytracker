import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  Modal,
  TouchableHighlight,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../firebaseConfig";
import Logout from "../Logout";

const CRGRDashboardScreen = () => {
  // ─── Menu State ─────────────────────────────────────────────────────────────
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuActive(!menuActive);
  };
  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
      setMenuActive(false);
    }, [])
  );

  // ─── Filter & Data State ────────────────────────────────────────────────────
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCoursesList, setLoadingCoursesList] = useState(false);

  // ─── Current User State ─────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);

  const navigation = useNavigation();

  // ─── Fetch current user profile ──────────────────────────────────────────────
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userSnap = await getDoc(doc(firestore, "users", user.uid));
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data());
        }
      } catch (error) {
        console.log("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // ─── Fetch Departments ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const snap = await getDocs(collection(firestore, "departments"));
        setDepartmentsList(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
        );
      } catch (error) {
        console.log("Error fetching departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // ─── Fetch Programs on Department Change ────────────────────────────────────
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!selectedDepartment) {
        setProgramsList([]);
        return;
      }
      setLoadingPrograms(true);
      try {
        const q = query(
          collection(firestore, "programs"),
          where("departmentId", "==", selectedDepartment)
        );
        const snap = await getDocs(q);
        setProgramsList(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
        );
      } catch (error) {
        console.log("Error fetching programs:", error);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [selectedDepartment]);

  // ─── Fetch Courses on Program Change ────────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedProgram) {
        setCoursesList([]);
        return;
      }
      setLoadingCoursesList(true);
      try {
        const q = query(
          collection(firestore, "courses"),
          where("programId", "==", selectedProgram)
        );
        const snap = await getDocs(q);
        setCoursesList(
          snap.docs.map((d) => ({
            id: d.id,
            code: d.data().code,
            name: d.data().name.trim(),
          }))
        );
      } catch (error) {
        console.log("Error fetching courses:", error);
      } finally {
        setLoadingCoursesList(false);
      }
    };
    fetchCourses();
  }, [selectedProgram]);

  // ─── Real-time Timetable Listener ───────────────────────────────────────────
  useEffect(() => {
    if (
      !selectedDepartment ||
      !selectedProgram ||
      !selectedSemester ||
      !selectedShift
    ) {
      setTimetable([]);
      return;
    }

    setLoadingTimetable(true);
    const q = query(
      collection(firestore, "timetables"),
      where("department", "==", selectedDepartment),
      where("program", "==", selectedProgram),
      where("semester", "==", selectedSemester),
      where("shift", "==", selectedShift)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTimetable(data);
        setLoadingTimetable(false);
      },
      (error) => {
        console.error("Snapshot error:", error);
        setLoadingTimetable(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDepartment, selectedProgram, selectedSemester, selectedShift]);

  // ─── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (timetableId) => {
    try {
      await deleteDoc(doc(firestore, "timetables", timetableId));
      // onSnapshot will auto-update the UI
    } catch (error) {
      console.log("Error deleting timetable entry:", error);
    }
  };

  // ─── Build Course Lookup Map ────────────────────────────────────────────────
  const coursesMap = coursesList.reduce((acc, { code, name }) => {
    acc[code] = name;
    return acc;
  }, {});

  // ─── Sort & Group by Day ─────────────────────────────────────────────────────
  const timeToMinutes = (t) => {
    const [time, modifier] = t.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const groupTimetableByDay = (data) => {
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const groups = data.reduce((acc, curr) => {
      acc[curr.day] = acc[curr.day] || [];
      acc[curr.day].push(curr);
      return acc;
    }, {});
    return Object.keys(groups)
      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
      .map((day) => {
        const dayItems = groups[day].slice();
        dayItems.sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );
        return { title: day, data: dayItems };
      });
  };
  const sections = groupTimetableByDay(timetable);

  // ─── Renderers ──────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.cellCourse]}>
        <Text style={styles.cellText}>
          {coursesMap[item.course]
            ? `${coursesMap[item.course]} (${item.course})`
            : item.course}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.cellTime]}>
        <Text style={styles.cellText}>
          {item.startTime} - {item.endTime}
        </Text>
      </View>
      {currentUser &&
        currentUser.department === selectedDepartment &&
        currentUser.program === selectedProgram &&
        currentUser.semester === selectedSemester && (
          <TouchableHighlight
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            underlayColor="#fdd"
          >
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableHighlight>
        )}
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.tableRow, styles.sectionHeader]}>
      <Text style={[styles.cellText, styles.headerText]}>{title}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Class Timetable</Text>

      {loadingDepartments ? (
        <ActivityIndicator size="small" color="#08422d" style={styles.picker} />
      ) : (
        <Picker
          selectedValue={selectedDepartment}
          style={styles.picker}
          onValueChange={setSelectedDepartment}
        >
          <Picker.Item label="Select Department" value="" />
          {departmentsList.map((d) => (
            <Picker.Item key={d.id} label={d.name} value={d.id} />
          ))}
        </Picker>
      )}

      {loadingPrograms ? (
        <ActivityIndicator size="small" color="#08422d" style={styles.picker} />
      ) : (
        <Picker
          selectedValue={selectedProgram}
          style={styles.picker}
          onValueChange={setSelectedProgram}
        >
          <Picker.Item label="Select Program" value="" />
          {programsList.map((p) => (
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          ))}
        </Picker>
      )}

      {loadingCoursesList && (
        <ActivityIndicator size="small" color="#08422d" style={styles.picker} />
      )}

      <Picker
        selectedValue={selectedSemester}
        style={styles.picker}
        onValueChange={setSelectedSemester}
      >
        <Picker.Item label="Select Semester" value="" />
        {[...Array(8).keys()].map((n) => (
          <Picker.Item key={n + 1} label={`Semester ${n + 1}`} value={`${n + 1}`} />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedShift}
        style={styles.picker}
        onValueChange={setSelectedShift}
      >
        <Picker.Item label="Select Shift" value="" />
        <Picker.Item label="Morning" value="Morning" />
        <Picker.Item label="Evening" value="Evening" />
      </Picker>
    </View>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CR/GR Dashboard</Text>
        <TouchableHighlight
          onPress={toggleMenu}
          underlayColor="#fdcc0d"
          style={styles.menuButton}
        >
          <MaterialIcons
            name="menu"
            size={28}
            color={menuActive ? "#fdcc0d" : "#ffffff"}
          />
        </TouchableHighlight>
      </View>

      {/* Hamburger Menu */}
      <Modal
        animationType="slide"
        transparent
        visible={menuVisible}
        onRequestClose={toggleMenu}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menu}>
            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("TimetableForm");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="file-upload" size={24} color="#08422d" />
                <Text style={styles.menuText}>Upload Timetable</Text>
              </View>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                navigation.navigate("ProfileScreen");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="person" size={24} color="#08422d" />
                <Text style={styles.menuText}>View Profile</Text>
              </View>
            </TouchableHighlight>

            <View style={styles.divider} />

            <Logout variant="menu" />

            <TouchableHighlight
              style={styles.menuItem}
              onPress={toggleMenu}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={styles.menuText}>Close</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Timetable List */}
      {loadingTimetable ? (
        <ActivityIndicator size="large" color="#08422d" style={{ marginTop: 20 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No timetable found for the selected filters.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    backgroundColor: "#08422d",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    elevation: 4,
  },
  headerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  menuButton: { padding: 10 },

  headerContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#08422d",
    textAlign: "center",
    marginVertical: 15,
  },
  picker: {
    height: 50,
    width: "100%",
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },

  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#999" },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  sectionHeader: { backgroundColor: "#08422d", paddingVertical: 10, paddingHorizontal: 5 },
  tableCell: { flex: 1, paddingHorizontal: 5 },
  cellCourse: { flex: 2 },
  cellTime: { flex: 1.5 },
  cellText: { fontSize: 14, color: "#000" },
  headerText: { color: "#fff", fontWeight: "bold" },

  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },

  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  menuItem: { flexDirection: "row", paddingVertical: 12, width: "100%", alignItems: "center" },
  menuItemContent: { flexDirection: "row", alignItems: "center" },
  menuText: { fontSize: 18, marginLeft: 12, color: "#08422d" },
  divider: { height: 1, width: "100%", backgroundColor: "#ddd", marginVertical: 10 },
});

export default CRGRDashboardScreen;
