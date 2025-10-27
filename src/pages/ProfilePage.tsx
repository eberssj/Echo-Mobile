import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import Navbar from '../components/Navbar';
import BottomNavbar from '../components/BottomNavbar';

interface ProfilePageProps {
  setUser: (user: any | null) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setUser }) => {
  const [email, setEmail] = useState<string>('');
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const navigation = useNavigation();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!auth) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!isMounted.current) return;

      if (user) {
        setEmail(user.email || '');
      } else {
        navigation.navigate('Auth');
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [navigation]);

  const handleSendResetLink = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
        await signOut(auth);
        setUser(null);
        setShowDeleteModal(false);
        Alert.alert('Success', 'Account deleted successfully.');
        navigation.navigate('Auth');
      } catch (error: any) {
        setShowDeleteModal(false);
        Alert.alert('Error', 'Failed to delete account. Please log in again to perform this action.');
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <View style={styles.content}>
        <Text style={styles.profileTitle}>Profile Settings</Text>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Change Password:</Text>
            <Text style={styles.infoText}>
              To change your password, request a reset link via email.
            </Text>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendResetLink}>
              <Text style={styles.sendButtonText}>Send Reset Link</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showPopup && (
          <View style={styles.popup}>
            <Text style={styles.popupText}>Check your email for the password reset link.</Text>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelDelete}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Espaço para a navbar fixa
  },
  profileTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'LexendDeca_400Regular',
    color: '#000',
    textAlign: 'left',
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'LexendDeca_400Regular',
  },
  input: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    fontFamily: 'LexendDeca_400Regular',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'LexendDeca_400Regular',
  },
  sendButton: {
    backgroundColor: '#3d9f44',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
  popup: {
    backgroundColor: '#3d9f44',
    padding: 10,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  popupText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular',
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#DF2F2F',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
    color: '#000',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#999',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
  modalDeleteButton: {
    backgroundColor: '#DF2F2F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  modalDeleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
});

export default ProfilePage;