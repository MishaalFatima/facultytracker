import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, firestore } from '../firebaseConfig'; 
import { collection, query, where, getDocs } from 'firebase/firestore';

const FacultyTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const timetableQuery = query(
            collection(firestore, 'timetables'),
            where('facultyId', '==', user.uid)  // Filter timetable by the logged-in user's UID
          );
          const querySnapshot = await getDocs(timetableQuery);
          const timetableData = querySnapshot.docs.map(doc => doc.data());
          
          if (timetableData.length === 0) {
            Alert.alert('No Timetable', 'No timetable found for this faculty.');
          } else {
            setTimetable(timetableData);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch timetable.");
        console.error("Error fetching timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#08422d" />;
  }

  return (
    <View style={styles.container}>
      {timetable.length > 0 ? (
        <FlatList
          data={timetable}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.timetableItem}>
              <Text style={styles.timetableText}>
                {item.day} - {item.course} ({item.startTime} - {item.endTime})
              </Text>
              <Text style={styles.timetableText}>Room: {item.roomNumber}</Text>
            </View>
          )}
        />
      ) : (
        <Text>No timetable available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  timetableItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  timetableText: {
    fontSize: 16,
    color: '#08422d',
  },
});

export default FacultyTimetable;
