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
    profileImage: "",
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            let departmentName = "Department not available";

            // Fetch department name using the department ID
            if (userData.department) {
              const deptDocRef = doc(firestore, "departments", userData.department);
              const deptDocSnap = await getDoc(deptDocRef);
              if (deptDocSnap.exists()) {
                departmentName = deptDocSnap.data().name || departmentName;
              }
            }

            setFacultyData({
              name: userData.name || "Name not available",
              designation: userData.designation || "Designation not available",
              department: departmentName,
              profileImage: userData.imageUrl,
            });
          }
        } catch (error) {
          console.error("Error fetching faculty data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.profileContainer}>
      {facultyData.profileImage ? (
        <Image
          source={{ uri: facultyData.profileImage }}
          style={styles.profileImage}
        />
      ) : (
        <View style={[styles.profileImage, styles.placeholder]}>
          <Text>No Image</Text>
        </View>
      )}
      <Text style={styles.nameText}>{facultyData.name}</Text>
      <Text style={styles.designationText}>{facultyData.designation}</Text>
      <Text style={styles.departmentText}>{facultyData.department}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: { alignItems: "center", marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  nameText: { fontSize: 20, fontWeight: "bold", color: "#08422d", marginTop: 10 },
  designationText: { fontSize: 16, color: "#08422d" },
  departmentText: { fontSize: 14, color: "#08422d" },
});

export default ProfileSectionFD;
