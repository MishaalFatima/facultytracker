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
  const [course, setCourse] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [semester, setSemester] = useState("");
  const [day, setDay] = useState("");

  const [shift, setShift] = useState("");
  const timeSlots = {
    Morning: {
      start: ["8:30 AM", "10:00 AM", "11:30 AM", "1:00 PM"],
      end:   ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM"],
    },
    Evening: {
      start: ["2:30 PM", "4:00 PM", "5:30 PM", "7:00 PM"],
      end:   ["4:00 PM", "5:30 PM", "7:00 PM", "8:30 PM"],
    },
  };

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [facultyList, setFacultyList] = useState([]);
  const [facultyName, setFacultyName] = useState("");
  const [loadingFaculty, setLoadingFaculty] = useState(true);

  const [roomNumbers, setRoomNumbers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Fetch faculty
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, "users"), where("role", "==", "Faculty"));
        const snap = await getDocs(q);
        setFacultyList(snap.docs.map(d => ({ id: d.id, name: d.data().name || "Unknown" })));
      } catch (e) {
        Alert.alert("Error", "Failed to fetch faculty.");
        console.error(e);
      } finally {
        setLoadingFaculty(false);
      }
    })();
  }, []);

  // Fetch departments
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "departments"));
        setDepartments(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (e) {
        Alert.alert("Error", "Failed to fetch departments.");
        console.error(e);
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  // Fetch programs when department changes
  const handleDepartmentChange = async deptId => {
    setSelectedDepartment(deptId);
    setLoadingPrograms(true);
    try {
      const q = query(collection(firestore, "programs"), where("departmentId", "==", deptId));
      const snap = await getDocs(q);
      setPrograms(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    } catch (e) {
      Alert.alert("Error", "Failed to fetch programs.");
      console.error(e);
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Fetch courses when program changes
  const handleProgramChange = async progId => {
    setSelectedProgram(progId);
    setLoadingCourses(true);
    try {
      const q = query(collection(firestore, "courses"), where("programId", "==", progId));
      const snap = await getDocs(q);
      setCourses(snap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        code: d.data().code,
      })));
    } catch (e) {
      Alert.alert("Error", "Failed to fetch courses.");
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch rooms
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "rooms"));
        setRoomNumbers(snap.docs.map(d => ({ id: d.id, room_no: d.data().room_no || "N/A" })));
      } catch (e) {
        Alert.alert("Error", "Failed to fetch rooms.");
        console.error(e);
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  // Submit with duplication check
  const handleSubmit = async () => {
    if (!selectedDepartment || !selectedProgram || !semester || !day ||
        !shift || !startTime || !endTime || !course ||
        !facultyName || !selectedRoom) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    // Duplication check
    try {
      const dupQ = query(
        collection(firestore, "timetables"),
        where("day", "==", day),
        where("shift", "==", shift),
        where("startTime", "==", startTime),
        where("endTime", "==", endTime),
        where("roomNumber", "==", selectedRoom)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        Alert.alert(
          "Booking Conflict",
          "This time slot and room is already booked. Please choose a different time or room."
        );
        return;
      }
    } catch (e) {
      console.error("Duplication check failed:", e);
      Alert.alert("Error", "Could not verify booking availability.");
      return;
    }

    // Add new timetable entry
    try {
      await addDoc(collection(firestore, "timetables"), {
        department: selectedDepartment,
        program: selectedProgram,
        semester,
        day,
        shift,
        startTime,
        endTime,
        course,
        facultyId: facultyName,
        roomNumber: selectedRoom,
      });

      Alert.alert("Timetable Saved", "Timetable has been saved.", [
        { text: "OK", onPress: () => {
            setSelectedDepartment("");
            setSelectedProgram("");
            setSemester("");
            setDay("");
            setShift("");
            setStartTime("");
            setEndTime("");
            setCourse("");
            setFacultyName("");
            setSelectedRoom("");
          }
        }
      ]);
    } catch (e) {
      Alert.alert("Error", "There was an error saving the timetable.");
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.formTitle}>Timetable Form</Text>

        {/* Department Picker */}
        <View style={styles.card}>
          {loadingDepartments
            ? <ActivityIndicator size="small" color="#fff" />
            : <Picker
                selectedValue={selectedDepartment}
                onValueChange={handleDepartmentChange}
                style={styles.picker}
              >
                <Picker.Item label="Select Department" value="" />
                {departments.map(d => (
                  <Picker.Item key={d.id} label={d.name} value={d.id} />
                ))}
              </Picker>
          }
        </View>

        {/* Program Picker */}
        <View style={styles.card}>
          {loadingPrograms
            ? <ActivityIndicator size="small" color="#fff" />
            : <Picker
                selectedValue={selectedProgram}
                onValueChange={handleProgramChange}
                style={styles.picker}
              >
                <Picker.Item label="Select Program" value="" />
                {programs.map(p => (
                  <Picker.Item key={p.id} label={p.name} value={p.id} />
                ))}
              </Picker>
          }
        </View>

        {/* Course Picker */}
        <View style={styles.card}>
          {loadingCourses
            ? <ActivityIndicator size="small" color="#fff" />
            : <Picker
                selectedValue={course}
                onValueChange={setCourse}
                style={styles.picker}
              >
                <Picker.Item label="Select Course" value="" />
                {courses.map(c => (
                  <Picker.Item
                    key={c.id}
                    label={`${c.name} (${c.code})`}
                    value={c.code}
                  />
                ))}
              </Picker>
          }
        </View>

        {/* Semester, Day, Shift, Times, Faculty, Room Pickers */}
        <View style={styles.card}>
          <Picker selectedValue={semester} onValueChange={setSemester} style={styles.picker}>
            <Picker.Item label="Select Semester" value="" />
            {[...Array(8)].map((_, i) => (
              <Picker.Item key={i} label={`Semester ${i+1}`} value={`${i+1}`} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
            <Picker.Item label="Select Day" value="" />
            {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => (
              <Picker.Item key={d} label={d} value={d} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Picker selectedValue={shift} onValueChange={setShift} style={styles.picker}>
            <Picker.Item label="Select Shift" value="" />
            <Picker.Item label="Morning" value="Morning" />
            <Picker.Item label="Evening" value="Evening" />
          </Picker>
        </View>

        <View style={styles.card}>
          <Picker
            selectedValue={startTime}
            onValueChange={setStartTime}
            style={styles.picker}
            enabled={!!shift}
          >
            <Picker.Item label="Select Start Time" value="" />
            {shift && timeSlots[shift].start.map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Picker
            selectedValue={endTime}
            onValueChange={setEndTime}
            style={styles.picker}
            enabled={!!shift}
          >
            <Picker.Item label="Select End Time" value="" />
            {shift && timeSlots[shift].end.map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          {loadingFaculty
            ? <ActivityIndicator size="small" color="#fff" />
            : <Picker
                selectedValue={facultyName}
                onValueChange={setFacultyName}
                style={styles.picker}
              >
                <Picker.Item label="Select Faculty" value="" />
                {facultyList.map(f => (
                  <Picker.Item key={f.id} label={f.name} value={f.id} />
                ))}
              </Picker>
          }
        </View>

        <View style={styles.card}>
          {loadingRooms
            ? <ActivityIndicator size="small" color="#fff" />
            : <Picker
                selectedValue={selectedRoom}
                onValueChange={setSelectedRoom}
                style={styles.picker}
              >
                <Picker.Item label="Select Room" value="" />
                {roomNumbers.map(r => (
                  <Picker.Item key={r.id} label={r.room_no} value={r.room_no} />
                ))}
              </Picker>
          }
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Timetable</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { padding: 20 },
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
  picker: { height: 50, width: "100%" },
  button: {
    backgroundColor: "#08422d",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: { color: "#fff", fontSize: 20, fontWeight: "600" },
});

export default TimetableForm;
