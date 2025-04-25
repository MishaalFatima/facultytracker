import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth, firestore } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Icon from "react-native-vector-icons/Feather";

// Helper function to convert a time string into a Date object for today.
// Supports both 12-hour (with AM/PM) and 24-hour formats.
const getTodayTime = (timeStr) => {
  const now = new Date();
  if (timeStr.toUpperCase().includes("AM") || timeStr.toUpperCase().includes("PM")) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  } else {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  }
};

const FacultyTimetable = ({ navigation }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [enabledTimeslot, setEnabledTimeslot] = useState(null);

  // Update current time every minute (or every second for testing).
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Change to 1000 for testing if needed
    return () => clearInterval(timer);
  }, []);

  // Fetch timetable from Firestore for the current faculty.
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const timetableQuery = query(
            collection(firestore, "timetables"),
            where("facultyId", "==", user.uid)
          );
          const querySnapshot = await getDocs(timetableQuery);
          const timetableData = querySnapshot.docs.map((doc) => doc.data());

          if (timetableData.length === 0) {
            Alert.alert("No Timetable", "No timetable found for this faculty.");
          }
          setTimetable(timetableData);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch timetable.");
        console.error("Error fetching timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  // Determine if any class scheduled for today is currently active.
  useEffect(() => {
    const todayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
    const active = timetable.find((item) => {
      if (item.day !== todayName) return false;
      const start = getTodayTime(item.startTime);
      const end = getTodayTime(item.endTime);
      return currentTime >= start && currentTime <= end;
    });
    setEnabledTimeslot(active || null);
  }, [currentTime, timetable]);

  const renderItem = ({ item }) => {
    const todayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
    const isToday = item.day === todayName;
    const classStartTime = getTodayTime(item.startTime);
    const classEndTime = getTodayTime(item.endTime);

    // Disable the camera if it's not today or the current time is outside the class window.
    const disableCamera = !isToday || currentTime < classStartTime || currentTime > classEndTime;

    return (
      <View style={styles.timetableItem}>
        <View>
          <Text style={styles.timetableText}>
            {item.day} - {item.course} ({item.startTime} - {item.endTime})
          </Text>
          <Text style={styles.timetableText}>Room: {item.roomNumber}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!disableCamera) {
              navigation.navigate("QRScannerScreen", { timetable: item });
            }
          }}
          disabled={disableCamera}
        >
          <Icon
            name="camera"
            size={24}
            color={disableCamera ? "#ccc" : "#08422d"}
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  // If an enabled timeslot exists, reorder the timetable array so it comes first.
  let sortedTimetable = timetable;
  if (enabledTimeslot) {
    sortedTimetable = [
      enabledTimeslot,
      ...timetable.filter(
        (item) =>
          // Compare based on a unique combination of fields.
          !(item.day === enabledTimeslot.day &&
            item.course === enabledTimeslot.course &&
            item.startTime === enabledTimeslot.startTime &&
            item.endTime === enabledTimeslot.endTime)
      ),
    ];
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTimetable}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timetableItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 10,
  },
  cameraIcon: {
    marginLeft: 10,
  },
  timetableText: {
    fontSize: 16,
    color: "#08422d",
  },
});

export default FacultyTimetable;
