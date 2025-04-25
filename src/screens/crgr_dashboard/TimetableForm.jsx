import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { firestore } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

const TimetableForm = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [semester, setSemester] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [course, setCourse] = useState("");
  const [day, setDay] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [shift, setShift] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time slots with AM/PM labels
  const timeSlots = {
    Morning: {
      start: ["8:30 AM", "10:00 AM", "11:30 AM", "1:00 PM"],
      end: ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM"],
    },
    Evening: {
      start: ["2:30 PM", "4:00 PM", "5:30 PM", "7:00 PM"],
      end: ["4:00 PM", "5:30 PM", "7:00 PM", "8:30 PM"],
    },
  };

  // Fetch faculty list
  useEffect(() => {
    const fetchFacultyNames = async () => {
      try {
        const facultyQuery = query(
          collection(firestore, "users"),
          where("role", "==", "Faculty")
        );
        const facultySnapshot = await getDocs(facultyQuery);
        const facultyData = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
        }));
        setFacultyList(facultyData);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch faculty names.");
        console.error("Error fetching faculty:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyNames();
  }, []);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentQuery = collection(firestore, "departments");
        const departmentSnapshot = await getDocs(departmentQuery);
        const departmentData = departmentSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setDepartments(departmentData);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch departments.");
        console.error("Error fetching departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch programs based on selected department
  const handleDepartmentChange = async (selectedDepartmentId) => {
    setSelectedDepartment(selectedDepartmentId);
    setPrograms([]);
    setLoadingPrograms(true);
    try {
      const programQuery = query(
        collection(firestore, "programs"),
        where("departmentId", "==", selectedDepartmentId)
      );
      const programSnapshot = await getDocs(programQuery);
      const programData = programSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setPrograms(programData || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch programs.");
      console.error("Error fetching programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Fetch courses based on selected program; include both name and code
  const handleProgramChange = async (selectedProgramId) => {
    setCourses([]);
    setSelectedProgram(selectedProgramId);
    setLoadingCourses(true);
    try {
      const courseQuery = query(
        collection(firestore, "courses"),
        where("programId", "==", selectedProgramId)
      );
      const courseSnapshot = await getDocs(courseQuery);
      const courseData = courseSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name, // Course name
        code: doc.data().code, // Course code (e.g., "MATH4137")
      }));
      setCourses(courseData);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch courses.");
      console.error("Error fetching courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsQuery = collection(firestore, "rooms");
        const roomsSnapshot = await getDocs(roomsQuery);
        const roomData = roomsSnapshot.docs.map((doc) => ({
          id: doc.id,
          room_no: doc.data().room_no || "N/A",
        }));
        setRoomNumbers(roomData || []);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch rooms.");
        console.error("Error fetching rooms:", error);
        setRoomNumbers([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  // Save timetable data
  const handleSubmit = async () => {
    if (
      !selectedDepartment ||
      !selectedProgram ||
      !semester ||
      !startTime ||
      !endTime ||
      !course ||
      !day ||
      !facultyName ||
      !selectedRoom ||
      !shift
    ) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    try {
      const timetableData = {
        department: selectedDepartment,
        program: selectedProgram,
        semester,
        startTime,
        endTime,
        course, // Only the course code is saved here
        day,
        facultyId: facultyName,
        roomNumber: selectedRoom,
        shift,
      };
      await addDoc(collection(firestore, "timetables"), timetableData);
      Alert.alert("Timetable Saved", "Timetable has been saved.");
    } catch (error) {
      Alert.alert("Error", "There was an error saving the timetable.");
      console.error("Error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.formTitle}>Timetable Form</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Department</Text>
          {loadingDepartments ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Picker
              selectedValue={selectedDepartment}
              style={styles.picker}
              onValueChange={(itemValue) => handleDepartmentChange(itemValue)}
            >
              <Picker.Item label="Select Department" value="" />
              {departments.map((dept) => (
                <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Program</Text>
          {loadingPrograms ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Picker
              selectedValue={selectedProgram}
              style={styles.picker}
              onValueChange={(itemValue) => handleProgramChange(itemValue)}
            >
              <Picker.Item label="Select Program" value="" />
              {programs.map((prog) => (
                <Picker.Item key={prog.id} label={prog.name} value={prog.id} />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Course</Text>
          {loadingCourses ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Picker
              selectedValue={course}
              style={styles.picker}
              onValueChange={(itemValue) => setCourse(itemValue)}
            >
              <Picker.Item label="Select Course" value="" />
              {courses.map((courseItem) => (
                <Picker.Item
                  key={courseItem.id}
                  label={`${courseItem.name} (${courseItem.code})`} // Display name and code
                  value={courseItem.code} // Save only the course code
                />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Semester</Text>
          <Picker
            selectedValue={semester}
            style={styles.picker}
            onValueChange={(itemValue) => setSemester(itemValue)}
          >
            <Picker.Item label="Select Semester" value="" />
            {[...Array(8).keys()].map((num) => (
              <Picker.Item
                key={num + 1}
                label={`Semester ${num + 1}`}
                value={(num + 1).toString()}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Day</Text>
          <Picker
            selectedValue={day}
            style={styles.picker}
            onValueChange={(itemValue) => setDay(itemValue)}
          >
            <Picker.Item label="Select Day" value="" />
            <Picker.Item label="Monday" value="Monday" />
            <Picker.Item label="Tuesday" value="Tuesday" />
            <Picker.Item label="Wednesday" value="Wednesday" />
            <Picker.Item label="Thursday" value="Thursday" />
            <Picker.Item label="Friday" value="Friday" />
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Shift</Text>
          <Picker
            selectedValue={shift}
            style={styles.picker}
            onValueChange={(itemValue) => setShift(itemValue)}
          >
            <Picker.Item label="Select Shift" value="" />
            <Picker.Item label="Morning" value="Morning" />
            <Picker.Item label="Evening" value="Evening" />
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Start Time</Text>
          <Picker
            selectedValue={startTime}
            style={styles.picker}
            onValueChange={(itemValue) => setStartTime(itemValue)}
          >
            <Picker.Item label="Select Start Time" value="" />
            {shift &&
              timeSlots[shift].start.map((time) => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>End Time</Text>
          <Picker
            selectedValue={endTime}
            style={styles.picker}
            onValueChange={(itemValue) => setEndTime(itemValue)}
          >
            <Picker.Item label="Select End Time" value="" />
            {shift &&
              timeSlots[shift].end.map((time) => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Faculty</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Picker
              selectedValue={facultyName}
              style={styles.picker}
              onValueChange={(itemValue) => setFacultyName(itemValue)}
            >
              <Picker.Item label="Select Faculty" value="" />
              {facultyList.map((faculty) => (
                <Picker.Item
                  key={faculty.id}
                  label={faculty.name}
                  value={faculty.id}
                />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Room Number</Text>
          {loadingRooms ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Picker
              selectedValue={selectedRoom}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedRoom(itemValue)}
            >
              <Picker.Item label="Select Room" value="" />
              {Array.isArray(roomNumbers) &&
                roomNumbers.map((room) => (
                  <Picker.Item
                    key={room.id}
                    label={room.room_no.toString()}
                    value={room.room_no.toString()}
                  />
                ))}
            </Picker>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Timetable</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    padding: 20,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#08422d",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    backgroundColor: "rgb(199, 179, 23)",
    color: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#08422d",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
});

export default TimetableForm;
