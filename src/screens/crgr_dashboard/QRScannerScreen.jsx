import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "../firebaseConfig";

const QRScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

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

    try {
      await addDoc(collection(firestore, "attendance"), {
        facultyId: auth.currentUser.uid,
        roomId: data,
        timestamp: serverTimestamp(),
      });
      Alert.alert("Success", "Attendance recorded successfully!");
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
        <Button title="Allow Camera" onPress={() => BarCodeScanner.requestPermissionsAsync()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={() => setScanned(false)} color="#2196F3" />
        </View>
      )}
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
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  loader: {
    position: "absolute",
    top: "50%",
  },
});

export default QRScannerScreen;
