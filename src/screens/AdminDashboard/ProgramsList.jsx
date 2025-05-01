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
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import {  useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const ProgramsList = ({ navigation }) => {
  const [programName, setProgramName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [editingProg, setEditingProg] = useState(null);
  const { departmentId } = useRoute().params;

  // Fetch programs
  const fetchPrograms = async () => {
    try {
      const q = query(
        collection(firestore, "programs"),
        where("departmentId", "==", departmentId)
      );
      const snap = await getDocs(q);
      setPrograms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching programs:", e);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Create or update
  const handleSubmit = async () => {
    if (!programName.trim()) {
      Alert.alert("Error", "Program name cannot be empty");
      return;
    }
    try {
      if (editingProg) {
        // UPDATE
        const ref = doc(firestore, "programs", editingProg.id);
        await updateDoc(ref, { name: programName });
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === editingProg.id ? { ...p, name: programName } : p
          )
        );
        Alert.alert("Success", "Program updated");
      } else {
        // CREATE
        const docRef = await addDoc(collection(firestore, "programs"), {
          name: programName,
          departmentId,
          createdAt: new Date(),
        });
        setPrograms((prev) => [
          ...prev,
          { id: docRef.id, name: programName },
        ]);
        Alert.alert("Success", "Program added");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setProgramName("");
      setEditingProg(null);
      setShowInput(false);
    }
  };

  // Delete
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this program?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "programs", id));
              setPrograms((prev) => prev.filter((p) => p.id !== id));
              Alert.alert("Deleted", "Program removed");
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Could not delete program");
            }
          },
        },
      ]
    );
  };

  // Edit
  const handleEdit = (prog) => {
    setEditingProg(prog);
    setProgramName(prog.name);
    setShowInput(true);
  };

  // Navigate to Courses
  const goToCourses = (programId) => {
    navigation.navigate("CourseList", { programId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programs</Text>

      {/* + Add Program */}
      {!showInput && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInput(true)}
        >
          <Text style={styles.addButtonText}>+ Add Program</Text>
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
            setEditingProg(null);
            setProgramName("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingProg ? "Edit Program" : "New Program"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Program Name"
                value={programName}
                onChangeText={setProgramName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#08422d" }]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingProg ? "Update" : "Create"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#aaa" }]}
                  onPress={() => {
                    setShowInput(false);
                    setEditingProg(null);
                    setProgramName("");
                  }}
                >
                  <Text style={styles.submitButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* List */}
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.programItem}>
            <View style={styles.textContainer}>
              <Text style={styles.programText}>{item.name}</Text>
            </View>
            <View style={styles.iconsRow}>
              <TouchableOpacity onPress={() => goToCourses(item.id)}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
              </TouchableOpacity>
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
  // Row
  programItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  textContainer: { flex: 1, marginRight: 12 },
  programText: {
    fontSize: 18,
    flexWrap: "wrap",
  },
  iconsRow: { flexDirection: "row", alignSelf: "flex-start" },
  icon: { marginLeft: 8 },
  // Modal
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
});

export default ProgramsList;
