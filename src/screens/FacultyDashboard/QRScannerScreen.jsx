import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

const QRScannerScreen = ({ route,navigation }) => {
  const { timetable } = route.params; // Receive timetable data
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  // const navigation = useNavigation(); // Get navigation object

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    if (!auth.currentUser) {
      Alert.alert("Authentication Error", "User not logged in!");
      setLoading(false);
      return;
    }

    const attendanceStatus = data === timetable.roomNumber ? "Present" : "Absent";

    try {
      await addDoc(collection(firestore, "attendance"), {
        facultyId: auth.currentUser.uid,
        facultyName: auth.currentUser.displayName, // Optional: Store faculty name
        roomId: data,
        expectedRoom: timetable.roomNumber, // Store the expected room for reference
        course: timetable.course,
        day: timetable.day,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        status: attendanceStatus,
        timestamp: serverTimestamp(),
      });

      Alert.alert(
        "Attendance Marked",
        `You are marked as ${attendanceStatus}!`,
        [{ text: "OK", onPress: () => navigation.goBack() }] // Navigate back after success
      );
    } catch (error) {
      Alert.alert("Database Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
        <Button
          title="Allow Camera"
          onPress={() => BarCodeScanner.requestPermissionsAsync()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {loading && <ActivityIndicator size="large" color="#fff" style={styles.loader} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    position: "absolute",
    top: "50%",
  },
});

export default QRScannerScreen;
