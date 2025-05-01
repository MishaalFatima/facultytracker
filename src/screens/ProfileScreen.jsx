import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const auth       = getAuth();
  const db         = getFirestore();
  const uid        = auth.currentUser?.uid;
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        console.warn("No profile for UID:", uid);
        setLoading(false);
        return;
      }
      const data = userSnap.data();

      // load departmentName & programName
      if (data.department) {
        const dep = await getDoc(doc(db, "departments", data.department));
        data.departmentName = dep.exists() ? dep.data().name : data.department;
      }
      if (data.program) {
        const prog = await getDoc(doc(db, "programs", data.program));
        data.programName = prog.exists() ? prog.data().name : data.program;
      }

      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile();
    }, [uid])
  );

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;
  if (!profile) return <Text style={styles.errorText}>Profile not found</Text>;

  // Prepare fields
  const commonFields = [
    { key: "name",               label: "Name" },
    { key: "email",              label: "Email" },
    { key: "role",               label: "Role" },
    { key: "registrationNumber", label: "Reg. No." },
    { key: "campusName",         label: "Campus" },
    { key: "gender",             label: "Gender" },
    { key: "password",           label: "Password" },
  ];

  const roleFieldsMap = {
    Admin: [
      { key: "phoneNumber", label: "Phone No." },
      { key: "uid",         label: "Admin ID" },
    ],
    Principal: [
      { key: "phoneNumber", label: "Phone No." },
    ],
    "CR/GR": [
      { key: "phoneNumber",    label: "Phone No." },
      { key: "departmentName", label: "Department" },
      { key: "programName",    label: "Program" },
      { key: "semester",       label: "Semester" },
      { key: "session",        label: "Session" },
    ],
    Faculty: [
      { key: "phoneNumber",    label: "Phone No." },
      { key: "departmentName", label: "Department" },
      { key: "designation",    label: "Designation" },
      { key: "FacultyType",    label: "Faculty Type" },
    ],
  };

  const fieldsToShow = [
    ...commonFields,
    ...(roleFieldsMap[profile.role] || [])
  ].filter(f => profile[f.key] != null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Heading */}
      <Text style={styles.heading}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: profile.imageUrl || "https://via.placeholder.com/120"
          }}
          style={styles.avatar}
        />
      </View>

      {/* All fields in one card */}
      <View style={styles.card}>
        {fieldsToShow.map(f => (
          <Detail key={f.key} label={f.label} value={profile[f.key]} />
        ))}
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() =>
          navigation.navigate("EditProfileScreen", { profile })
        }
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Detail = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:       {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loader:          { flex: 1, justifyContent: "center" },
  errorText:       { color: "red", marginTop: 20 },
  heading:         {
                     fontSize: 24,
                     fontWeight: "bold",
                     color: "#08422d",
                     marginBottom: 20,
                   },
  avatarContainer: {
                     height: 140,
                     justifyContent: "center",
                     alignItems: "center",
                     marginBottom: 20,
                   },
  avatar:          {
                     width: 120,
                     height: 120,
                     borderRadius: 60,
                     borderWidth: 2,
                     borderColor: "#08422d",
                   },
  card:            {
                     width: "100%",
                     backgroundColor: "#fff",
                     padding: 15,
                     borderRadius: 10,
                     marginBottom: 20,
                     elevation: 3,
                   },
  row:             {
                     flexDirection: "row",
                     justifyContent: "space-between",
                     marginBottom: 8,
                   },
  label:           {
                     fontWeight: "bold",
                     color: "#08422d",
                   },
  value:           { color: "#333" },
  editButton:      {
                     backgroundColor: "#08422d",
                     paddingVertical: 12,
                     paddingHorizontal: 30,
                     borderRadius: 8,
                     marginBottom: 30,
                   },
  editButtonText:  {
                     color: "#fff",
                     fontSize: 16,
                     fontWeight: "bold",
                   },
});

export default ProfileScreen;
