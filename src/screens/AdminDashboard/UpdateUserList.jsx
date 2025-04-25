import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const UpdateUserList = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    designation: ''
  });

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleItems] = useState([
    { label: 'Admin', value: 'Admin' },
    { label: 'Faculty', value: 'Faculty' },
    { label: 'CR/GR', value: 'CR/GR' },
    { label: 'Principal', value: 'Principal' }
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          Alert.alert('Error', 'User not found');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleUpdate = async () => {
    if (!userData.name || !userData.role) {
      Alert.alert('Validation Error', 'Name and Role are required');
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(firestore, 'users', userId), userData);
      Alert.alert('Success', 'User updated successfully');
      navigation.navigate('AllUsers', { refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit User</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Role</Text>
        <DropDownPicker
          open={roleOpen}
          value={userData.role}
          items={roleItems}
          setOpen={setRoleOpen}
          setValue={(value) => setUserData({ ...userData, role: value })}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={userData.department}
          onChangeText={(text) => setUserData({ ...userData, department: text })}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#08422d',
      marginBottom: 20,
      textAlign: 'center',
    },
    formGroup: {
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      color: '#08422d',
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: '#08422d',
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
    },
    disabledInput: {
      backgroundColor: '#f0f0f0',
    },
    dropdown: {
      borderColor: '#08422d',
    },
    dropdownContainer: {
      borderColor: '#08422d',
      marginTop: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      borderRadius: 5,
      padding: 15,
      width: '48%',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#ccc',
    },
    saveButton: {
      backgroundColor: '#08422d',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  
  export default UpdateUserList;