import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Firebase configuration
import { useNavigation } from "@react-navigation/native"; // Navigation hook
import LoadingScreen from "../LoadingScreen";

const FacultyList = () => {
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        // Query to fetch faculty members with role "Faculty"
        const facultyQuery = query(collection(firestore, "users"), where("role", "==", "Faculty"));
        const snapshot = await getDocs(facultyQuery);
        
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || "N/A", // Store UID for navigation
          name: doc.data().name || "N/A",
          registrationNumber: doc.data().registrationNumber || "N/A",
          department: doc.data().department || "N/A",
        }));
        
        setFacultyData(data);
      } catch (error) {
        console.log("Error fetching faculty data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty(); // Fetch data on component mount
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate("AvailabilityReport", { uid: item.uid })} // Navigate to Availability Report
    >
      <Text style={styles.name}>Name: {item.name}</Text>
      <Text>Registration Number: {item.registrationNumber}</Text>
      <Text>Department: {item.department}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LoadingScreen/>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faculty List</Text>
      <FlatList
        data={facultyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FacultyList;
