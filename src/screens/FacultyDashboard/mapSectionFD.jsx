import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
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
import LockScreenModal from "./LockScreenModal"; // Adjust the path as needed

const MapSectionFD = () => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [availability, setAvailability] = useState("Unavailable");
  const [notificationId, setNotificationId] = useState(null);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reference for the active facultyAvailability document.
  const activeAvailabilityDocRef = useRef(null);
  const prevAvailabilityRef = useRef();

  // We'll store our interval ID for scheduling notifications.
  const notificationIntervalRef = useRef(null);

  const universityCoordinates = {
    latitude: 32.424264,
    longitude: 74.113631,
    radius: 0.005,
  };

  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log("User responded to notification", response);
        setShowLockScreen(true);
      }
    );
    return () => subscription.remove();
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
      const q = query(
        collection(firestore, "facultyAvailability"),
        where("userId", "==", currentUser.uid),
        orderBy("creationTime", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const activeDoc = querySnapshot.docs[0];
        if (!activeDoc.data().endTime) {
          const activeDuration = Math.round(
            (Date.now() - activeDoc.data().creationTime.toMillis()) / 1000
          );
          await updateDoc(activeDoc.ref, {
            activeDuration,
            endTime: serverTimestamp(),
            responded: activeDoc.data().responded === true ? true : false,
          });
          activeAvailabilityDocRef.current = null;
        }
      }

      const docRef = await addDoc(
        collection(firestore, "facultyAvailability"),
        {
          userId: currentUser.uid,
          latitude: coords.latitude,
          longitude: coords.longitude,
          availability: isAvailable ? "Available" : "Unavailable",
          creationTime: serverTimestamp(),
          responded: false,
        }
      );
      activeAvailabilityDocRef.current = docRef;
    } catch (error) {
      console.log("Error handling document:", error);
    }
  };

  useEffect(() => {
    if (availability !== null && location) {
      if (prevAvailabilityRef.current !== availability) {
        handleDocument(location, availability === "Available");
        prevAvailabilityRef.current = availability;
      }
    }
  }, [availability]);

  const scheduleOneShotNotification = async () => {
    try {
      if (activeAvailabilityDocRef.current) {
        await updateDoc(activeAvailabilityDocRef.current, { responded: false });
        console.log("Active document updated with responded: false");
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Unlock Phone",
          body: "Please unlock your phone password.",
        },
        trigger: { seconds: 60 },
      });
      setNotificationId(id);
      console.log("Scheduled one-shot notification with id:", id);
    } catch (error) {
      console.log("Error scheduling one-shot notification:", error);
    }
  };

  const cancelCurrentNotification = async () => {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log("Cancelled notification with id:", notificationId);
        setNotificationId(null);
      }
    } catch (error) {
      console.log("Error cancelling notification:", error);
    }
  };

  useEffect(() => {
    if (availability === "Available") {
      cancelCurrentNotification();
      scheduleOneShotNotification();
      notificationIntervalRef.current = setInterval(() => {
        scheduleOneShotNotification();
      }, 60000);
    } else {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
      cancelCurrentNotification();
    }
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      cancelCurrentNotification();
    };
  }, [availability]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      fetchLocation();
      const interval = setInterval(fetchLocation, 5000);
      return () => clearInterval(interval);
    })();
  }, []);

  const handleUnlockSuccess = async () => {
    if (activeAvailabilityDocRef.current) {
      try {
        await updateDoc(activeAvailabilityDocRef.current, {
          responded: true,
          responseTime: serverTimestamp(),
        });
        console.log("Active document updated with responded: true after unlock");
      } catch (error) {
        console.error("Error updating response field after unlock:", error);
      }
    }
    setShowLockScreen(false);
  };

  if (errorMsg) {
    return (
      <View style={styles.mapContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.mapContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

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
            style={{ borderRadius: 40, borderWidth: 5, borderColor: "#08422d" }}
          >
            <Callout>
              <Text>Status: {availability}</Text>
            </Callout>
          </Marker>
        )}
      </MapView>
      <LockScreenModal
        visible={showLockScreen}
        onUnlock={handleUnlockSuccess}
        onCancel={() => setShowLockScreen(false)}
      />
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
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    margin: 20,
  },
});

export default MapSectionFD;
