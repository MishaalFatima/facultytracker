import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  SectionList, 
  Modal, 
  TouchableHighlight 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import Logout from "../Logout";

const CRGRDashboardScreen = () => {
  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuActive(!menuActive);
  };

  // Reset menu when the screen is focused
  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
      setMenuActive(false);
    }, [])
  );

  // Filter states for the dashboard
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // Dropdown data
  const [departmentsList, setDepartmentsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const navigation = useNavigation();

  // Fetch departments from Firestore
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentSnapshot = await getDocs(collection(firestore, "departments"));
        const deptData = departmentSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setDepartmentsList(deptData);
      } catch (error) {
        console.log("Error fetching departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch programs when a department is selected
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!selectedDepartment) {
        setProgramsList([]);
        return;
      }
      setLoadingPrograms(true);
      try {
        const programQuery = query(
          collection(firestore, "programs"),
          where("departmentId", "==", selectedDepartment)
        );
        const programSnapshot = await getDocs(programQuery);
        const progData = programSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setProgramsList(progData);
      } catch (error) {
        console.log("Error fetching programs:", error);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [selectedDepartment]);

  // Fetch timetable based on filters (without session filter)
  const fetchTimetable = async () => {
    if (!selectedDepartment || !selectedProgram || !selectedSemester) return;
    setLoadingTimetable(true);
    try {
      const timetableQuery = query(
        collection(firestore, "timetables"),
        where("department", "==", selectedDepartment),
        where("program", "==", selectedProgram),
        where("semester", "==", selectedSemester)
      );
      const timetableSnapshot = await getDocs(timetableQuery);
      const timetableData = timetableSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTimetable(timetableData);
    } catch (error) {
      console.log("Error fetching timetable:", error);
    } finally {
      setLoadingTimetable(false);
    }
  };

  // Re-fetch timetable when filters change
  useEffect(() => {
    if (selectedDepartment && selectedProgram && selectedSemester) {
      fetchTimetable();
    }
  }, [selectedDepartment, selectedProgram, selectedSemester]);

  // Group timetable data by day (using a defined order for weekdays)
  const groupTimetableByDay = (data) => {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const groups = data.reduce((acc, curr) => {
      const day = curr.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(curr);
      return acc;
    }, {});

    // Convert object into array of sections and sort by the defined order
    const sections = Object.keys(groups)
      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
      .map((day) => ({
        title: day,
        data: groups[day],
      }));
    return sections;
  };

  // Render a timetable row for SectionList
  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.cellCourse]}>
        <Text style={styles.cellText}>{item.course}</Text>
      </View>
      <View style={[styles.tableCell, styles.cellTime]}>
        <Text style={styles.cellText}>
          {item.startTime} - {item.endTime}
        </Text>
      </View>
    </View>
  );

  // Render section header (the day)
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.tableRow, styles.sectionHeader]}>
      <Text style={[styles.cellText, styles.headerText]}>{title}</Text>
    </View>
  );

  // Create the header component for filtering UI (above the table)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Class Timetable</Text>

      {loadingDepartments ? (
        <ActivityIndicator size="small" color="#08422d" style={styles.picker} />
      ) : (
        <Picker
          selectedValue={selectedDepartment}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
        >
          <Picker.Item label="Select Department" value="" />
          {departmentsList.map((dept) => (
            <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
          ))}
        </Picker>
      )}

      {loadingPrograms ? (
        <ActivityIndicator size="small" color="#08422d" style={styles.picker} />
      ) : (
        <Picker
          selectedValue={selectedProgram}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedProgram(itemValue)}
        >
          <Picker.Item label="Select Program" value="" />
          {programsList.map((prog) => (
            <Picker.Item key={prog.id} label={prog.name} value={prog.id} />
          ))}
        </Picker>
      )}

      <Picker
        selectedValue={selectedSemester}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedSemester(itemValue)}
      >
        <Picker.Item label="Select Semester" value="" />
        {[...Array(8).keys()].map((num) => (
          <Picker.Item key={num + 1} label={`Semester ${num + 1}`} value={(num + 1).toString()} />
        ))}
      </Picker>
    </View>
  );

  const sections = groupTimetableByDay(timetable);

  return (
    <View style={styles.container}>
      {/* Header with Title and Hamburger Menu */}
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

      {/* Hamburger Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
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
                navigation.navigate("RequestForUpdateTimetable");
              }}
              underlayColor="#fdcc0d"
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="update" size={24} color="#08422d" />
                <Text style={styles.menuText}>Request Update</Text>
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

      {/* SectionList with Filtering UI in the ListHeaderComponent */}
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
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
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
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 10,
  },
  headerContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
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
  listContainer: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
  // Table styles
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  sectionHeader: {
    backgroundColor: "#08422d",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  cellCourse: {
    flex: 2,
  },
  cellTime: {
    flex: 1.5,
  },
  cellText: {
    fontSize: 14,
    color: "#000",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Menu styles
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menu: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 18,
    marginLeft: 12,
    color: "#08422d",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
});

export default CRGRDashboardScreen;
