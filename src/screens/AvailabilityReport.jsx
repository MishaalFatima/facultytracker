import React, { useState, useEffect } from "react"; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
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
  const { uid } = route.params; // UID passed from FacultyList or direct navigation
  const [data, setData] = useState([]); // Combined availability data
  const [loading, setLoading] = useState(true);
  const [isPermanent, setIsPermanent] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching availability for UID:", uid);

        // Fetch user details first to determine faculty type
        const userDocRef = doc(firestore, "users", uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Check if the faculty member is permanent
        if (userData.FacultyType !== "Permanent") {
          setIsPermanent(false);
          setLoading(false);
          return;
        }

        // Query to fetch availability data for this faculty member
        const availabilityQuery = query(
          collection(firestore, "facultyAvailability"),
          where("userId", "==", uid)
        );
        const availabilitySnapshot = await getDocs(availabilityQuery);

        const availabilityData = availabilitySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Merge availability and user data
        const mergedData = availabilityData.map((item) => ({
          ...item,
          userName: userData.name || "N/A",
          registrationNumber: userData.registrationNumber || "N/A",
          department: userData.department || "N/A",
          from: item.creationTime?.toDate ? item.creationTime.toDate() : null,
          to: item.endTime?.toDate ? item.endTime.toDate() : null,
          location: item.location || null,
        }));

        // Sort data by the 'from' field (latest first)
        const sortedData = mergedData.sort((a, b) => {
          if (a.from && b.from) {
            return new Date(b.from) - new Date(a.from);
          }
          return 0;
        });

        setData(sortedData);
      } catch (error) {
        console.log("Error fetching data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
    );
  }

  // If not permanent, show an appropriate message
  if (!isPermanent) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>
          Availability report is only available for permanent faculty.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
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
