import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const UpdateAttendance = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { record } = route.params;

  const [course, setCourse] = useState(record.course || "");
  const [day, setDay] = useState(record.day || "");
  const [startTime, setStartTime] = useState(record.startTime || "");
  const [endTime, setEndTime] = useState(record.endTime || "");
  const [status, setStatus] = useState(record.status || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!course || !day || !startTime || !endTime || !status) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const attendanceRef = doc(firestore, "attendance", record.id);
      await updateDoc(attendanceRef, {
        course,
        day,
        startTime,
        endTime,
        status,
      });

      Alert.alert("Success", "Attendance record updated!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating attendance:", error);
      Alert.alert("Error", "Failed to update attendance.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Course:</Text>
      <TextInput
        style={styles.input}
        value={course}
        onChangeText={setCourse}
      />

      <Text style={styles.label}>Day:</Text>
      <TextInput
        style={styles.input}
        value={day}
        onChangeText={setDay}
      />

      <Text style={styles.label}>Start Time:</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
      />

      <Text style={styles.label}>End Time:</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={setEndTime}
      />

      <Text style={styles.label}>Status:</Text>
      <TextInput
        style={styles.input}
        value={status}
        onChangeText={setStatus}
      />

      <Button title="Update Attendance" onPress={handleUpdate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default UpdateAttendance;