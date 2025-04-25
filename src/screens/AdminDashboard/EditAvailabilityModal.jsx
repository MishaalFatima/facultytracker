import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { MaterialIcons } from "@expo/vector-icons";

const EditAvailabilityModal = ({ visible, record, onClose, onSave }) => {
  const [availability, setAvailability] = useState(record?.availability || 'Available');
  const [location, setLocation] = useState(record?.location || '');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Available', value: 'Available' },
    { label: 'Unavailable', value: 'Unavailable' }
  ]);

  // Update local state when record prop changes
  useEffect(() => {
    setAvailability(record?.availability || 'Available');
    setLocation(record?.location || '');
  }, [record]);

  const handleSave = () => {
    onSave({
      availability,
      location,
      updateTime: new Date()
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Availability Record</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <DropDownPicker
            open={open}
            value={availability}
            items={items}
            setOpen={setOpen}
            setValue={setAvailability}
            setItems={setItems}
            placeholder="Select Availability"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <TextInput
            style={styles.input}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdown: {
    borderColor: '#08422d',
    marginBottom: 10,
  },
  dropdownContainer: {
    borderColor: '#08422d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#08422d',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#08422d',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EditAvailabilityModal;
