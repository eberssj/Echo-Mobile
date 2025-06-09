import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigation = useNavigation();

  const handleAuth = async () => {
    setPasswordError('');

    if (mode === 'signup') {
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Account created successfully');
      }
      navigation.navigate('Home');
    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already in use.'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email.'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : error.code === 'auth/user-not-found'
        ? 'User not found.'
        : 'An error occurred. Please try again.';
      setPasswordError(errorMessage);
      console.error('Authentication error:', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>
          {mode === 'login' ? 'Sign in to your' : 'Create your'}{' '}
          <Text style={styles.echoText}>Echo</Text> account
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}
        {passwordError && (
          <Text style={styles.errorText}>{passwordError}</Text>
        )}

        <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
          <Text style={styles.authButtonText}>
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Text
            style={styles.switchLink}
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setPasswordError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  authContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'LexendDeca-Regular',
  },
  echoText: {
    color: '#3D9F44',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'LexendDeca-Regular',
  },
  authButton: {
    backgroundColor: '#3D9F44',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'LexendDeca-Regular',
  },
  switchText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333',
    fontFamily: 'LexendDeca-Regular',
  },
  switchLink: {
    color: '#3D9F44',
    fontWeight: 'bold',
    fontFamily: 'LexendDeca-Regular',
  },
  errorText: {
    color: '#DF2F2F',
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'LexendDeca-Regular',
  },
});

export default AuthScreen;