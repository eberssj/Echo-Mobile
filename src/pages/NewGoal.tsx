import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import BottomNavbar from '../components/BottomNavbar';

interface FinancialGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
}

interface NewGoalProps {
  setUser: (user: any | null) => void;
}

const NewGoal: React.FC<NewGoalProps> = ({ setUser }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { goal } = route.params as { goal: FinancialGoal | null };

  const [name, setName] = useState(goal?.name || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [targetValue, setTargetValue] = useState(goal?.targetValue.toString() || '');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setDescription(goal.description);
      setTargetValue(goal.targetValue.toString());
    }
  }, [goal]);

  const handleSave = async () => {
    if (!name.trim() || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      return;
    }

    const updatedGoal: FinancialGoal = {
      id: goal?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      description: description.trim(),
      targetValue: Number(targetValue),
    };

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const currentGoals = userDoc.data()?.goals || [];

      let newGoals;
      if (goal) {
        newGoals = currentGoals.map((g: FinancialGoal) =>
          g.id === updatedGoal.id ? updatedGoal : g
        );
      } else {
        newGoals = [...currentGoals, updatedGoal];
      }

      await setDoc(userDocRef, { goals: newGoals }, { merge: true });
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <View style={styles.content}>
        <Text style={styles.title}>{goal ? 'Edit Goal' : 'Create New Goal'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Goal Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Target Value"
          value={targetValue}
          onChangeText={setTargetValue}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{goal ? 'Update Goal' : 'Save Goal'}</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 24,
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3d9f44',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 15,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3d9f44',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
});

export default NewGoal;