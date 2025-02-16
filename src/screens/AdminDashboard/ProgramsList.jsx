import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert 
} from "react-native";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure correct path
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Using Expo icons

const ProgramsList = () => {
  const [programName, setProgramName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [programs, setPrograms] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { departmentId } = route.params; // Get departmentId from navigation params

  // Function to fetch programs from Firestore
  const fetchPrograms = async () => {
    try {
      const q = query(collection(firestore, "programs"), where("departmentId", "==", departmentId));
      const querySnapshot = await getDocs(q);
      const programList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPrograms(programList);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  // Fetch programs when component loads
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Function to handle adding a program
  const handleAddProgram = async () => {
    if (!programName.trim()) {
      Alert.alert("Error", "Program name cannot be empty!");
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "programs"), {
        name: programName,
        departmentId, // Associate program with department
        createdAt: new Date(),
      });

      // Update the local list immediately
      setPrograms([...programs, { id: docRef.id, name: programName }]);

      Alert.alert("Success", "Program added successfully!");
      setProgramName(""); // Clear input field
      setShowInput(false); // Hide input field
    } catch (error) {
      console.error("Error adding program:", error);
      Alert.alert("Error", "Failed to add program. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programs</Text>

      {/* Add Program Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowInput(true)}
      >
        <Text style={styles.addButtonText}>+ Add Program</Text>
      </TouchableOpacity>

      {/* Input Field for Program Name */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Program Name"
            value={programName}
            onChangeText={setProgramName}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddProgram}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Program List with + Icon */}
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.programItem}>
            <Text style={styles.programText}>{item.name}</Text>
            
            {/* + Icon to Navigate to Courses List */}
            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => navigation.navigate("CourseList", { programId: item.id })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#08422d" />
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
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  programText: {
    fontSize: 18,
  },
  plusButton: {
    padding: 5,
  },
});

export default ProgramsList;
