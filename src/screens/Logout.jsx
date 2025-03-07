import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, TouchableHighlight, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { signOut, getAuth } from "firebase/auth";
import {
  query,
  where,
  getDocs,
  collection,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore } from "./firebaseConfig"; // Assuming firestore is initialized here
import LoadingScreen from "./LoadingScreen";
import { doc } from "firebase/firestore";

const Logout = ({ variant }) => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser); // Debug log

      if (!currentUser) {
        console.error("User not authenticated");
        Alert.alert("Error", "User not authenticated");
        setLoading(false);
        return;
      }

      const userId = currentUser.uid;

      // Query to fetch the most recent document for the current user
      const q = query(
        collection(firestore, "facultyAvailability"),
        where("userId", "==", userId),
        orderBy("creationTime", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0];

        // If the document is still marked as "Available", update it
        if (docRef.data().availability === "Available") {
          await updateDoc(doc(firestore, "facultyAvailability", docRef.id), {
            endTime: serverTimestamp(),
          });

          // Create a new document with "Unavailable" status
          await addDoc(collection(firestore, "facultyAvailability"), {
            userId: userId,
            availability: "Unavailable",
            creationTime: serverTimestamp(),
          });
        }
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
    return <LoadingScreen />;
  }

  // Render the logout button based on variant
  if (variant === "menu") {
    return (
      <TouchableHighlight
        style={styles.menuItem}
        onPress={handleLogout}
        underlayColor="#fdcc0d"
      >
        <View style={styles.menuItemContent}>
          <MaterialIcons name="exit-to-app" size={24} color="#08422d" />
          <Text style={styles.menuText}>Logout</Text>
        </View>
      </TouchableHighlight>
    );
  }

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <FontAwesome name="sign-out" size={20} color="white" style={styles.icon} />
      <Text style={styles.buttonText}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
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
  // Menu styles (matching your other menu items)
  menuItem: {
    flexDirection: "row",
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 18,
    color: "#08422d",
    marginLeft: 10,
  },
});

export default Logout;
