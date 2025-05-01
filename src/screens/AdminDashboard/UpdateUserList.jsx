import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const roleFields = {
  Admin: [
    'name',
    'email',
    'gender',
    'registrationNumber',
    'phoneNumber',
    'imageUrl'
  ],
  Faculty: [
    'name',
    'email',
    'gender',
    'registrationNumber',
    'phoneNumber',
    'designation',
    'FacultyType',
    'department',
    'imageUrl'
  ],
  'CR/GR': [
    'name',
    'email',
    'gender',
    'registrationNumber',
    'phoneNumber',
    'department',
    'program',
    'session',
    'semester'
  ],
  Principal: [
    'name',
    'email',
    'gender',
    'registrationNumber',
    'campusName',
    'phoneNumber',
    'designation',
    'imageUrl'
  ]
};

const genderOptions = ['Male', 'Female', 'Other'];

// Regex for numeric-only fields
const numericFieldRegex = /(phoneNumber|registrationNumber)/;

const UpdateUserList = () => {
  const { userId } = useRoute().params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [userData, setUserData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Load user data & departments
  useEffect(() => {
    const load = async () => {
      try {
        const udoc = await getDoc(doc(firestore, 'users', userId));
        if (!udoc.exists()) {
          Alert.alert('Error', 'User not found');
          return navigation.goBack();
        }
        setUserData(udoc.data());

        const depSnap = await getDocs(collection(firestore, 'departments'));
        setDepartments(
          depSnap.docs.map(d => ({
            label: d.data().name,
            value: d.id
          }))
        );
      } catch (e) {
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, navigation]);

  // Reload programs when department changes (for CR/GR)
  useEffect(() => {
    if (userData.role !== 'CR/GR' || !userData.department) {
      setPrograms([]);
      return;
    }
    (async () => {
      try {
        const q = query(
          collection(firestore, 'programs'),
          where('departmentId', '==', userData.department)
        );
        const snap = await getDocs(q);
        setPrograms(
          snap.docs.map(d => ({
            label: d.data().name,
            value: d.id
          }))
        );
      } catch {
        setPrograms([]);
      }
    })();
  }, [userData.department, userData.role]);

  // Image picker + upload
  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });
    if (res.canceled) return;
    try {
      const blob = await (await fetch(res.assets[0].uri)).blob();
      const storage = getStorage();
      const imgRef = ref(storage, `profile_images/${userId}.jpg`);
      await uploadBytes(imgRef, blob);
      const url = await getDownloadURL(imgRef);
      setUserData(prev => ({ ...prev, imageUrl: url }));
      Alert.alert('Success', 'Image uploaded');
    } catch {
      Alert.alert('Error', 'Failed to upload');
    }
  };

  // Save updates
  const handleUpdate = async () => {
    if (!userData.name || !userData.email) {
      return Alert.alert('Validation', 'Name & email are required');
    }
    setUpdating(true);
    try {
      await updateDoc(doc(firestore, 'users', userId), userData);
      Alert.alert('Success', 'User updated');
      navigation.navigate('AllUsers', { refresh: true });
    } catch {
      Alert.alert('Error', 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  const fields = roleFields[userData.role] || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit {userData.role}</Text>

      {/* Image upload */}
      {fields.includes('imageUrl') && (
        <>
          <Image
            source={{
              uri: userData.imageUrl || 'https://via.placeholder.com/100'
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
            <Text style={styles.uploadTxt}>Change Image</Text>
          </TouchableOpacity>
        </>
      )}

      {fields.map(key => {
        if (key === 'imageUrl') return null;

        // department picker
        if (key === 'department') {
          return (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>Department</Text>
              <Picker
                selectedValue={userData.department}
                onValueChange={val =>
                  setUserData(prev => ({ ...prev, department: val }))
                }
              >
                <Picker.Item label="Select…" value="" />
                {departments.map(d => (
                  <Picker.Item key={d.value} label={d.label} value={d.value} />
                ))}
              </Picker>
            </View>
          );
        }

        // program picker
        if (key === 'program') {
          return (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>Program</Text>
              <Picker
                selectedValue={userData.program}
                onValueChange={val =>
                  setUserData(prev => ({ ...prev, program: val }))
                }
              >
                <Picker.Item label="Select…" value="" />
                {programs.map(p => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
          );
        }

        // gender picker
        if (key === 'gender') {
          return (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <Picker
                selectedValue={userData.gender}
                onValueChange={val =>
                  setUserData(prev => ({ ...prev, gender: val }))
                }
              >
                <Picker.Item label="Select…" value="" />
                {genderOptions.map(g => (
                  <Picker.Item key={g} label={g} value={g} />
                ))}
              </Picker>
            </View>
          );
        }

        // text inputs
        return (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>
              {key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim()}
            </Text>
            <TextInput
              style={styles.input}
              value={userData[key]?.toString() || ''}
              onChangeText={t =>
                setUserData(prev => ({ ...prev, [key]: t }))
              }
              keyboardType={
                numericFieldRegex.test(key) ? 'numeric' : 'default'
              }
            />
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleUpdate}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveTxt}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fafafa'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#08422d',
    marginBottom: 20,
    textAlign: 'center'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10
  },
  uploadBtn: {
    backgroundColor: '#08422d',
    padding: 10,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 20
  },
  uploadTxt: {
    color: '#fff',
    fontWeight: '600'
  },
  field: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    color: '#08422d',
    marginBottom: 5
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10
  },
  saveBtn: {
    backgroundColor: '#08422d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  saveTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default UpdateUserList;
