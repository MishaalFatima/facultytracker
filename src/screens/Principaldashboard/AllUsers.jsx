import React, { useState, useEffect, useCallback } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { getAuth } from "firebase/auth";
import { firestore } from "../firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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

const userTypeItems = [
  { label: "Admin", value: "Admin" },
  { label: "Faculty", value: "Faculty" },
  { label: "CR/GR", value: "CR/GR" },
  { label: "Principal", value: "Principal" },
];

const AllUsers = ({ navigation }) => {
  // Auth & role
  const auth = getAuth();
  const currentUid = auth.currentUser.uid;
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // Data & loading
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [userTypeValue, setUserTypeValue] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [deptValue, setDeptValue] = useState("");
  const [deptItems, setDeptItems] = useState([]);
  const [regValue, setRegValue] = useState("");
  const [regItems, setRegItems] = useState([]);

  // Fetch current user's role
  useEffect(() => {
    (async () => {
      const userDoc = await getDoc(doc(firestore, "users", currentUid));
      setUserRole(userDoc.data()?.role.trim().toLowerCase());
      setLoadingRole(false);
    })();
  }, [currentUid]);

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      // Departments
      const deptSnap = await getDocs(collection(firestore, "departments"));
      const deptMap = {};
      const depts = deptSnap.docs.map(d => {
        const name = d.data().name?.trim() || "";
        deptMap[d.id] = name;
        return { label: name, value: name };
      });
      setDeptItems(depts);
      // Programs
      const progSnap = await getDocs(collection(firestore, "programs"));
      const progMap = {};
      progSnap.docs.forEach(p => {
        progMap[p.id] = p.data().name?.trim() || "";
      });
      // Users
      const userSnap = await getDocs(collection(firestore, "users"));
      const all = userSnap.docs.map(u => {
        const d = u.data();
        return {
          id: u.id,
          ...d,
          departmentName: deptMap[d.department] || "",
          programName: progMap[d.program] || "",
        };
      });
      setUsers(all);
      // Reg numbers
      const uniqueRegs = Array.from(
        new Set(all.map(u => u.registrationNumber).filter(Boolean))
      );
      setRegItems(uniqueRegs.map(no => ({ label: no, value: no })));
      setLoading(false);
    })();
  }, []);

  // Delete handler
  const handleDelete = async () => {
    await deleteDoc(doc(firestore, "users", selectedUser.id));
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setDeleteModalVisible(false);
    Alert.alert("Deleted", `${selectedUser.name} removed`);
  };

  const DeleteModal = () => (
    <Modal transparent visible={deleteModalVisible} animationType="fade">
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

  // Apply filters
  let filtered = users;
  if (userTypeValue) {
    filtered = filtered.filter(u => u.role === userTypeValue);
  }
  if (nameQuery) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(nameQuery.toLowerCase())
    );
  }
  if (deptValue && userTypeValue !== "Admin") {
    filtered = filtered.filter(u => u.departmentName === deptValue);
  }
  if (regValue) {
    filtered = filtered.filter(u => u.registrationNumber === regValue);
  }

  const columns = columnsConfig[userTypeValue] || [];
  const isAdmin = userRole === "admin";

  // Generate PDF
  const generatePdf = useCallback(async () => {
    const headerHtml = columns
      .map(col => `<th>${col.label}</th>`)
      .join("") + (isAdmin ? "<th>Actions</th>" : "");
    const rowsHtml = filtered.length
      ? filtered
          .map(u => {
            const cells = columns
              .map(col => {
                if (col.key === "imageUrl" && u.imageUrl) {
                  return `<td><img src="${u.imageUrl}" width="40" height="40"/></td>`;
                }
                return `<td>${u[col.key] ?? ""}</td>`;
              })
              .join("");
            return `<tr>${cells}${isAdmin ? "<td>—</td>" : ""}</tr>`;
          })
          .join("")
      : `<tr><td colspan="${columns.length + (isAdmin ? 1 : 0)}">No users</td></tr>`;

    const html = `
      <html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>
          body{font-family:sans-serif;padding:20px;}
          h1{color:#08422d;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #ccc;padding:8px;text-align:center;}
          th{background:#f0f0f0;}
        </style>
      </head><body>
        <h1>All Users</h1>
        <table>
          <tr>${headerHtml}</tr>
          ${rowsHtml}
        </table>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save Users PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "PDF generation failed");
    }
  }, [filtered, columns, isAdmin]);

  if (loading || loadingRole) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
      </SafeAreaView>
    );
  }

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
            {userTypeItems.map(it => (
              <Picker.Item key={it.value} label={it.label} value={it.value} />
            ))}
          </Picker>
        </View>
      </View>
    );
  }

  const renderRow = ({ item, index }) => (
    <View style={[styles.row, index % 2 ? styles.oddRow : styles.evenRow]}>
      {columns.map(col => (
        <View key={col.key} style={styles.cell}>
          {col.key === "imageUrl" && item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.cellText}>{String(item[col.key] ?? "")}</Text>
          )}
        </View>
      ))}
      {isAdmin && (
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
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <DeleteModal />

      {/* Header & PDF */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>All Users</Text>
        <TouchableOpacity onPress={generatePdf} style={styles.pdfButton}>
          <Icon name="picture-as-pdf" size={24} color="white" />
          <Text style={styles.pdfText}>Save as PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filters:</Text>
        <ScrollView>
          <View style={styles.cardFilter}>
            <Picker
              selectedValue={userTypeValue}
              onValueChange={setUserTypeValue}
              style={styles.pickerFilter}
            >
              <Picker.Item label="Select User Type" value="" />
              {userTypeItems.map(it => (
                <Picker.Item
                  key={it.value}
                  label={it.label}
                  value={it.value}
                />
              ))}
            </Picker>
          </View>
          <View style={styles.cardFilter}>
            <TextInput
              style={styles.searchInputFilter}
              placeholder="Search by name"
              value={nameQuery}
              onChangeText={setNameQuery}
            />
          </View>
          {userTypeValue !== "Admin" && (
            <View style={styles.cardFilter}>
              <Picker
                selectedValue={deptValue}
                onValueChange={setDeptValue}
                style={styles.pickerFilter}
              >
                <Picker.Item label="All Departments" value="" />
                {deptItems.map(it => (
                  <Picker.Item
                    key={it.value}
                    label={it.label}
                    value={it.value}
                  />
                ))}
              </Picker>
            </View>
          )}
          <View style={styles.cardFilter}>
            <Picker
              selectedValue={regValue}
              onValueChange={setRegValue}
              style={styles.pickerFilter}
            >
              <Picker.Item label="All Reg. Nos." value="" />
              {regItems.map(it => (
                <Picker.Item
                  key={it.value}
                  label={it.label}
                  value={it.value}
                />
              ))}
            </Picker>
          </View>
        </ScrollView>
      </View>

      {/* Data Table */}
      <ScrollView horizontal nestedScrollEnabled>
        <View>
          <View style={styles.headerRowTable}>
            {columns.map(col => (
              <Text key={col.key} style={styles.headerCell}>
                {col.label}
              </Text>
            ))}
            {isAdmin && <Text style={styles.headerCell}>Actions</Text>}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderRow}
            nestedScrollEnabled
            ListEmptyComponent={
              <Text style={styles.noData}>No users found</Text>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  prompt: { fontSize: 16, textAlign: "center", marginVertical: 20 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#08422d" },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#e53e3e",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  pdfText: { color: "white", marginLeft: 6, fontWeight: "500" },

  filtersContainer: { marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },

  cardFilter: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  pickerFilter: { height: 44, width: "100%" },
  searchInputFilter: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#fff",
  },

  headerRowTable: {
    flexDirection: "row",
    backgroundColor: "#08422d",
  },
  headerCell: {
    width: 120,
    padding: 8,
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
    padding: 8,
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
