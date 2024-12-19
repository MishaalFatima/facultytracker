import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { firestore } from "./firebaseConfig";

const Availability = () => {
  var n=0;
  const [data, setData] = useState([]); // State to hold the combined data
  const [loading, setLoading] = useState(true); // State to handle loading

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from facultyAvailability collection
        const availabilitySnapshot = await getDocs(collection(firestore, "facultyAvailability"));
        const availabilityData = availabilitySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Fetch and merge user data
        const mergedData = await Promise.all(
          availabilityData.map(async (item) => {
            const userDoc = await getDoc(doc(firestore, "users", item.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            return {
              ...item,
              userName: userData.name || "N/A",
              registrationNumber: userData.registrationNumber || "N/A",
              department: userData.department || "N/A",
              timestamp: item.timestamp?.toDate ? item.timestamp.toDate() : null, // Convert Firestore.Timestamp to Date
            };
          })
        );

        setData(mergedData);
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />;
  }

  return (
    <ScrollView horizontal>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.row}>
          <Text style={styles.headerCell}>#</Text>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.headerCell}>Registration Number</Text>
          <Text style={styles.headerCell}>Department</Text>
          <Text style={styles.headerCell}>Availability</Text>
          <Text style={styles.headerCell}>Timestamp</Text>
        </View>

        {/* Table Data */}
        {data.map((item) => (
          <View style={styles.row} key={item.id}>
            <Text style={styles.cell}>{n+1}</Text>
            <Text style={styles.cell}>{item.userName || "N/A"}</Text>
            <Text style={styles.cell}>{item.registrationNumber || "N/A"}</Text>
            <Text style={styles.cell}>{item.department || "N/A"}</Text>
            <Text style={styles.cell}>{item.availability || "N/A"}</Text>
            <Text style={styles.cell}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A"}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: "100%",
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
});

export default Availability;
