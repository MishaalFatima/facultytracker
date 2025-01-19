import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import { getAuth } from "firebase/auth"; // Import Firebase Auth to get the current user

const MapSectionFD = () => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [availability, setAvailability] = useState(null);
  const [documentRef, setDocumentRef] = useState(null); // Stores the Firestore document reference
  const [creationTime, setCreationTime] = useState(null);

  const universityCoordinates = {
    // latitude: 32.29194,
    // longitude: 72.27361,
    latitude: 32.4241202,
    longitude: 74.1132001,
    radius: 0.005,
  };

  const fetchLocation = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const isAvailable = checkIfInCampus(coords.latitude, coords.longitude);

      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      setAvailability(isAvailable ? "Available" : "Unavailable");
    } catch (error) {
      console.log("Error fetching location", error);
    }
  };

  const checkIfInCampus = (latitude, longitude) => {
    const distance = Math.sqrt(
      Math.pow(latitude - universityCoordinates.latitude, 2) +
        Math.pow(longitude - universityCoordinates.longitude, 2)
    );
    return distance <= universityCoordinates.radius;
  };

  const saveLocationToFirestore = async (coords, isAvailable) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    try {
      if (documentRef) {
        // Update existing document
        await updateDoc(doc(firestore, "facultyAvailability", documentRef.id), {
          latitude: coords.latitude,
          longitude: coords.longitude,
          availability: isAvailable ? "Available" : "Unavailable",
          timestamp: serverTimestamp(), // Update the timestamp
        });
      } else {
        // Create a new document
        const docRef = await addDoc(
          collection(firestore, "facultyAvailability"),
          {
            userId: currentUser.uid,
            latitude: coords.latitude,
            longitude: coords.longitude,
            availability: isAvailable ? "Available" : "Unavailable",
            creationTime: serverTimestamp(),
          }
        );
        setDocumentRef(docRef); // Save the document reference
        setCreationTime(Date.now()); // Save the creation time locally
      }
    } catch (error) {
      console.log("Error saving location to Firestore:", error);
    }
  };

  const updateDocumentDuration = async () => {
    if (documentRef) {
      const activeDuration = Math.round((Date.now() - creationTime) / 1000); // Duration in seconds
      try {
        await updateDoc(doc(firestore, "facultyAvailability", documentRef.id), {
          activeDuration, // Store the duration
          endTime: serverTimestamp(), // Save the end time
        });
        setDocumentRef(null); // Reset the document reference
        setCreationTime(null); // Reset the creation time
      } catch (error) {
        console.error("Error updating document duration:", error);
      }
    }
  };

  useEffect(() => {
    if (availability !== null) {
      if (!documentRef) {
        // Create a new document if there isn't an active one
        saveLocationToFirestore(location, availability === "Available");
      } else {
        // Close the previous document if status changes
        updateDocumentDuration();
        saveLocationToFirestore(location, availability === "Available");
      }
    }
  }, [availability]);

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Update every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <View style={styles.mapContainer}>
      <Text style={styles.sectionTitle}>Current Location</Text>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Current Location"
            description={`Status: ${availability}`}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 200,
    marginVertical: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  map: { flex: 1, height: 200, borderRadius: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 10,
  },
});

export default MapSectionFD;
