import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { signOut, getAuth } from "firebase/auth";
import { query, where, getDocs, collection, updateDoc, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { firestore } from "./firebaseConfig"; // Assuming firestore is initialized here
import LoadingScreen from "./LoadingScreen";
import { doc } from "firebase/firestore";
const Logout = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    setLoading(true);
  
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
  
      if (!currentUser) {
        console.error("User not authenticated");
        return;
      }
  
      // Query to fetch the most recent document for the current user where 'endTime' is null
      const q = query(
        collection(firestore, "facultyAvailability"),
        where("userId", "==", currentUser.uid),
        orderBy("creationTime", "desc"),
        limit(1)
      );
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0];
  
        // Check if the current document is still marked as "Available"
        if (docRef.data().availability === "Available") {
          // If the document is marked as available, update only the endTime
          await updateDoc(doc(firestore, "facultyAvailability", docRef.id), {
            endTime: serverTimestamp(), // Mark the end time
          });
  
          // Create a new document with "Unavailable" status and creationTime
          await addDoc(collection(firestore, "facultyAvailability"), {
            userId: currentUser.uid,
            availability: "Unavailable", // Mark the new status as unavailable
            creationTime: serverTimestamp(), // Set creation time for the new document
          });
        }
        // If the document is already unavailable, do nothing
      } else {
        // No active document found (no "Available" status), so do nothing
      }
  
      // Log out the user from Firebase
      await signOut(auth);
      Alert.alert("Logged out successfully");
  
      // Reset navigation to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
      console.log("Failed to log out:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  if (loading) {
    return <LoadingScreen />; // Show the loading screen when loading
  }

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <FontAwesome
        name="sign-out"
        size={20}
        color="white"
        style={styles.icon}
      />
      <Text style={styles.buttonText}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f", // Red color for logout
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  },
});

export default Logout;
