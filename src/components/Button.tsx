import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  text: string;
  mode: 'green' | 'red';
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ text, mode, onClick }) => {
  return (
    <TouchableOpacity
      style={[styles.button, mode === 'green' ? styles.green : styles.red]}
      onPress={onClick}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LexendDeca-Regular',
  },
  green: {
    backgroundColor: '#3D9F44',
  },
  red: {
    backgroundColor: '#DF2F2F',
  },
});

export default Button;