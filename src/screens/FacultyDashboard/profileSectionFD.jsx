import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const ProfileSectionFD = () => {
  const [facultyData, setFacultyData] = useState({
    name: "Loading...",
    designation: "",
    department: "",
    profileImage: "100",
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFacultyData({
            name: docSnap.data().name || "Name not available",
            designation: docSnap.data().designation || "Designation not available",
            department: docSnap.data().department || "Department not available",
            profileImage: docSnap.data().imageUrl,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.profileContainer}>
      <Image
        source={{ uri: facultyData.profileImage }}
        style={styles.profileImage}
      />
      <Text style={styles.nameText}>{facultyData.name}</Text>
      <Text style={styles.designationText}>{facultyData.designation}</Text>
      <Text style={styles.departmentText}>{facultyData.department}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: { alignItems: "center", marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  nameText: { fontSize: 20, fontWeight: "bold", color: "#08422d", marginTop: 10 },
  designationText: { fontSize: 16, color: "#08422d" },
  departmentText: { fontSize: 14, color: "#08422d" },
});

export default ProfileSectionFD;
