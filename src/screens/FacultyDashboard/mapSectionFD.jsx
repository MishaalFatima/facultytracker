import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
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
  const [availability, setAvailability] = useState(null);

  const universityCoordinates = {
    latitude: 32.29194,
    longitude: 72.27361,
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
      // Query for documents without `endTime`
       const q = query(
              collection(firestore, "facultyAvailability"),
              where("userId", "==", currentUser.uid),
              orderBy("creationTime", "desc"),
              limit(1)
            );
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        // Found an active document
        const activeDoc = querySnapshot.docs[0];
        const activeDocRef = activeDoc.ref;
  
        if (isAvailable) {
          // User is now in campus; close the active document
          const activeDuration = Math.round(
            (Date.now() - activeDoc.data().creationTime.toMillis()) / 1000
          );
          await updateDoc(activeDocRef, {
            activeDuration,
            endTime: serverTimestamp(),
          });
        } else {
          // User is not in campus; update the duration
          const activeDuration = Math.round(
            (Date.now() - activeDoc.data().creationTime.toMillis()) / 1000
          );
          await updateDoc(activeDocRef, {
            activeDuration,
          });
        }
      } else {
        // No active document found, create a new one
        await addDoc(collection(firestore, "facultyAvailability"), {
          userId: currentUser.uid,
          latitude: coords.latitude,
          longitude: coords.longitude,
          availability: isAvailable ? "Available" : "Unavailable",
          creationTime: serverTimestamp(),
        });
      }
    } catch (error) {
      console.log("Error handling document:", error);
    }
  };
  
  useEffect(() => {
    if (availability !== null) {
      handleDocument(location, availability === "Available");
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
