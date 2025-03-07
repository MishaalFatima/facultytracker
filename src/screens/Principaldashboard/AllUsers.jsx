import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for dropdown filtering
  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const [userTypeValue, setUserTypeValue] = useState("All");
  const [userTypeItems, setUserTypeItems] = useState([
    { label: "User Type", value: "All" },
    { label: "Admin", value: "Admin" },
    { label: "Faculty", value: "Faculty" },
    { label: "CR/GR", value: "CR/GR" },
    { label: "Principal", value: "Principal" },
  ]);

  // Fetch all user documents from the "users" collection.
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"));
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on the selected user type.
  const filteredUsers =
    userTypeValue === "All"
      ? users
      : users.filter((user) => user.role === userTypeValue);

  // Render a row for each user.
  const renderItem = useCallback(({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.email}</Text>
      <Text style={styles.cell}>{item.department}</Text>
      <Text style={styles.cell}>{item.role}</Text>
      <Text style={styles.cell}>{item.FacultyType}</Text>
      <Text style={styles.cell}>{item.designation}</Text>
      <Text style={styles.cell}>{item.campusName}</Text>
      <Text style={styles.cell}>{item.phoneNumber}</Text>
      <Text style={styles.cell}>{item.registrationNumber}</Text>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dropdown Filter */}
      <DropDownPicker
        open={userTypeOpen}
        value={userTypeValue}
        items={userTypeItems}
        setOpen={setUserTypeOpen}
        setValue={setUserTypeValue}
        setItems={setUserTypeItems}
        containerStyle={styles.dropdownContainer}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownList}
      />

      {filteredUsers.length > 0 ? (
        <>
          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell]}>Name</Text>
            <Text style={[styles.cell, styles.headerCell]}>Email</Text>
            <Text style={[styles.cell, styles.headerCell]}>Dept</Text>
            <Text style={[styles.cell, styles.headerCell]}>Role</Text>
            <Text style={[styles.cell, styles.headerCell]}>Faculty Type</Text>
            <Text style={[styles.cell, styles.headerCell]}>Designation</Text>
            <Text style={[styles.cell, styles.headerCell]}>Campus</Text>
            <Text style={[styles.cell, styles.headerCell]}>Phone</Text>
            <Text style={[styles.cell, styles.headerCell]}>Reg No</Text>
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </>
      ) : (
        <Text style={styles.noDataText}>No users found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 1000, // required for proper dropdown stacking on Android
  },
  dropdown: {
    borderColor: "#ccc",
  },
  dropdownList: {
    borderColor: "#ccc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 5,
  },
  headerRow: {
    backgroundColor: "#08422d",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 3,
    fontSize: 12,
    color: "#000",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#fff",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
});

export default AllUsers;
