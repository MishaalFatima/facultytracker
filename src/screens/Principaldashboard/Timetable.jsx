import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getAuth } from "firebase/auth";
import { firestore } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import EditTimetable from "../AdminDashboard/EditTimetable";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const Timetable = () => {
  // — AUTH & ROLE —
  const auth = getAuth();
  const currentUid = auth.currentUser.uid;
  const [userRole, setUserRole] = useState(null);

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
  const [loadingRole, setLoadingRole] = useState(true);

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

  // ─── Fetch current user's role ───────────────────────────────────────────
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUid));
        setUserRole(userDoc.data()?.role.trim().toLowerCase() || "");
      } catch (err) {
        console.error("Error fetching user role:", err);
      } finally {
        setLoadingRole(false);
      }
    };
    fetchRole();
  }, [currentUid]);

  // ─── Fetch timetables ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "timetables"));
        setTimetables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        Alert.alert("Error", "Failed to fetch timetables.");
        console.error(err);
      } finally {
        setLoadingTimetables(false);
      }
    })();
  }, []);

  // ─── Fetch departments ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "departments"));
        const map = {};
        snap.docs.forEach(d => (map[d.id] = d.data().name));
        setDepartments(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch departments.");
        console.error(err);
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  // ─── Fetch programs ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "programs"));
        const map = {};
        snap.docs.forEach(d => (map[d.id] = d.data().name));
        setPrograms(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch programs.");
        console.error(err);
      } finally {
        setLoadingPrograms(false);
      }
    })();
  }, []);

  // ─── Fetch faculty list ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(firestore, "users"), where("role", "==", "Faculty"))
        );
        const map = {};
        snap.docs.forEach(d => (map[d.id] = d.data().name));
        setFaculty(map);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch faculty.");
        console.error(err);
      } finally {
        setLoadingFaculty(false);
      }
    })();
  }, []);

  // ─── Build dropdown items ────────────────────────────────────────────────
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

  // ─── Show loader until everything is ready ────────────────────────────────
  if (
    loadingRole ||
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

  // ─── Filter logic ─────────────────────────────────────────────────────────
  const filtered = timetables.filter(tt => {
    if (deptValue && tt.department !== deptValue) return false;
    if (programValue && tt.program !== programValue) return false;
    if (facultyValue && tt.facultyId !== facultyValue) return false;
    if (shiftValue && tt.shift !== shiftValue) return false;
    return true;
  });

  // ─── PDF generation ───────────────────────────────────────────────────────
  const generatePdf = async () => {
    // Build HTML string
    const headers = [
      "Department",
      "Program",
      "Semester",
      "Day",
      "Course",
      "Time",
      "Faculty",
      "Room Number",
      "Shift",
    ];
    const htmlRows = filtered
      .map(
        tt => `
      <tr>
        <td>${departments[tt.department] || ""}</td>
        <td>${programs[tt.program] || ""}</td>
        <td>${tt.semester}</td>
        <td>${tt.day}</td>
        <td>${tt.course}</td>
        <td>${tt.startTime} - ${tt.endTime}</td>
        <td>${faculty[tt.facultyId] || ""}</td>
        <td>${tt.roomNumber}</td>
        <td>${tt.shift}</td>
      </tr>`
      )
      .join("");
    const html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #08422d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Timetable</h1>
        <table>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          ${htmlRows || `<tr><td colspan="${headers.length}">No entries</td></tr>`}
        </table>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Timetable PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
            } catch {
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

  // ─── Determine admin status ───────────────────────────────────────────────
  const isAdmin = userRole === "admin";

  // ─── Render each row ──────────────────────────────────────────────────────
  const renderRow = ({ item: tt }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{departments[tt.department]}</Text>
      <Text style={styles.tableCell}>{programs[tt.program]}</Text>
      <Text style={styles.tableCell}>{tt.semester}</Text>
      <Text style={styles.tableCell}>{tt.day}</Text>
      <Text style={styles.tableCell}>{tt.course}</Text>
      <Text style={styles.tableCell}>{tt.startTime} - {tt.endTime}</Text>
      <Text style={styles.tableCell}>{faculty[tt.facultyId]}</Text>
      <Text style={styles.tableCell}>{tt.roomNumber}</Text>
      <Text style={styles.tableCell}>{tt.shift}</Text>
      {isAdmin && (
        <View style={[styles.tableCell, styles.actionCell]}>
          <TouchableOpacity onPress={() => handleEdit(tt)}>
            <Icon name="edit" size={20} color="blue" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(tt.id)}>
            <Icon name="delete" size={20} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ─── Header cells ─────────────────────────────────────────────────────────
  const headers = [
    "Department",
    "Program",
    "Semester",
    "Day",
    "Course",
    "Time",
    "Faculty",
    "Room Number",
    "Shift",
  ];
  if (isAdmin) headers.push("Actions");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { zIndex: 4000 }]}>
        {/* Title & PDF Button */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Timetable</Text>
          <TouchableOpacity onPress={generatePdf} style={styles.pdfButton}>
            <Icon name="picture-as-pdf" size={24} color="white" />
            <Text style={styles.pdfText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

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
              {headers.map(h => (
                <Text key={h} style={styles.headerCell}>
                  {h}
                </Text>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#08422d",
  },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#e53e3e",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  pdfText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "500",
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
