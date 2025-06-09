import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import PencilIcon from '../assets/pencil.svg';
import TrashIcon from '../assets/trash.svg';

interface FinancialGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
}

interface FinancialGoalsProps {
  totalBalance: number;
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({ totalBalance }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (!auth?.currentUser) return;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGoals(data.goals || []);
      } else {
        setGoals([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateProgress = (targetValue: number) => {
    const progress = targetValue > 0 ? Math.min((totalBalance / targetValue) * 100, 100) : 0;
    return progress;
  };

  const handleNewGoal = () => {
    navigation.navigate('NewGoal', { goal: null });
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    navigation.navigate('NewGoal', { goal });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!auth.currentUser) return;

    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { goals: updatedGoals }, { merge: true });
    setGoals(updatedGoals);
  };

  return (
    <View style={styles.goalsContainer}>
      <Text style={styles.goalsTitle}>Financial Goals</Text>
      <TouchableOpacity style={styles.addButton} onPress={handleNewGoal}>
        <Text style={styles.addButtonText}>New Goal</Text>
      </TouchableOpacity>
      <View style={styles.goalsList}>
        {goals.length === 0 ? (
          <Text style={styles.noGoalsText}>No goals set yet.</Text>
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditGoal(goal)}
                  >
                    <PencilIcon width={16} height={16}  />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteGoal(goal.id)}
                  >
                    <TrashIcon width={16} height={16} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.goalContent}>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                <Text style={styles.goalValue}>
                  ${totalBalance.toFixed(2)} / ${goal.targetValue.toFixed(2)}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${calculateProgress(goal.targetValue)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {calculateProgress(goal.targetValue).toFixed(1)}% Complete
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  goalsContainer: {
    padding: 20,
    flex: 1,
  },
  goalsTitle: {
    fontSize: 24,
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3d9f44',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
  goalsList: {
    flexDirection: 'column',
    gap: 10,
  },
  goalCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalName: {
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
    flex: 1,
  },
  goalContent: {
    flex: 1,
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    color: '#666',
    marginBottom: 10,
  },
  goalValue: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    color: '#333',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3d9f44',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'LexendDeca_400Regular',
    color: '#333',
  },
  noGoalsText: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  editButton: {
    borderColor: '#3D9F44',
  },
  deleteButton: {
    borderColor: '#DF2F2F',
  },
});

export default FinancialGoals;