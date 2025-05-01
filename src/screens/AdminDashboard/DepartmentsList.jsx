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
import { MaterialIcons } from "@expo/vector-icons";

const DepartmentsList = ({ navigation }) => {
  const [departmentName, setDepartmentName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [editingDept, setEditingDept] = useState(null);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const snap = await getDocs(collection(firestore, "departments"));
      setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching departments:", e);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Create or update
  const handleSubmit = async () => {
    if (!departmentName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    try {
      if (editingDept) {
        const ref = doc(firestore, "departments", editingDept.id);
        await updateDoc(ref, { name: departmentName });
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingDept.id ? { ...d, name: departmentName } : d
          )
        );
        Alert.alert("Success", "Department updated");
      } else {
        const docRef = await addDoc(collection(firestore, "departments"), {
          name: departmentName,
          createdAt: new Date(),
        });
        setDepartments((prev) => [
          ...prev,
          { id: docRef.id, name: departmentName },
        ]);
        Alert.alert("Success", "Department added");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setDepartmentName("");
      setEditingDept(null);
      setShowInput(false);
    }
  };

  // Delete
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this department?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "departments", id));
              setDepartments((prev) => prev.filter((d) => d.id !== id));
              Alert.alert("Deleted", "Department removed");
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Could not delete department");
            }
          },
        },
      ]
    );
  };

  // Edit
  const handleEdit = (dept) => {
    setEditingDept(dept);
    setDepartmentName(dept.name);
    setShowInput(true);
  };

  // Navigate to Programs
  const handleNavigateToPrograms = (deptId) => {
    navigation.navigate("ProgramList", { departmentId: deptId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Departments</Text>

      {!showInput && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInput(true)}
        >
          <Text style={styles.addButtonText}>+ Add Department</Text>
        </TouchableOpacity>
      )}

      {showInput && (
        <Modal
          transparent
          animationType="slide"
          visible={showInput}
          onRequestClose={() => {
            setShowInput(false);
            setEditingDept(null);
            setDepartmentName("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingDept ? "Edit Department" : "New Department"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Department Name"
                value={departmentName}
                onChangeText={setDepartmentName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#08422d" }]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingDept ? "Update" : "Create"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#aaa" }]}
                  onPress={() => {
                    setShowInput(false);
                    setEditingDept(null);
                    setDepartmentName("");
                  }}
                >
                  <Text style={styles.submitButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <FlatList
        data={departments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.departmentItem}>
            <View style={styles.textContainer}>
              <Text style={styles.departmentText}>{item.name}</Text>
            </View>
            <View style={styles.iconsRow}>
              <TouchableOpacity
                onPress={() => handleNavigateToPrograms(item.id)}
              >
                <MaterialIcons
                  name="add-circle-outline"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <MaterialIcons
                  name="edit"
                  size={24}
                  color="#1e90ff"
                  style={styles.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <MaterialIcons
                  name="delete-outline"
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
  },
  addButton: {
    backgroundColor: "#08422d",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  departmentItem: {
    flexDirection: "row",
    alignItems: "flex-start",      // icons align to top
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  departmentText: {
    fontSize: 18,
    flexWrap: "wrap",              // allow wrapping onto next line
  },
  iconsRow: {
    flexDirection: "row",
    alignSelf: "flex-start",       // keep at top of the row
  },
  icon: { marginLeft: 8 },
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
});

export default DepartmentsList;