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
  where,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import LoadingScreen from "../LoadingScreen";
import { getAuth } from "firebase/auth";

const FacultyList = () => {
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Available");
  const navigation = useNavigation();
  const route = useRoute();

  // Read the facultyType parameter from route. Defaults to "both".
  const facultyTypeParam = route.params?.facultyType || "both";

  // Dropdown filter states for Department.
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([]);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [currentUserAvailability, setCurrentUserAvailability] = useState(null);

  // Mapping of faculty uid to their active availability status.
  const [availabilityMap, setAvailabilityMap] = useState({});

  // Fetch the current user's active availability document (without an endTime).
  useEffect(() => {
    const fetchCurrentAvailability = async () => {
      if (currentUser) {
        try {
          const availabilityQuery = query(
            collection(firestore, "facultyAvailability"),
            where("userId", "==", currentUser.uid),
            where("endTime", "==", null),
            orderBy("creationTime", "desc"),
            limit(1)
          );
          const querySnapshot = await getDocs(availabilityQuery);
          if (!querySnapshot.empty) {
            const latestDoc = querySnapshot.docs[0];
            setCurrentUserAvailability(latestDoc.data().availability);
          }
        } catch (error) {
          console.error("Error fetching current user availability:", error);
        }
      }
    };
    fetchCurrentAvailability();
  }, [currentUser]);

  // Fetch faculty data from the "users" collection.
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        let facultyQuery;
        if (facultyTypeParam === "both") {
          facultyQuery = query(
            collection(firestore, "users"),
            where("role", "==", "Faculty")
          );
        } else {
          facultyQuery = query(
            collection(firestore, "users"),
            where("role", "==", "Faculty"),
            where("FacultyType", "==", facultyTypeParam)
          );
        }
        const snapshot = await getDocs(facultyQuery);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || "N/A",
          name: doc.data().name || "N/A",
          registrationNumber: doc.data().registrationNumber || "N/A",
          department: doc.data().department || "N/A",
          facultyType: doc.data().FacultyType || "N/A",
        }));
        setFacultyData(data);
      } catch (error) {
        console.log("Error fetching faculty data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [facultyTypeParam]);

  // Fetch active availability docs for all faculty and build a mapping (uid -> availability)
  useEffect(() => {
    const fetchActiveAvailabilities = async () => {
      try {
        const availabilityQuery = query(
          collection(firestore, "facultyAvailability"),
          where("endTime", "==", null)
        );
        const querySnapshot = await getDocs(availabilityQuery);
        const map = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          map[data.userId] = data.availability;
        });
        setAvailabilityMap(map);
      } catch (error) {
        console.error("Error fetching active availabilities:", error);
      }
    };

    fetchActiveAvailabilities();
    // Refresh the availability mapping every 5 seconds for real-time updates.
    const interval = setInterval(fetchActiveAvailabilities, 5000);
    return () => clearInterval(interval);
  }, []);

  // Build department filter items from fetched faculty data.
  useEffect(() => {
    const departments = Array.from(
      new Set(facultyData.map((faculty) => faculty.department))
    );
    const items = [
      { label: "All Departments", value: "" },
      ...departments.map((dept) => ({ label: dept, value: dept })),
    ];
    setDeptItems(items);
  }, [facultyData]);

  // Function to toggle availability for the current user.
  const toggleAvailability = async () => {
    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }
    try {
      // Query for the active document (without endTime) for the current user.
      const availabilityQuery = query(
        collection(firestore, "facultyAvailability"),
        where("userId", "==", currentUser.uid),
        where("endTime", "==", null),
        orderBy("creationTime", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(availabilityQuery);
      if (!querySnapshot.empty) {
        const latestDoc = querySnapshot.docs[0];
        const currentStatus = latestDoc.data().availability;
        const toggledStatus =
          currentStatus === "Available" ? "Unavailable" : "Available";
        // Update the document with the toggled availability.
        await updateDoc(latestDoc.ref, {
          availability: toggledStatus,
          toggleTime: serverTimestamp(),
        });
        console.log(`Availability toggled to ${toggledStatus}`);
        setCurrentUserAvailability(toggledStatus);
        // Update the availability map for the current user.
        setAvailabilityMap((prev) => ({
          ...prev,
          [currentUser.uid]: toggledStatus,
        }));
      } else {
        // No active document exists; create a new record.
        await addDoc(collection(firestore, "facultyAvailability"), {
          userId: currentUser.uid,
          availability: "Available",
          creationTime: serverTimestamp(),
        });
        console.log("Created new availability document with Available status");
        setCurrentUserAvailability("Available");
        setAvailabilityMap((prev) => ({
          ...prev,
          [currentUser.uid]: "Available",
        }));
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  // Filtering logic.
  let filteredFaculty = facultyData;

  // For a Permanent view, filter by the active availability status.
  if (facultyTypeParam === "Permanent") {
    filteredFaculty = filteredFaculty.filter((faculty) => {
      // Always show the current user so they can toggle their status.
      if (faculty.uid === currentUser?.uid) {
        return true;
      }
      // Get the active status from the availabilityMap; default to "Unavailable" if not found.
      const status = availabilityMap[faculty.uid] || "Unavailable";
      return selectedStatus === "Available"
        ? status === "Available"
        : status !== "Available";
    });
  }

  // Filter by search query.
  filteredFaculty = filteredFaculty.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by department (if selected).
  filteredFaculty = filteredFaculty.filter((faculty) =>
    deptValue ? faculty.department === deptValue : true
  );

  // Render each faculty item.
  const renderItem = ({ item }) => {
    // Determine active status: use current user's value if it's them; otherwise, use the availabilityMap.
    const status =
      item.uid === currentUser?.uid
        ? currentUserAvailability
        : availabilityMap[item.uid] || "Unavailable";

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => {
          // For your flow: when an item is pressed, navigate to AttendanceRecord with that faculty's uid.
          navigation.navigate("AttendanceRecord", { uid: item.uid });
        }}
      >
        <Text style={styles.name}>Name: {item.name}</Text>
        <Text>Registration Number: {item.registrationNumber}</Text>
        <Text>Department: {item.department}</Text>
        <Text>Faculty Type: {item.facultyType}</Text>
        {facultyTypeParam === "Permanent" && (
          <View style={styles.availabilityContainer}>
            <Text
              style={[
                styles.availability,
                { color: status === "Available" ? "green" : "red" },
              ]}
            >
              {status}
            </Text>
            {item.uid === currentUser?.uid && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleAvailability}
              >
                <Text style={styles.toggleButtonText}>Toggle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faculty List</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search Faculty..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
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
      {facultyTypeParam === "Permanent" && (
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === "Available" && styles.selectedButton,
            ]}
            onPress={() => setSelectedStatus("Available")}
          >
            <Text
              style={[
                styles.statusText,
                selectedStatus === "Available" && styles.selectedText,
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === "Not Available" && styles.selectedButton,
            ]}
            onPress={() => setSelectedStatus("Not Available")}
          >
            <Text
              style={[
                styles.statusText,
                selectedStatus === "Not Available" && styles.selectedText,
              ]}
            >
              Not Available
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filteredFaculty}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No faculty found.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#08422d",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: "#08422d",
  },
  statusText: {
    fontSize: 16,
    color: "#08422d",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  list: {
    paddingVertical: 10,
  },
  listItem: {
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  name: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
    color: "#08422d",
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  availability: {
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#08422d",
    borderRadius: 5,
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
  },
});

export default FacultyList;
