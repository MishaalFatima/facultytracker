import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "./firebaseConfig";

const AvailabilityReport = ({ route }) => {
  const { uid } = route.params; // Receive UID from navigation
  const [data, setData] = useState([]); // State to hold the combined data
  const [loading, setLoading] = useState(true); // State to handle loading

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching availability for UID:", uid); // Log UID to check if it's correct

        // Query to fetch faculty availability data for the specific UID (based on userId in the collection)
        const availabilityQuery = query(
          collection(firestore, "facultyAvailability"),
          where("userId", "==", uid) // Use "userId" instead of "uid"
        );
        const availabilitySnapshot = await getDocs(availabilityQuery);

        const availabilityData = availabilitySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch user details using UID
        const userDoc = await getDoc(doc(firestore, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Merge availability and user data
        const mergedData = availabilityData.map((item) => ({
          ...item,
          userName: userData.name || "N/A",
          registrationNumber: userData.registrationNumber || "N/A",
          department: userData.department || "N/A",
          from: item.creationTime?.toDate() ? item.creationTime.toDate() : null,
          to: item.endTime?.toDate() ? item.endTime.toDate() : null,
          location: item.location || null, // Assuming location is stored in Firestore
        }));

        // Sort data by the `from` field in descending order (latest first)
        const sortedData = mergedData.sort((a, b) => {
          if (a.from && b.from) {
            return new Date(b.from) - new Date(a.from);
          }
          return 0; // Fallback if `from` is missing
        });

        setData(sortedData); // Update the state with the sorted data
      } catch (error) {
        console.log("Error fetching data from Firestore:", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchData(); // Fetch data on component mount
  }, [uid]); // Only re-run if the UID changes

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
    );
  }

  return (
    <ScrollView>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.row}>
          <Text style={styles.headerCell}>#</Text>
          <Text style={styles.headerCell}>Availability</Text>
          <Text style={styles.headerCell}>From</Text>
          <Text style={styles.headerCell}>To</Text>
        </View>

        {/* Table Data */}
        {data.length > 0 ? (
          data.map((item, index) => (
            <View style={styles.row} key={item.id}>
              <Text style={styles.cell}>{index + 1}</Text>
              <Text style={styles.cell}>{item.availability || "N/A"}</Text>
              <Text style={styles.cell}>
                {item.from
                  ? new Date(item.from).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric", 
                      hour12: true,
                    })
                  : "N/A"}
              </Text>
              <Text style={styles.cell}>
                {item.to
                  ? new Date(item.to).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric", 
                      hour12: true,
                    })
                  : "N/A"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>
            No availability data found for this faculty member.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: "100%",
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerCell: {
    flex: 1,
    padding: 10,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    textAlign: "center",
  },
  cell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
  mapContainer: {
    height: 300,
    width: Dimensions.get("window").width,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default AvailabilityReport;
