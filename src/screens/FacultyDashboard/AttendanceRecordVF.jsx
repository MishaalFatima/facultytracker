import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Button,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { firestore, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

const AttendanceRecordVF = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // default: 7 days ago
  );
  const [endDate, setEndDate] = useState(new Date()); // default: today
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const fetchAttendanceFromFirestore = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");

        const attendanceRef = collection(firestore, "attendance");
        // Query: by facultyId and timestamp between startDate/endDate
        const q = query(
          attendanceRef,
          where("facultyId", "==", user.uid),
          where("timestamp", ">=", startDate),
          where("timestamp", "<=", endDate),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAttendanceData(records);
      } catch (error) {
        console.log("Error fetching attendance from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceFromFirestore();
  }, [startDate, endDate]);

  const formatTimestamp = (ts) => {
    if (!ts || typeof ts.toDate !== "function") return "Unknown date";
    const dateObj = ts.toDate();
    const dateStr = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
  };

  const renderItem = ({ item }) => {
    const formatted = formatTimestamp(item.timestamp);

    return (
      <View style={styles.recordItem}>
        <View style={styles.left}>
          <Text style={styles.courseText}>{item.course || "—"}</Text>
          <Text style={styles.metaText}>
            Room: {item.expectedRoom || item.roomId}
          </Text>
          <Text style={styles.metaText}>
            {item.day}, {item.startTime}–{item.endTime}
          </Text>
          <Text style={styles.metaText}>{formatted}</Text>
        </View>
        <Text
          style={[
            styles.statusText,
            item.status === "Present" ? styles.present : styles.absent,
          ]}
        >
          {item.status === "Present" ? "✅" : "❌"} {item.status}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Record</Text>

      {/* Date pickers */}
      <View style={styles.dateFilterRow}>
        {/* Start Date */}
        <View style={styles.datePicker}>
          <Button
            title={`From: ${startDate.toDateString()}`}
            onPress={() => setShowStartPicker(true)}
          />
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (date) setStartDate(date);
              }}
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.datePicker}>
          <Button
            title={`To: ${endDate.toDateString()}`}
            onPress={() => setShowEndPicker(true)}
          />
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#08422d" />
      ) : attendanceData.length > 0 ? (
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noDataText}>No attendance records available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    margin: 10,
    elevation: 3,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 10,
    textAlign: "center",
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  datePicker: {
    flex: 1,
    marginHorizontal: 5,
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  left: { flex: 1 },
  courseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#08422d",
  },
  metaText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  present: { color: "green" },
  absent: { color: "red" },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
});

export default AttendanceRecordVF;
