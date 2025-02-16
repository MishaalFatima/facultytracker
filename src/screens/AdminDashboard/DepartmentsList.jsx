import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert 
} from "react-native";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure the path is correct
import { MaterialIcons } from "@expo/vector-icons"; // Import Icons
import { useNavigation } from "@react-navigation/native";

const DepartmentsList = () => {
  const [departmentName, setDepartmentName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigation = useNavigation(); // Get navigation instance

  // Function to fetch departments from Firestore
  const fetchDepartments = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "departments"));
      const departmentList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDepartments(departmentList);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch departments when component loads
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Function to handle adding a department
  const handleAddDepartment = async () => {
    if (!departmentName.trim()) {
      Alert.alert("Error", "Department name cannot be empty!");
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "departments"), {
        name: departmentName,
        createdAt: new Date(),
      });

      // Update the local list immediately
      setDepartments([...departments, { id: docRef.id, name: departmentName }]);

      Alert.alert("Success", "Department added successfully!");
      setDepartmentName(""); // Clear input field
      setShowInput(false); // Hide input field
    } catch (error) {
      console.error("Error adding department:", error);
      Alert.alert("Error", "Failed to add department. Please try again.");
    }
  };

  // Navigate to ProgramList when clicking "+"
  const handleNavigateToPrograms = (departmentId) => {
    navigation.navigate("ProgramList", { departmentId }); // Pass departmentId
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Departments</Text>

      {/* Add Department Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowInput(true)}
      >
        <Text style={styles.addButtonText}>+ Add Department</Text>
      </TouchableOpacity>

      {/* Input Field for Department Name */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Department Name"
            value={departmentName}
            onChangeText={setDepartmentName}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddDepartment}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Department List from Firestore */}
      <FlatList
        data={departments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.departmentItem}>
            <Text style={styles.departmentText}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleNavigateToPrograms(item.id)}>
              <MaterialIcons name="add-circle-outline" size={24} color="#08422d" style={styles.icon} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#08422d",
  },
  addButton: {
    backgroundColor: "#08422d",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  departmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Push name left, icon right
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  departmentText: {
    fontSize: 18,
  },
  icon: {
    marginLeft: 10,
  },
});

export default DepartmentsList;
