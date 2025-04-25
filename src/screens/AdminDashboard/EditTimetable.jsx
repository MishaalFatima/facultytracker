import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const EditTimetable = ({ visible, record, onClose, onSave }) => {
  const [course, setCourse] = useState(record?.course || "");
  const [startTime, setStartTime] = useState(record?.startTime || "");
  const [endTime, setEndTime] = useState(record?.endTime || "");
  const [roomNumber, setRoomNumber] = useState(record?.roomNumber || "");
  const [shift, setShift] = useState(record?.shift || "");

  // Update local state when record changes
  useEffect(() => {
    setCourse(record?.course || "");
    setStartTime(record?.startTime || "");
    setEndTime(record?.endTime || "");
    setRoomNumber(record?.roomNumber || "");
    setShift(record?.shift || "");
  }, [record]);

  const handleSave = () => {
    onSave({ course, startTime, endTime, roomNumber, shift });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Timetable Entry</Text>
          <TextInput
            style={styles.input}
            placeholder="Course"
            value={course}
            onChangeText={setCourse}
          />
          <TextInput
            style={styles.input}
            placeholder="Start Time"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TextInput
            style={styles.input}
            placeholder="End Time"
            value={endTime}
            onChangeText={setEndTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Number"
            value={roomNumber}
            onChangeText={setRoomNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Shift"
            value={shift}
            onChangeText={setShift}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#08422d",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "gray",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EditTimetable;
