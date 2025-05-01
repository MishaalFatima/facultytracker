import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { firestore } from "../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const AllUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [userTypeValue, setUserTypeValue] = useState("");
  const [userTypeItems] = useState([
    { label: "Admin", value: "Admin" },
    { label: "Faculty", value: "Faculty" },
    { label: "CR/GR", value: "CR/GR" },
    { label: "Principal", value: "Principal" },
  ]);
  const [nameQuery, setNameQuery] = useState("");
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([]);
  const [regValue, setRegValue] = useState("");
  const [regItems, setRegItems] = useState([]);

  // Columns per role
  const columnsConfig = {
    Admin: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "phoneNumber", label: "Phone" },
      { key: "imageUrl", label: "Image" },
    ],
    Faculty: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "registrationNumber", label: "Reg No." },
      { key: "phoneNumber", label: "Phone" },
      { key: "campusName", label: "Campus" },
      { key: "gender", label: "Gender" },
      { key: "FacultyType", label: "Type" },
      { key: "departmentName", label: "Dept" },
      { key: "designation", label: "Designation" },
      { key: "imageUrl", label: "Image" },
    ],
    "CR/GR": [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "departmentName", label: "Dept" },
      { key: "programName", label: "Program" },
      { key: "session", label: "Session" },
      { key: "semester", label: "Semester" },
    ],
    Principal: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "registrationNumber", label: "Reg No." },
      { key: "phoneNumber", label: "Phone" },
      { key: "campusName", label: "Campus" },
      { key: "gender", label: "Gender" },
      { key: "imageUrl", label: "Image" },
    ],
  };

  // Fetch departments & users, build filter lists
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Departments
      const deptSnap = await getDocs(collection(firestore, "departments"));
      const depts = deptSnap.docs.map((d) => {
        const name = (d.data().name || "").trim();
        return { label: name, value: name };
      });
      setDeptItems(depts);

      const deptMap = {};
      deptSnap.docs.forEach((d) => {
        deptMap[d.id] = (d.data().name || "").trim();
      });

      // Programs map
      const progSnap = await getDocs(collection(firestore, "programs"));
      const progMap = {};
      progSnap.docs.forEach((p) => {
        progMap[p.id] = p.data().name?.trim() || p.id;
      });

      // Users
      const userSnap = await getDocs(collection(firestore, "users"));
      const all = userSnap.docs.map((u) => {
        const d = u.data();
        return {
          id: u.id,
          ...d,
          departmentName: deptMap[d.department] || "",
          programName: progMap[d.program] || "",
        };
      });
      setUsers(all);

      // Reg. No.
      setRegItems(
        Array.from(new Set(all.map((u) => u.registrationNumber)))
          .filter(Boolean)
          .map((no) => ({ label: no, value: no }))
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete handler
  const handleDelete = async () => {
    await deleteDoc(doc(firestore, "users", selectedUser.id));
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setDeleteModalVisible(false);
    Alert.alert("Deleted", `${selectedUser.name} removed`);
  };

  // Delete modal
  const DeleteModal = () => (
    <Modal transparent visible={deleteModalVisible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Delete {selectedUser?.name}?</Text>
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
      </SafeAreaView>
    );
  }

  // Prompt to select user type first
  if (!userTypeValue) {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>Please select a user type.</Text>
        <View style={styles.cardFilter}>
          <Picker
            selectedValue={userTypeValue}
            onValueChange={setUserTypeValue}
            style={styles.pickerFilter}
          >
            <Picker.Item label="Select User Type" value="" />
            {userTypeItems.map((it) => (
              <Picker.Item key={it.value} label={it.label} value={it.value} />
            ))}
          </Picker>
        </View>
      </View>
    );
  }

  // Apply filters
  let filtered = users.filter((u) => u.role === userTypeValue);
  if (nameQuery) {
    filtered = filtered.filter((u) =>
      u.name.toLowerCase().includes(nameQuery.toLowerCase())
    );
  }
  if (deptValue && userTypeValue !== "Admin") {
    filtered = filtered.filter((u) => u.departmentName === deptValue);
  }
  if (regValue) {
    filtered = filtered.filter((u) => u.registrationNumber === regValue);
  }

  const columns = columnsConfig[userTypeValue];

  // Row renderer
  const renderRow = ({ item, index }) => (
    <View style={[styles.row, index % 2 ? styles.oddRow : styles.evenRow]}>
      {columns.map((col) => (
        <View key={col.key} style={styles.cell}>
          {col.key === "imageUrl" && item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.cellText}>{String(item[col.key] ?? "")}</Text>
          )}
        </View>
      ))}
      <View style={styles.actionsCell}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("UpdateUserList", { userId: item.id })
          }
        >
          <MaterialIcons name="edit" size={20} color="#08422d" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSelectedUser(item);
            setDeleteModalVisible(true);
          }}
        >
          <MaterialIcons name="delete" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <DeleteModal />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filters:</Text>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Type */}
          <View style={styles.cardFilter}>
            <Picker
              selectedValue={userTypeValue}
              onValueChange={setUserTypeValue}
              style={styles.pickerFilter}
            >
              <Picker.Item label="Select User Types" value="" />
              {userTypeItems.map((it) => (
                <Picker.Item key={it.value} label={it.label} value={it.value} />
              ))}
            </Picker>
          </View>

          {/* Name */}
          <View style={styles.cardFilter}>
            <TextInput
              style={styles.searchInputFilter}
              placeholder="Search by name"
              value={nameQuery}
              onChangeText={setNameQuery}
            />
          </View>

          {/* Department (hide for Admin) */}
          {userTypeValue !== "Admin" && (
            <View style={styles.cardFilter}>
              <Picker
                selectedValue={deptValue}
                onValueChange={setDeptValue}
                style={styles.pickerFilter}
              >
                <Picker.Item label="All Departments" value="" />
                {deptItems.map((it) => (
                  <Picker.Item key={it.value} label={it.label} value={it.value} />
                ))}
              </Picker>
            </View>
          )}

          {/* Reg. No. */}
          <View style={styles.cardFilter}>
            <Picker
              selectedValue={regValue}
              onValueChange={setRegValue}
              style={styles.pickerFilter}
            >
              <Picker.Item label="All Reg. Nos." value="" />
              {regItems.map((it) => (
                <Picker.Item key={it.value} label={it.label} value={it.value} />
              ))}
            </Picker>
          </View>
        </ScrollView>
      </View>

      {/* Data Table */}
      <View style={{ flex: 1, zIndex: 0 }}>
        <ScrollView horizontal nestedScrollEnabled>
          <View>
            <View style={styles.headerRow}>
              {columns.map((col) => (
                <Text key={col.key} style={styles.headerCell}>
                  {col.label}
                </Text>
              ))}
              <Text style={styles.headerCell}>Actions</Text>
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
              nestedScrollEnabled
              ListEmptyComponent={
                <Text style={styles.noData}>No users found</Text>
              }
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  prompt: { fontSize: 16, textAlign: "center", marginVertical: 20 },

  filtersContainer: { marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },

  cardFilter: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerFilter: {
    height: 44,
    width: "100%",
  },
  searchInputFilter: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#fff",
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#08422d",
    paddingVertical: 8,
  },
  headerCell: {
    width: 120,
    paddingHorizontal: 6,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#fff",
  },
  row: { flexDirection: "row", minHeight: 48, alignItems: "center" },
  evenRow: { backgroundColor: "#ffffff" },
  oddRow: { backgroundColor: "#f4f4f4" },
  cell: {
    width: 120,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
  },
  cellText: { color: "#333", fontSize: 13, textAlign: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  actionsCell: {
    width: 80,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  noData: { padding: 12, textAlign: "center", color: "#666" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalText: { fontSize: 18, textAlign: "center", marginBottom: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#ccc" },
  deleteButton: { backgroundColor: "#e74c3c" },
  buttonText: { color: "#fff", fontWeight: "600" },
});

export default AllUsers;
