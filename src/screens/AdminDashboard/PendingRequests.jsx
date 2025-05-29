import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  TextInput,             // ← import TextInput
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "../firebaseConfig";

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deptName, setDeptName] = useState("");
  const [programName, setProgramName] = useState("");

  // ← new search state
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "pendingRequests"),
      (snap) => {
        const pending = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => !r.approved);
        setRequests(pending);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // filter based on searchText
  const filteredRequests = requests.filter((r) =>
    r.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = async (item) => {
    setSelected(item);
    setDeptName("");
    setProgramName("");

    if (item.department) {
      try {
        const depSnap = await getDoc(
          doc(firestore, "departments", item.department)
        );
        if (depSnap.exists()) setDeptName(depSnap.data().name);
      } catch (err) {
        console.warn("Dept lookup failed", err);
      }
    }
    if (item.role === "CR/GR" && item.program) {
      try {
        const progSnap = await getDoc(
          doc(firestore, "programs", item.program)
        );
        if (progSnap.exists()) setProgramName(progSnap.data().name);
      } catch (err) {
        console.warn("Program lookup failed", err);
      }
    }
  };

  const approveRequest = async (id) => {
    setProcessing(true);
    try {
      const reqRef = doc(firestore, "pendingRequests", id);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) throw new Error("Request not found");
      const data = reqSnap.data();
      const { email, password, requestedAt, ...profile } = data;

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = user.uid;

      await setDoc(doc(firestore, "users", uid), {
        ...profile,
        email,
        uid,
        approved: true,
        approvedAt: serverTimestamp(),
      });

      await deleteDoc(reqRef);
      Alert.alert("Approved", "User has been approved.");
      setSelected(null);
    } catch (err) {
      console.error("Approval error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async (id) => {
    setProcessing(true);
    try {
      await deleteDoc(doc(firestore, "pendingRequests", id));
      Alert.alert("Rejected", "Request has been removed.");
      setSelected(null);
    } catch (err) {
      console.error("Rejection error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  if (processing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
        <Text style={{ marginTop: 8 }}>Processing...</Text>
      </View>
    );
  }

  if (selected) {
    const {
      id,
      imageUrl,
      name,
      gender,
      email,
      phoneNumber,
      registrationNumber,
      role,
      session,
      semester,
      FacultyType,
      designation,
      campusName,
      requestedAt,
    } = selected;

    return (
      <ScrollView contentContainerStyle={styles.detailContainer}>
        <Text style={styles.header}>Request Details</Text>

        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}

        <Detail
          label="Requested At"
          value={new Date(requestedAt).toLocaleString()}
        />
        <Detail label="Department" value={deptName} />
        {role === "CR/GR" && <Detail label="Program" value={programName} />}
        <Detail label="Name" value={name} />
        <Detail label="Gender" value={gender} />
        <Detail label="Email" value={email} />
        <Detail label="Phone" value={phoneNumber} />
        <Detail label="Campus" value={campusName} />
        <Detail label="Registration #" value={registrationNumber} />
        <Detail label="Role" value={role} />

        {role === "CR/GR" && (
          <>
            <Detail label="Semester" value={semester} />
            <Detail label="Session" value={session} />
          </>
        )}
        {role === "Faculty" && (
          <>
            <Detail label="Designation" value={designation} />
            <Detail label="Faculty Type" value={FacultyType} />
          </>
        )}

        <View style={styles.actionsDetail}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => approveRequest(id)}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => rejectRequest(id)}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelected(null)}
        >
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Sign-Up Requests</Text>

      {/* ── Search Bar ── */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {filteredRequests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No matching requests.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.field}>
                <Text style={styles.label}>Requested At:</Text>{" "}
                {new Date(item.requestedAt).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.buttonText}>Details</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const Detail = ({ label, value }) =>
  value ? (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  ) : null;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 12,
    textAlign: "center",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: "#08422d",
  },
  emptyText: { fontSize: 16, color: "#555" },
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#08422d" },
  field: { fontSize: 16, marginBottom: 4, color: "#333" },
  label: { fontWeight: "600", color: "#08422d" },
  detailButton: {
    backgroundColor: "#0066cc",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 8,
  },

  detailContainer: { padding: 16, backgroundColor: "#fff" },
  detailRow: { flexDirection: "row", marginBottom: 8, flexWrap: "wrap" },

  actionsDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  approveButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#08422d",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#a00",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },

  backButton: { marginTop: 16, alignItems: "center" },
  backText: { fontSize: 16, color: "#0066cc" },

  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#08422d",
  },
});

export default PendingRequests;
