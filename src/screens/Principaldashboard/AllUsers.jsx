import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import DropDownPicker from "react-native-dropdown-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const AllUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Dropdown states
  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const [userTypeValue, setUserTypeValue] = useState("All");
  const [userTypeItems] = useState([
    { label: "All Users", value: "All" },
    { label: "Admin", value: "Admin" },
    { label: "Faculty", value: "Faculty" },
    { label: "CR/GR", value: "CR/GR" },
    { label: "Principal", value: "Principal" },
  ]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(firestore, "users", selectedUser.id));
      setUsers(users.filter((user) => user.id !== selectedUser.id));
      setDeleteModalVisible(false);
      Alert.alert("Success", "User deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete user");
    }
  };

  const renderItem = useCallback(({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.email}</Text>
      <Text style={styles.cell}>{item.department}</Text>
      <Text style={styles.cell}>{item.role}</Text>
      
      <TouchableOpacity
        style={styles.iconCell}
        onPress={() => navigation.navigate("UpdateUserList", { userId: item.id })}
      >
        <MaterialIcons name="edit" size={20} color="#08422d" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.iconCell}
        onPress={() => {
          setSelectedUser(item);
          setDeleteModalVisible(true);
        }}
      >
        <MaterialIcons name="delete" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  ), []);

  const DeleteConfirmationModal = () => (
    <Modal
      visible={deleteModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Delete {selectedUser?.name}?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredUsers = userTypeValue === "All" 
    ? users 
    : users.filter(user => user.role === userTypeValue);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DeleteConfirmationModal />
      
      <DropDownPicker
        open={userTypeOpen}
        value={userTypeValue}
        items={userTypeItems}
        setOpen={setUserTypeOpen}
        setValue={setUserTypeValue}
        placeholder="Filter by role"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownList}
      />

      {filteredUsers.length > 0 ? (
        <>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell]}>Name</Text>
            <Text style={[styles.cell, styles.headerCell]}>Email</Text>
            <Text style={[styles.cell, styles.headerCell]}>Dept</Text>
            <Text style={[styles.cell, styles.headerCell]}>Role</Text>
            <Text style={[styles.cell, styles.headerCell]}>Actions</Text>
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="group-off" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  dropdown: {
    borderColor: "#08422d",
    marginBottom: 10,
  },
  dropdownList: {
    borderColor: "#08422d",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#08422d",
    borderRadius: 8,
    marginTop: 10,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#333",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#fff",
  },
  iconCell: {
    paddingHorizontal: 8,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#666",
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default AllUsers;