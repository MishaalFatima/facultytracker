import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert 
} from "react-native";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure correct path
import { useRoute } from "@react-navigation/native";

const CourseList = () => {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [courses, setCourses] = useState([]);
  const route = useRoute();
  const { programId } = route.params; // Get programId from navigation params

  // Function to fetch courses from Firestore
  const fetchCourses = async () => {
    try {
      const q = query(collection(firestore, "courses"), where("programId", "==", programId));
      const querySnapshot = await getDocs(q);
      const courseList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Fetch courses when component loads
  useEffect(() => {
    fetchCourses();
  }, []);

  // Function to handle adding a course
  const handleAddCourse = async () => {
    if (!courseName.trim() || !courseCode.trim()) {
      Alert.alert("Error", "Both Course Name and Course Code are required!");
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "courses"), {
        name: courseName,
        code: courseCode,
        programId, // Associate course with program
        createdAt: new Date(),
      });

      // Update the local list immediately
      setCourses([...courses, { id: docRef.id, name: courseName, code: courseCode }]);

      Alert.alert("Success", "Course added successfully!");
      setCourseName(""); // Clear input field
      setCourseCode(""); // Clear input field
      setShowInput(false); // Hide input field
    } catch (error) {
      console.error("Error adding course:", error);
      Alert.alert("Error", "Failed to add course. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses</Text>

      {/* Add Course Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowInput(true)}
      >
        <Text style={styles.addButtonText}>+ Add Course</Text>
      </TouchableOpacity>

      {/* Input Fields for Course Name and Course Code */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Course Name"
            value={courseName}
            onChangeText={setCourseName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Course Code"
            value={courseCode}
            onChangeText={setCourseCode}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddCourse}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Course List */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseItem}>
            <Text style={styles.courseText}>
              {item.name} ({item.code})
            </Text>
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  courseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  courseText: {
    fontSize: 18,
  },
});

export default CourseList; 