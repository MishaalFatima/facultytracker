import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Callout  } from "react-native-maps";
import * as Location from "expo-location";
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
import { firestore } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

const MapSectionFD = () => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [availability, setAvailability] = useState("Unavailable");

  const universityCoordinates = {
    latitude: 32.284533,
    longitude: 72.2895413,
    // latitude: 32.424165,
    // longitude: 74.1134659,
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

  const handleDocument = async (coords, isAvailable) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    try {
      // Query for the most recent document for the user
      const q = query(
        collection(firestore, "facultyAvailability"),
        where("userId", "==", currentUser.uid),
        orderBy("creationTime", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const activeDoc = querySnapshot.docs[0];
        const activeDocRef = activeDoc.ref;

        if (!activeDoc.data().endTime) {
          const activeDuration = Math.round(
            (Date.now() - activeDoc.data().creationTime.toMillis()) / 1000
          );
          // Close the previous document with endTime and activeDuration
          await updateDoc(activeDocRef, {
            activeDuration,
            endTime: serverTimestamp(),
          });
        }
      }

      // Create a new document with the updated availability status
      await addDoc(collection(firestore, "facultyAvailability"), {
        userId: currentUser.uid,
        latitude: coords.latitude,
        longitude: coords.longitude,
        availability: isAvailable ? "Available" : "Unavailable",
        creationTime: serverTimestamp(),
      });
    } catch (error) {
      console.log("Error handling document:", error);
    }
  };

  const prevAvailabilityRef = useRef();

  useEffect(() => {
    if (availability !== null && location) {
      if (prevAvailabilityRef.current !== availability) {
        handleDocument(location, availability === "Available");
        prevAvailabilityRef.current = availability;
      }
    }
  }, [availability]);

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
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
            pinColor={availability === "Available" ? "green" : "red"}
            style={{ borderRadius: 40,borderWidth: 5,borderColor: "#08422d" }}
            
          >
            <Callout>
              <Text>Status: {availability}</Text>
            </Callout>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 250,
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
