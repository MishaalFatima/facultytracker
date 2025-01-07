import React, { useEffect, useState } from "react";
import { View, Button, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import LoadingScreen from "../LoadingScreen";


const EnableGPSButtonFD = () => {

  const [loading, setLoading] = useState(false);

  const enableLocation = async () => {
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow location permissions.');
      return;
    }

    const isLocationEnabled = await Location.hasServicesEnabledAsync();

    if (!isLocationEnabled) {
      try {
            const { coords } = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            console.log("Location is turned on");
          } catch (error) {
            console.log("Error fetching location", error);
          } finally{
            setLoading(false);
          }
    } else {
      Alert.alert('Location Enabled', 'Location services are already enabled.');
    }
  };
  if (loading) {
    return <LoadingScreen />; // Show the loading screen when loading state is true
  }

  return (
    <View style={styles.statusContainer}>
      <Button title="Enable GPS" color="#08422d" onPress={enableLocation} />
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderColor: '#08422d',
    borderWidth: 1,
  },
});

export default EnableGPSButtonFD;
