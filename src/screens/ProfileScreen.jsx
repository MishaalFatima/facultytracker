import React, { useState, useCallback } from "react";
import { 
  View, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView 
} from "react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const ProfileScreen = () => {
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (userId) {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        console.log("No profile found");
      }
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Show loading while fetching data
      fetchProfile();
    }, [userId])
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#08422d" style={styles.loader} />;
  }

  if (!profile) {
    return <Text style={styles.errorText}>Profile not found</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      {/* Profile Details */}
      <View style={styles.profileCard}>
        <ProfileDetail label="Gender" value={profile.gender} />
        <ProfileDetail label="Role" value={profile.role} />
        <ProfileDetail label="Registration No" value={profile.registrationNumber} />
        <ProfileDetail label="Campus" value={profile.campusName} />
        <ProfileDetail label="Password" value={profile.password} />

        {/* Role-Specific Fields */}
        {profile.role === "Faculty" && (
          <>
            <ProfileDetail label="Phone No" value={profile.phoneNumber} />
            <ProfileDetail label="Designation" value={profile.designation} />
            <ProfileDetail label="Department" value={profile.department} />
            <ProfileDetail label="Faculty Type" value={profile.FacultyType} />
          </>
        )}

        {profile.role === "CR/GR" && (
          <>
            <ProfileDetail label="Phone No" value={profile.phoneNumber} />
            <ProfileDetail label="Department" value={profile.department} />
            <ProfileDetail label="Program" value={profile.programName} />
            <ProfileDetail label="Session" value={profile.session} />
          </>
        )}

        {profile.role === "Principal" && (
          <>
            <ProfileDetail label="Phone No" value={profile.phoneNumber} />
            <ProfileDetail label="Designation" value={profile.designation} />
            <ProfileDetail label="Campus" value={profile.campusName} />
          </>
        )}

        {profile.role === "Admin" && (
          <>
            <ProfileDetail label="Phone No" value={profile.phoneNumber} />
            <ProfileDetail label="Admin ID" value={profile.uid || "N/A"} />
          </>
        )}
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => navigation.navigate("EditProfileScreen", { profile })}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/** Component to display profile details */
const ProfileDetail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#08422d",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#08422d",
  },
  email: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  profileCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#08422d",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  editButton: {
    backgroundColor: "#08422d",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
  },
  editButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
});

export default ProfileScreen;
