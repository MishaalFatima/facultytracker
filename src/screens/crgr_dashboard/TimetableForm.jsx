import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { firestore } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const TimetableForm = () => {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [course, setCourse] = useState('');
  const [day, setDay] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [roomNo, setRoomNo] = useState('');

  const handleSubmit = async () => {
    if (!department || !semester || !startTime || !endTime || !course || !day || !facultyName || !roomNo) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      // Prepare the data to be saved in Firestore
      const timetableData = {
        department,
        semester,
        startTime,
        endTime,
        course,
        day,
        facultyName,
        roomNo,
      };

      // Save the data to Firestore
      const docRef = await addDoc(collection(firestore, 'timetables'), timetableData);

      // Show success alert
      Alert.alert('Timetable Saved', 'Timetable has been saved ');
    } catch (error) {
      // Handle any errors
      Alert.alert('Error', 'There was an error saving the timetable.');
      Alert.log('Error', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Timetable Form</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Department"
            value={department}
            onChangeText={setDepartment}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Semester</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Semester"
            value={semester}
            onChangeText={setSemester}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Time</Text>
          <TextInput
            style={styles.input}
            placeholder="Start Time"
            value={startTime}
            onChangeText={setStartTime}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>End Time</Text>
          <TextInput
            style={styles.input}
            placeholder="End Time"
            value={endTime}
            onChangeText={setEndTime}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Course</Text>
          <TextInput
            style={styles.input}
            placeholder="Course Name"
            value={course}
            onChangeText={setCourse}
          />
        </View>

        <View style={styles.inputGroup}>
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
            <Picker.Item label="Saturday" value="Saturday" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Faculty Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Faculty Name"
            value={facultyName}
            onChangeText={setFacultyName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Room Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Room Number"
            value={roomNo}
            onChangeText={setRoomNo}
          />
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
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#08422d',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#08422d',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#08422d',
  },
  picker: {
    height: 40,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#08422d',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TimetableForm;
