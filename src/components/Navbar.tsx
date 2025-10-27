import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Image, Modal, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import LogoutIcon from '../assets/logout.svg'; // Import the logout SVG

interface NavbarProps {
  setUser: (user: any | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      signOut(auth)
        .then(() => {
          setUser(null);
          navigation.navigate('Auth');
        })
        .catch((error) => console.error('Error logging out:', error));
    });
  };

  const menuWidth = '60%';
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.navbar}>
      <View style={styles.navbarLogo}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>

      <TouchableOpacity style={styles.navbarHamburger} onPress={toggleMenu}>
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      <Modal visible={isMenuOpen} animationType="none" transparent>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTouchable} onPress={toggleMenu}>
            <Animated.View
              style={[
                styles.menuOverlay,
                {
                  transform: [{ translateX }],
                  width: menuWidth,
                },
              ]}
            >
              <View style={styles.menuContent}>
                <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuLinkContainer} onPress={handleLogout}>
                  <LogoutIcon width={24} height={24}  stroke="#ffffff" />
                  <Text style={styles.menuLink}>Logout</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  navbarLogo: {
    justifyContent: 'center',
    height: 60,
  },
  logo: {
    height: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  navbarHamburger: {
    flexDirection: 'column',
    gap: 5,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#3D9F44',
    borderRadius: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuOverlay: {
    height: '100%',
    backgroundColor: '#3D9F44',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuContent: {
    flexDirection: 'column',
    gap: 20,
    width: '100%',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
  },
  menuLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLink: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'LexendDeca_400Regular',
  },
});

export default Navbar;