import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "./firebaseConfig";
import EditAvailabilityModal from "./AdminDashboard/EditAvailabilityModal";

const AvailabilityReport = ({ route }) => {
  const { uid } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPermanent, setIsPermanent] = useState(true);
  const [userRole, setUserRole] = useState(null); // To store the user's role
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Opens the modal and sets the selected record for editing
  const handleEdit = (record) => {
    console.log("Edit record:", record.id);
    setSelectedRecord(record);
    setEditModalVisible(true);
  };

  // Called when changes are saved in the modal
  const handleSaveEdit = async (updatedData) => {
    try {
      await updateDoc(doc(firestore, "facultyAvailability", selectedRecord.id), updatedData);
      // Update local state so UI reflects the change
      setData(prevData =>
        prevData.map(r =>
          r.id === selectedRecord.id ? { ...r, ...updatedData } : r
        )
      );
    } catch (error) {
      console.error("Error updating record:", error);
    } finally {
      setEditModalVisible(false);
      setSelectedRecord(null);
    }
  };

  // Deletes the record from Firestore and updates local state
  const handleDelete = async (recordId) => {
    try {
      await deleteDoc(doc(firestore, "facultyAvailability", recordId));
      setData(prevData => prevData.filter(r => r.id !== recordId));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, "users", uid));
        const userData = userDoc.data();
        // Save the user's role
        setUserRole(userData.role);
        if (userData.FacultyType !== "Permanent") {
          setIsPermanent(false);
          setLoading(false);
          return;
        }

        const availabilityQuery = query(
          collection(firestore, "facultyAvailability"),
          where("userId", "==", uid)
        );
        const snapshot = await getDocs(availabilityQuery);
        const availabilityData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userName: userData.name,
          registrationNumber: userData.registrationNumber,
          department: userData.department,
          from: doc.data().creationTime?.toDate(),
          to: doc.data().endTime?.toDate(),
          location: doc.data().location,
        }));

        setData(availabilityData.sort((a, b) => b.from - a.from));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid]);

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!isPermanent)
    return <Text style={styles.message}>Available for permanent faculty only</Text>;

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Availability History</Text>
        
        {data.map((record, index) => (
          <View key={record.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={[
                styles.status, 
                record.availability === 'Available' ? styles.available : styles.unavailable
              ]}>
                {record.availability}
              </Text>
              <View style={styles.headerRight}>
                <Text style={styles.duration}>{index + 1}</Text>
                {userRole === "Admin" && (
                  <>
                    <Icon 
                      name="edit" 
                      size={20} 
                      color="blue" 
                      onPress={() => handleEdit(record)}
                      style={styles.icon}
                    />
                    <Icon 
                      name="delete" 
                      size={20} 
                      color="red" 
                      onPress={() => handleDelete(record.id)}
                      style={styles.icon}
                    />
                  </>
                )}
              </View>
            </View>
            
            <View style={styles.timeContainer}>
              <View style={styles.time}>
                <Text style={styles.label}>From:</Text>
                <Text>{record.from?.toLocaleString() || 'N/A'}</Text>
              </View>
              <View style={styles.time}>
                <Text style={styles.label}>To:</Text>
                <Text>{record.to?.toLocaleString() || 'Active'}</Text>
              </View>
            </View>

            {record.location && (
              <View style={styles.location}>
                <Text style={styles.label}>Location:</Text>
                <Text>{record.location}</Text>
              </View>
            )}
          </View>
        ))}

        {data.length === 0 && (
          <Text style={styles.message}>No availability records found</Text>
        )}
      </ScrollView>

      {selectedRecord && (
        <EditAvailabilityModal
          visible={editModalVisible}
          record={selectedRecord}
          onClose={() => { setEditModalVisible(false); setSelectedRecord(null); }}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#08422d',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  available: {
    color: 'green',
  },
  unavailable: {
    color: 'red',
  },
  duration: {
    color: '#666',
    marginRight: 8,
  },
  icon: {
    marginHorizontal: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  time: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#08422d',
    marginBottom: 4,
  },
  location: {
    marginTop: 8,
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default AvailabilityReport;
