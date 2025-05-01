import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const RoomList = () => {
  const [roomNo, setRoomNo] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);

  // Fetch rooms from Firestore
  const fetchRooms = async () => {
    try {
      const snap = await getDocs(collection(firestore, "rooms"));
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching rooms:", e);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Create or Update handler
  const handleSubmit = async () => {
    if (!roomNo.trim()) {
      Alert.alert("Error", "Room number cannot be empty!");
      return;
    }
    try {
      if (editingRoom) {
        // UPDATE
        const ref = doc(firestore, "rooms", editingRoom.id);
        await updateDoc(ref, { room_no: roomNo });
        setRooms((prev) =>
          prev.map((r) =>
            r.id === editingRoom.id ? { ...r, room_no: roomNo } : r
          )
        );
        Alert.alert("Success", "Room updated");
      } else {
        // CREATE
        const docRef = await addDoc(collection(firestore, "rooms"), {
          room_no: roomNo,
          createdAt: new Date(),
        });
        setRooms((prev) => [
          ...prev,
          { id: docRef.id, room_no: roomNo },
        ]);
        Alert.alert("Success", "Room added");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setRoomNo("");
      setEditingRoom(null);
      setShowInput(false);
    }
  };

  // Delete handler
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this room?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "rooms", id));
              setRooms((prev) => prev.filter((r) => r.id !== id));
              Alert.alert("Deleted", "Room removed");
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Could not delete room");
            }
          },
        },
      ]
    );
  };

  // Begin edit flow
  const handleEdit = (room) => {
    setEditingRoom(room);
    setRoomNo(room.room_no);
    setShowInput(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room List</Text>

      {/* + Add Room */}
      {!showInput && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInput(true)}
        >
          <Text style={styles.addButtonText}>+ Add Room</Text>
        </TouchableOpacity>
      )}

      {/* Modal for Add/Edit */}
      {showInput && (
        <Modal
          transparent
          animationType="slide"
          visible={showInput}
          onRequestClose={() => {
            setShowInput(false);
            setEditingRoom(null);
            setRoomNo("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingRoom ? "Edit Room" : "New Room"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Room Number (e.g., room14)"
                value={roomNo}
                onChangeText={setRoomNo}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#08422d" }]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingRoom ? "Update" : "Create"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#aaa" }]}
                  onPress={() => {
                    setShowInput(false);
                    setEditingRoom(null);
                    setRoomNo("");
                  }}
                >
                  <Text style={styles.submitButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Room List */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.roomItem}>
            <View style={styles.textContainer}>
              <Text style={styles.roomText}>{item.room_no}</Text>
            </View>
            <View style={styles.iconsRow}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Ionicons
                  name="create-outline"
                  size={24}
                  color="#1e90ff"
                  style={styles.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color="#dc3545"
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
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
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#08422d",
  },
  addButton: {
    backgroundColor: "#08422d",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "600" },
  // List item
  roomItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  textContainer: { flex: 1, marginRight: 12 },
  roomText: {
    fontSize: 18,
    flexWrap: "wrap",
  },
  iconsRow: { flexDirection: "row", alignSelf: "flex-start" },
  icon: { marginLeft: 8 },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
});

export default RoomList;
