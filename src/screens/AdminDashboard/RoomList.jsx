import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const RoomList = () => {
  const [roomNo, setRoomNo] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [rooms, setRooms] = useState([]);

  // Function to fetch rooms from Firestore
  const fetchRooms = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "rooms"));
      const roomList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomList);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Fetch rooms when component loads
  useEffect(() => {
    fetchRooms();
  }, []);

  // Function to handle adding a room
  const handleAddRoom = async () => {
    if (!roomNo.trim()) {
      Alert.alert("Error", "Room number cannot be empty!");
      return;
    }
    try {
      const docRef = await addDoc(collection(firestore, "rooms"), {
        room_no: roomNo,
        createdAt: new Date(),
      });
      // Update the local list immediately
      setRooms([...rooms, { id: docRef.id, room_no: roomNo }]);
      Alert.alert("Success", "Room added successfully!");
      setRoomNo(""); // Clear input field
      setShowInput(false); // Hide input field
    } catch (error) {
      console.error("Error adding room:", error);
      Alert.alert("Error", "Failed to add room. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room List</Text>

      {/* Add Room Button without plus sign */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowInput(true)}
      >
        <Text style={styles.addButtonText}>Add Room</Text>
      </TouchableOpacity>

      {/* Input Field for Room Number */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Room Number (e.g., room14)"
            value={roomNo}
            onChangeText={setRoomNo}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddRoom}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Room List */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.roomItem}>
            <Text style={styles.roomText}>{item.room_no}</Text>
            {/* Removed navigation; simply display the room number */}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No rooms available.</Text>
        }
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
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  roomText: {
    fontSize: 18,
    color: "#08422d",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
});

export default RoomList;