import React, { useState, useEffect } from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { firestore } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const EditTimetable = ({ visible, record, onClose, onSave }) => {
  // ─────────────── Local state ───────────────
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [day, setDay] = useState("");
  const [shift, setShift] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  // ───────── Time slots ─────────
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

  // ─────────── Lookup lists + loading flags ───────────
  const [departments, setDepartments] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  const [programs, setPrograms] = useState([]);
  const [loadingProgs, setLoadingProgs] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [facultyList, setFacultyList] = useState([]);
  const [loadingFac, setLoadingFac] = useState(true);

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // ─────────────── Fetch static lookups on mount ───────────────
  useEffect(() => {
    getDocs(collection(firestore, "departments"))
      .then(snap => setDepartments(
        snap.docs.map(d => ({ id: d.id, name: d.data().name }))
      ))
      .catch(() => Alert.alert("Error", "Could not load departments."))
      .finally(() => setLoadingDeps(false));

    getDocs(query(collection(firestore, "users"), where("role", "==", "Faculty")))
      .then(snap => setFacultyList(
        snap.docs.map(d => ({ id: d.id, name: d.data().name || "Unknown" }))
      ))
      .catch(() => Alert.alert("Error", "Could not load faculty."))
      .finally(() => setLoadingFac(false));

    getDocs(collection(firestore, "rooms"))
      .then(snap => setRooms(
        snap.docs.map(d => ({ id: d.id, room_no: d.data().room_no || "—" }))
      ))
      .catch(() => Alert.alert("Error", "Could not load rooms."))
      .finally(() => setLoadingRooms(false));
  }, []);

  // ───────── Fetch programs when department changes ─────────
  useEffect(() => {
    if (!departmentId) {
      setPrograms([]);
      setProgramId("");
      return;
    }
    setLoadingProgs(true);
    getDocs(
      query(collection(firestore, "programs"), where("departmentId", "==", departmentId))
    )
      .then(snap => setPrograms(
        snap.docs.map(d => ({ id: d.id, name: d.data().name }))
      ))
      .catch(() => Alert.alert("Error", "Could not load programs."))
      .finally(() => setLoadingProgs(false));
  }, [departmentId]);

  // ───────── Fetch courses when program changes ─────────
  useEffect(() => {
    if (!programId) {
      setCourses([]);
      setCourseCode("");
      return;
    }
    setLoadingCourses(true);
    getDocs(
      query(collection(firestore, "courses"), where("programId", "==", programId))
    )
      .then(snap => setCourses(
        snap.docs.map(d => ({
          id: d.id,
          label: `${d.data().name} (${d.data().code})`,
          value: d.data().code
        }))
      ))
      .catch(() => Alert.alert("Error", "Could not load courses."))
      .finally(() => setLoadingCourses(false));
  }, [programId]);

  // ───────── Sync record into state ─────────
  useEffect(() => {
    if (!record) return;
    setDepartmentId(record.department || "");
    setProgramId(record.program || "");
    setCourseCode(record.course || "");
    setSemester(record.semester?.toString() || "");
    setDay(record.day || "");
    setShift(record.shift || "");
    setStartTime(record.startTime || "");
    setEndTime(record.endTime || "");
    setFacultyId(record.facultyId || "");
    setRoomNumber(record.roomNumber || "");
  }, [record]);

  // ───────── Save handler ─────────
  const handleSave = () => {
    onSave({
      department: departmentId,
      program: programId,
      course: courseCode,
      semester,
      day,
      shift,
      startTime,
      endTime,
      facultyId,
      roomNumber,
    });
    onClose();
  };

  // ───────── Static pick‐lists ─────────
  const semList = Array.from({ length: 8 }, (_, i) => ({ label: `Semester ${i+1}`, value: `${i+1}` }));
  const dayList = ["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => ({ label: d, value: d }));
  const shiftList = [{ label: "Morning", value: "Morning" }, { label: "Evening", value: "Evening" }];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{
              ...styles.container,
              flexGrow: 1,
              paddingBottom: 32
            }}
          >
            <Text style={styles.title}>Edit Timetable</Text>

            {/* Department */}
            <Text style={styles.label}>Department</Text>
            {loadingDeps
              ? <ActivityIndicator />
              : <Picker selectedValue={departmentId} onValueChange={setDepartmentId} style={styles.picker}>
                  <Picker.Item label="Select…" value="" />
                  {departments.map(d => <Picker.Item key={d.id} label={d.name} value={d.id} />)}
                </Picker>
            }

            {/* Program */}
            <Text style={styles.label}>Program</Text>
            {loadingProgs
              ? <ActivityIndicator />
              : <Picker selectedValue={programId} onValueChange={setProgramId} style={styles.picker}>
                  <Picker.Item label="Select…" value="" />
                  {programs.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
                </Picker>
            }

            {/* Course */}
            <Text style={styles.label}>Course</Text>
            {loadingCourses
              ? <ActivityIndicator />
              : <Picker selectedValue={courseCode} onValueChange={setCourseCode} style={styles.picker}>
                  <Picker.Item label="Select…" value="" />
                  {courses.map(c => <Picker.Item key={c.id} label={c.label} value={c.value} />)}
                </Picker>
            }

            {/* Semester */}
            <Text style={styles.label}>Semester</Text>
            <Picker selectedValue={semester} onValueChange={setSemester} style={styles.picker}>
              <Picker.Item label="Select…" value="" />
              {semList.map(s => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
            </Picker>

            {/* Day */}
            <Text style={styles.label}>Day</Text>
            <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
              <Picker.Item label="Select…" value="" />
              {dayList.map(d => <Picker.Item key={d.value} label={d.label} value={d.value} />)}
            </Picker>

            {/* Shift */}
            <Text style={styles.label}>Shift</Text>
            <Picker selectedValue={shift} onValueChange={setShift} style={styles.picker}>
              <Picker.Item label="Select…" value="" />
              {shiftList.map(s => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
            </Picker>

            {/* Start Time */}
            <Text style={styles.label}>Start Time</Text>
            <Picker selectedValue={startTime} onValueChange={setStartTime} style={styles.picker}>
              <Picker.Item label="Select Start Time" value="" />
              {shift && timeSlots[shift].start.map(time => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
            </Picker>

            {/* End Time */}
            <Text style={styles.label}>End Time</Text>
            <Picker selectedValue={endTime} onValueChange={setEndTime} style={styles.picker}>
              <Picker.Item label="Select End Time" value="" />
              {shift && timeSlots[shift].end.map(time => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
            </Picker>

            {/* Faculty */}
            <Text style={styles.label}>Faculty</Text>
            {loadingFac
              ? <ActivityIndicator />
              : <Picker selectedValue={facultyId} onValueChange={setFacultyId} style={styles.picker}>
                  <Picker.Item label="Select…" value="" />
                  {facultyList.map(f => <Picker.Item key={f.id} label={f.name} value={f.id} />)}
                </Picker>
            }

            {/* Room */}
            <Text style={styles.label}>Room</Text>
            {loadingRooms
              ? <ActivityIndicator />
              : <Picker selectedValue={roomNumber} onValueChange={setRoomNumber} style={styles.picker}>
                  <Picker.Item label="Select…" value="" />
                  {rooms.map(r => <Picker.Item key={r.id} label={r.room_no} value={r.room_no} />)}
                </Picker>
            }
          </ScrollView>

          {/* Actions Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  container: { backgroundColor: "#fff", margin: 20, borderRadius: 8, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  label: { marginTop: 12, marginBottom: 4, fontWeight: "600" },
  picker: { height: 44, width: "100%", borderWidth: 1, borderColor: "#ccc" },
  actions: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, backgroundColor: "#fff" },
  saveBtn: { backgroundColor: "#08422d", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4 },
  cancelBtn: { backgroundColor: "gray", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4 },
  btnText: { color: "#fff", fontWeight: "600" },
});

export default EditTimetable;
