import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebaseConfig";

const MapSectionFD = () => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const universityCoordinates = {
    latitude: 31.110484,
    longitude: 72.384598,
    radius: 0.005,
  };

  useEffect(() => {
    fetchLocation();

    const intervalId = setInterval(fetchLocation, 5 * 60000);
    return () => clearInterval(intervalId);
  }, []);

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

      saveLocationToFirestore(coords, isAvailable);
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
    try {
      await addDoc(collection(firestore, "facultyAvailability"), {
        latitude: coords.latitude,
        longitude: coords.longitude,
        availability: isAvailable ? "Available" : "Unavailable",
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving location to Firestore:", error);
    }
  };

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
            description="Faculty's current position"
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#08422d", marginBottom: 10 },
});

export default MapSectionFD;
