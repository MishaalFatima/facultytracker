import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  where,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import LoadingScreen from "../LoadingScreen";

const FacultyList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const facultyTypeParam = route.params?.facultyType || "both";

  // Availability & user data
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + status toggle
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Available");

  // Department dropdown state
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([
    { label: "All Departments", value: "" },
  ]);

  // Map of deptID → deptName
  const [deptMap, setDeptMap] = useState({});

  // Real-time availability listener
  useEffect(() => {
    const q = query(
      collection(firestore, "facultyAvailability"),
      orderBy("creationTime")
    );
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach((doc) => {
        const d = doc.data();
        if (!("endTime" in d) || d.endTime === null) {
          map[d.userId] = d.availability;
        }
      });
      setAvailabilityMap(map);
    });
    return () => unsub();
  }, []);

  // Fetch departments → build map & dropdown items
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const snap = await getDocs(collection(firestore, "departments"));
        const map = {};
        const items = [{ label: "All Departments", value: "" }];

        snap.docs.forEach((doc) => {
          const id = doc.id;
          const name = (doc.data().name || "").trim();
          map[id] = name;
          items.push({ label: name, value: id });
        });

        setDeptMap(map);
        setDeptItems(items);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch faculty **after** map is ready
  useEffect(() => {
    if (!Object.keys(deptMap).length) return;

    const fetchFaculty = async () => {
      setLoading(true);
      try {
        let q;
        if (facultyTypeParam === "both") {
          // Attendance view: both Permanent & Visiting
          q = query(
            collection(firestore, "users"),
            where("role", "==", "Faculty")
          );
        } else {
          // Location view: only Permanent
          q = query(
            collection(firestore, "users"),
            where("role", "==", "Faculty"),
            where("FacultyType", "==", "Permanent")
          );
        }

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          const deptId = (d.department || "").trim();
          return {
            id: doc.id,
            uid: d.uid || doc.id,
            name: d.name || "N/A",
            registrationNumber: d.registrationNumber || "N/A",
            facultyType: d.FacultyType || "N/A",
            departmentId: deptId,
            departmentName: deptMap[deptId] || "Unknown Dept",
          };
        });
        setFacultyData(data);
      } catch (err) {
        console.error("Error fetching faculty:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [facultyTypeParam, deptMap]);

  if (loading) return <LoadingScreen />;

  // Filters
  let filtered = facultyData;

  // → only filter by availability when in "Permanent" (location) mode
  if (facultyTypeParam === "Permanent") {
    filtered = filtered.filter((f) => {
      const status = availabilityMap[f.uid] || "Unavailable";
      return selectedStatus === "Available"
        ? status === "Available"
        : status === "Unavailable";
    });
  }

  // search‐by‐name (always)
  filtered = filtered.filter((f) => {
    const name = (f.name ?? "").toLowerCase();
    const query = (searchQuery ?? "").toLowerCase();
    return name.includes(query);
  });

  // department filter (always)
  if (deptValue) {
    filtered = filtered.filter((f) => f.departmentId === deptValue);
  }

  // Render each item with conditional buttons
  const renderItem = ({ item }) => {
    const status = availabilityMap[item.uid] || "Unavailable";
    return (
      <View style={styles.listItem}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>Reg: {item.registrationNumber}</Text>
        <Text>Dept: {item.departmentName}</Text>
        <Text>Type: {item.facultyType}</Text>

        {/* Only show availability badge in Permanent (location) view */}
        {facultyTypeParam === "Permanent" && (
          <View style={styles.availabilityContainer}>
            <Text
              style={[
                styles.status,
                { color: status === "Available" ? "green" : "red" },
              ]}
            >
              {status}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {/* “View Attendance” only for the Attendance view */}
          {facultyTypeParam === "both" && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                navigation.navigate("AttendanceRecord", {
                  deptValue,
                  uid: item.uid,
                })
              }
            >
              <Text style={styles.buttonText}>View Attendance</Text>
            </TouchableOpacity>
          )}

          {/* “Track Location” only in the Location view */}
          {facultyTypeParam === "Permanent" && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                navigation.navigate("AvailabilityReport", {
                  deptValue,
                  uid: item.uid,
                })
              }
            >
              <Text style={styles.buttonText}>Track Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {facultyTypeParam === "both"
          ? "All Faculty Members"
          : "Faculty Availability"}
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search faculty..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <DropDownPicker
        open={deptOpen}
        value={deptValue}
        items={deptItems}
        setOpen={setDeptOpen}
        setValue={setDeptValue}
        setItems={setDeptItems}
        placeholder="Select Department"
        style={styles.dropdown}
        dropDownContainerStyle={{ borderColor: "#08422d" }}
      />

      {/* Only show availability‐status toggles in Location view */}
      {facultyTypeParam === "Permanent" && (
        <View style={styles.filterContainer}>
          {["Available", "Unavailable"].map((stat) => (
            <TouchableOpacity
              key={stat}
              style={[
                styles.filterButton,
                selectedStatus === stat && styles.activeFilter,
              ]}
              onPress={() => setSelectedStatus(stat)}
            >
              <Text style={styles.filterText}>{stat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No faculty found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 16,
  },
  search: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  dropdown: { borderColor: "#08422d", marginBottom: 12 },
  filterContainer: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeFilter: {
    backgroundColor: "rgba(8,66,45,0.2)",
    borderColor: "#08422d",
  },
  filterText: { color: "#08422d", fontWeight: "bold" },
  list: { gap: 8 },
  listItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 4,
  },
  availabilityContainer: { marginTop: 8 },
  status: { fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 5,
    backgroundColor: "#08422d",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14 },
  empty: { textAlign: "center", color: "#666", marginTop: 20 },
});

export default FacultyList;
