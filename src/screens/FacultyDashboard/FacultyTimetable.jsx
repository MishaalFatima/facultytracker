import React, { useState, useEffect, useCallback } from "react";
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

const FacultyTimetable = ({ navigation }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setTimetable(timetableData); // Even if empty, update state to stop loading
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

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.timetableItem}>
        <View>
          <Text style={styles.timetableText}>
            {item.day} - {item.course} ({item.startTime} - {item.endTime})
          </Text>
          <Text style={styles.timetableText}>Room: {item.roomNumber}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("QRScannerScreen", { timetable: item })
          }
        >
          <Icon
            name="camera"
            size={24}
            color="#08422d"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timetable.length > 0 ? (
        <FlatList
          data={timetable}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noDataText}>No timetable available.</Text>
      )}
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
  noDataText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
});

export default FacultyTimetable;
