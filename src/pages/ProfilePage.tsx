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
  const navigation = useNavigation<any>();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!isMounted.current) return;
      if (user) setEmail(user.email || '');
      else navigation.navigate('Auth');
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
    } catch {
      Alert.alert('Error', 'Failed to send reset link.');
    }
  };

  const handleConfirmDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteUser(user);
      await signOut(auth);
      setUser(null);
      setShowDeleteModal(false);
      Alert.alert('Success', 'Account deleted.');
      navigation.navigate('Auth');
    } catch {
      setShowDeleteModal(false);
      Alert.alert('Error', 'Please log in again to delete.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Conteúdo principal */}
      <View style={styles.content}>
        <Navbar setUser={setUser} />
        <View style={styles.innerContent}>
          <Text style={styles.title}>Profile Settings</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email:</Text>
            <TextInput style={styles.input} value={email} editable={false} />

            <Text style={styles.label}>Change Password:</Text>
            <Text style={styles.info}>Request a reset link via email.</Text>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendResetLink}>
              <Text style={styles.sendBtnText}>Send Reset Link</Text>
            </TouchableOpacity>
          </View>

          {showPopup && (
            <View style={styles.popup}>
              <Text style={styles.popupText}>Check your email!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botão Delete Account - pequeno e na base */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalText}>This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={handleConfirmDelete}>
                <Text style={styles.btnTextWhite}>Delete</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  innerContent: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontFamily: 'LexendDeca_400Regular', marginBottom: 20 },
  form: { width: '100%', maxWidth: 600 },
  label: { fontSize: 14, color: '#333', marginBottom: 5, fontFamily: 'LexendDeca_400Regular' },
  input: { 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    backgroundColor: '#f9f9f9',
    fontFamily: 'LexendDeca_400Regular'
  },
  info: { fontSize: 12, color: '#666', marginTop: 5, fontFamily: 'LexendDeca_400Regular' },
  sendBtn: { 
    backgroundColor: '#3d9f44', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    marginTop: 12,
    alignSelf: 'flex-start'
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontFamily: 'LexendDeca_400Regular' },
  popup: { 
    backgroundColor: '#3d9f44', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 10,
    alignItems: 'center'
  },
  popupText: { color: '#fff', fontFamily: 'LexendDeca_400Regular' },

  // Botão pequeno na base
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deleteText: {
    color: '#DF2F2F',
    fontSize: 15,
    fontFamily: 'LexendDeca_400Regular',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: 300, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, fontFamily: 'LexendDeca_400Regular' },
  modalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, fontFamily: 'LexendDeca_400Regular' },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: { flex: 1, backgroundColor: '#ccc', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnDelete: { flex: 1, backgroundColor: '#DF2F2F', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontFamily: 'LexendDeca_400Regular' },
  btnTextWhite: { color: '#fff', fontFamily: 'LexendDeca_400Regular' },
});

export default ProfilePage;