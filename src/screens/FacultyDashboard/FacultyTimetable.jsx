import { useState, useEffect } from "react";
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
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/Feather";

// Helper: Convert "1:00 PM" to a Date object for today
const getTodayTime = (timeStr) => {
  const now = new Date();
  const up = timeStr.toUpperCase();
  if (up.includes("AM") || up.includes("PM")) {
    const [t, mod] = timeStr.split(" ");
    let [h, m] = t.split(":").map(Number);
    if (mod === "PM" && h !== 12) h += 12;
    if (mod === "AM" && h === 12) h = 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  }
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
};

const FacultyTimetable=({ navigation }) =>{
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scannedSlots, setScannedSlots] = useState(new Set());

  // Update current time every minute
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in");
      setLoading(false);
      return;
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const loadTimetable = async () => {
      try {
        const ttQ = query(
          collection(firestore, "timetables"),
          where("facultyId", "==", user.uid)
        );
        const ttSnap = await getDocs(ttQ);
        const allSlots = ttSnap.docs.map((d) => d.data());

        const current = new Date();
        const sorted = allSlots.sort((a, b) => {
          const aIsToday = a.day === today;
          const bIsToday = b.day === today;

          const aStart = getTodayTime(a.startTime);
          const aEnd = getTodayTime(a.endTime);
          const bStart = getTodayTime(b.startTime);
          const bEnd = getTodayTime(b.endTime);

          const aInWindow = aIsToday && current >= aStart && current <= aEnd;
          const bInWindow = bIsToday && current >= bStart && current <= bEnd;

          if (aInWindow && !bInWindow) return -1;
          if (!aInWindow && bInWindow) return 1;

          return aStart - bStart;
        });

        setTimetable(sorted);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load timetable");
      } finally {
        setLoading(false);
      }
    };

    // Listen for real-time attendance updates
    const attQ = query(
      collection(firestore, "attendance"),
      where("facultyId", "==", user.uid),
      where("day", "==", today)
    );

    const unsubscribe = onSnapshot(attQ, (snapshot) => {
      const keys = new Set(
        snapshot.docs.map((d) => {
          const { expectedRoom, startTime, endTime } = d.data();
          return `${expectedRoom}|${startTime}|${endTime}`;
        })
      );
      setScannedSlots(keys);
    });

    loadTimetable();

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    const today = currentTime.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const isToday = item.day === today;
    const start = getTodayTime(item.startTime);
    const end = getTodayTime(item.endTime);
    const inWindow = isToday && currentTime >= start && currentTime <= end;

    const slotKey = `${item.roomNumber}|${item.startTime}|${item.endTime}`;
    const already = scannedSlots.has(slotKey);

    const disable = !(inWindow && !already);

    return (
      <View
        style={[
          styles.item,
          inWindow && !already && styles.currentSlotHighlight,
        ]}
      >
        <View style={styles.info}>
          <Text style={styles.text}>
            {item.day} – {item.course} ({item.startTime}–{item.endTime})
          </Text>
          <Text style={styles.text}>Room: {item.roomNumber}</Text>
          {already && <Text style={styles.scanned}>✓ Already scanned</Text>}
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!disable) {
              navigation.navigate("QRScannerScreen", { timetable: item });
            }
          }}
          disabled={disable}
        >
          <Icon name="camera" size={28} color={disable ? "#ccc" : "#08422d"} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={timetable}
      keyExtractor={(_, i) => i.toString()}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  info: { flex: 1 },
  text: { fontSize: 16, color: "#08422d" },
  scanned: { marginTop: 4, fontSize: 14, color: "green" },
  currentSlotHighlight: {
    backgroundColor: "#e0f7ef",
    borderLeftWidth: 4,
    borderLeftColor: "#08422d",
    paddingLeft: 10,
  },
});

export default FacultyTimetable;