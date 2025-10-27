import PencilIcon from '../assets/pencil.svg';
import TrashIcon from '../assets/trash.svg';
import Shimmer from './Shimmer';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isToday } from 'date-fns';
import { auth, db } from '../config/firebaseConfig';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface CalendarProps {
  onTagsUpdate: (tags: { [key: string]: { tag: string; value: number; type: 'income' | 'expense'; registeredAt?: string; createdAt?: string }[] }) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  scannedValue?: number;
  selectedDate?: string | Date;
  scanId?: string;
}

interface Tag {
  tag: string;
  value: number;
  type: 'income' | 'expense';
  registeredAt?: string;
  createdAt?: string;
}

interface CreatedTag {
  id: number;
  name: string;
}

const Calendar: React.FC<CalendarProps> = ({ onTagsUpdate, currentDate, setCurrentDate, scannedValue, selectedDate, scanId }) => {
  const [tags, setTags] = useState<{ [key: string]: Tag[] } | null>(null);
  const [createdTags, setCreatedTags] = useState<CreatedTag[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [newTagName, setNewTagName] = useState<string>('');
  const [showTagViewer, setShowTagViewer] = useState(false);
  const [selectedTagName, setSelectedTagName] = useState<string | null>(null);
  const [lastScanId, setLastScanId] = useState<string | null>(null);
  const [pendingScannedValue, setPendingScannedValue] = useState<{ value: number; scanId: string } | null>(null);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editedTagName, setEditedTagName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  const handleEditTag = (tag: CreatedTag) => {
    setEditingTagId(tag.id);
    setEditedTagName(tag.name);
  };

const handleDeleteTag = async (tagId: number) => {
  try {
    setDeletingTagId(tagId); // inicia o shimmer

    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      const tagNameToDelete = userData.createdTags?.find(tag => tag.id === tagId)?.name;

      const updatedTags = { ...userData.tags };
      for (const [day, tagArray] of Object.entries(updatedTags)) {
        if (Array.isArray(tagArray)) {
          updatedTags[day] = tagArray.filter(t => t.tag !== tagNameToDelete);
        }
      }

      // simula animação de “apagando” por 500ms
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedCreatedTags = (userData.createdTags || []).filter(tag => tag.id !== tagId);

      await updateDoc(userDocRef, {
        createdTags: updatedCreatedTags,
        tags: updatedTags,
      });

      setCreatedTags(updatedCreatedTags); // atualiza UI
      if (selectedTagName === tagNameToDelete) setSelectedTagName(null);
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
  } finally {
    setDeletingTagId(null); // finaliza shimmer
  }
};



  const memoizedOnTagsUpdate = useCallback((newTags: { [key: string]: Tag[] }) => {
    onTagsUpdate(newTags);
  }, [onTagsUpdate]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTags(null);
        setCreatedTags([]);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newTags = data.tags || {};
          setTags(newTags);
          setCreatedTags(data.createdTags || []);
          memoizedOnTagsUpdate(newTags);
        } else {
          setTags({});
          setCreatedTags([]);
          memoizedOnTagsUpdate({});
        }
      });

      return () => unsubscribeFirestore();
    });

    return () => unsubscribeAuth();
  }, [memoizedOnTagsUpdate]);

  useEffect(() => {
    if (scannedValue && scanId && selectedDate && lastScanId !== scanId) {
      const date = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      setPendingScannedValue({ value: scannedValue, scanId });
      setSelectedDay(date);
      setShowTagOptions(true);
      setInputValue(scannedValue.toFixed(2).replace('.', ','));
      setSelectedType('expense');
      setShowTagViewer(true);
      setLastScanId(scanId);
    }
  }, [scannedValue, scanId, selectedDate, lastScanId]);

  const handleCloseModal = () => {
    setShowTagOptions(false);
    setInputValue('');
    setSelectedType(null);
    setSelectedTagName(null);
    setShowTagViewer(false);
    setSelectedDay(null);
    setPendingScannedValue(null);
  };

  const handleTagSelect = async () => {
    if (!selectedDay || inputValue === '' || !selectedTagName || !selectedType) return;

    if (!auth.currentUser) {
      return;
    }

    const dayString = format(selectedDay, 'yyyy-MM-dd');
    const inputValueNumber = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(inputValueNumber) || inputValueNumber <= 0) {
      return;
    }

    const updatedTags = tags ? { ...tags } : {};
    if (!updatedTags[dayString]) updatedTags[dayString] = [];
    updatedTags[dayString].push({
      tag: selectedTagName,
      value: inputValueNumber,
      type: selectedType,
      registeredAt: selectedDay.toISOString(), // Calendar date
      createdAt: new Date().toISOString(), // Creation date (today)
    });

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { tags: updatedTags, createdTags }, { merge: true });
      setTags(updatedTags);
      memoizedOnTagsUpdate(updatedTags);
      setPendingScannedValue(null);
      handleCloseModal();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleSaveEditedTag = async () => {
    if (!editingTagId || editedTagName.trim() === '') return;

    try {
      setIsSaving(true);

      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Atualiza createdTags
        const updatedCreatedTags = (userData.createdTags || []).map(tag =>
          tag.id === editingTagId ? { ...tag, name: editedTagName } : tag
        );

        // Atualiza tags existentes que usam esse nome
        const updatedTags = { ...userData.tags };
        for (const [day, tagArray] of Object.entries(updatedTags)) {
          updatedTags[day] = tagArray.map(t =>
            t.tag === userData.createdTags?.find(tag => tag.id === editingTagId)?.name
              ? { ...t, tag: editedTagName }
              : t
          );
        }

        await updateDoc(userDocRef, {
          createdTags: updatedCreatedTags,
          tags: updatedTags,
        });

        setCreatedTags(updatedCreatedTags);
      }

      setEditingTagId(null);
      setEditedTagName('');
    } catch (error) {
      console.error('Error saving edited tag:', error);
    } finally {
      setIsSaving(false);
    }
  };


  const handleAddNewTag = async () => {
    if (newTagName.trim() === '') {
      return;
    }

    if (!auth.currentUser) {
      return;
    }

    const newCreatedTag = { id: createdTags.length + 1, name: newTagName.trim() };
    const updatedCreatedTags = [...createdTags, newCreatedTag];

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { createdTags: updatedCreatedTags, tags: tags || {} }, { merge: true });
      setCreatedTags(updatedCreatedTags);
      setSelectedTagName(newCreatedTag.name);
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleTagClick = (tagName: string) => {
    setSelectedTagName(selectedTagName === tagName ? null : tagName);
  };

  const handleTypeSelect = (type: 'income' | 'expense') => {
    setSelectedType(selectedType === type ? null : type);
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  const startDayOfWeek = startOfCurrentMonth.getDay();
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
  const emptyDaysStart = Array(startDayOfWeek).fill(null);
  const totalCells = 42;
  const emptyDaysEnd = Array(totalCells - emptyDaysStart.length - daysInMonth.length).fill(null);
  const calendarDays = [...emptyDaysStart, ...daysInMonth, ...emptyDaysEnd];
  const monthName = format(currentDate, 'MMMM yyyy');

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowTagOptions(true);
    if (pendingScannedValue) {
      setInputValue(pendingScannedValue.value.toFixed(2).replace('.', ','));
      setSelectedType('expense');
      setShowTagViewer(true);
    }
  };

  if (tags === null) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <View style={styles.arrowLeft}><Text style={styles.arrowText}>‹</Text></View>
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <View style={styles.arrowRight}><Text style={styles.arrowText}>›</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarWeekdays}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.calendarWeekday}>{day}</Text>
          ))}
        </View>

        <FlatList
          data={calendarDays}
          renderItem={({ item: day }) => {
            if (!day) return <View style={styles.calendarDayEmpty} />;

            const dayOfMonth = format(day, 'd');
            const dayString = format(day, 'yyyy-MM-dd');
            const currentTag = tags[dayString] || [];
            const hasIncome = currentTag.some((tag) => tag.type === 'income');
            const hasExpense = currentTag.some((tag) => tag.type === 'expense');

            return (
              <TouchableOpacity
                style={[styles.calendarDay, isToday(day) && styles.today]}
                onPress={() => handleDayClick(day)}
              >
                <View style={styles.dayContent}>
                  <Text style={styles.dayText}>{dayOfMonth}</Text>
                  {(hasIncome || hasExpense) && (
                    <View style={styles.tags}>
                      {hasIncome && <View style={[styles.tag, styles.income]} />}
                      {hasExpense && <View style={[styles.tag, styles.expense]} />}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(_, index) => index.toString()}
          numColumns={7}
          contentContainerStyle={styles.calendarGrid}
        />

        <Modal visible={showTagOptions} transparent animationType="fade">
          <View style={styles.tagOptions}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.inputValue}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
            />
            <View style={styles.tagSelection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleTypeSelect('income')}
              >
                <View style={[styles.checkbox, selectedType === 'income' && styles.checkboxSelected]}>
                  {selectedType === 'income' && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleTypeSelect('expense')}
              >
                <View style={[styles.checkbox, selectedType === 'expense' && styles.checkboxSelected]}>
                  {selectedType === 'expense' && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Expense</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.tagViewerToggle}
              onPress={() => setShowTagViewer(!showTagViewer)}
            >
              <Text style={styles.tagViewerText}>Tags</Text>
              <Text style={styles.tagViewerArrow}>{showTagViewer ? '▲' : '▼'}</Text>
            </TouchableOpacity>
{showTagViewer && (
  <View style={styles.tagViewerContainer}>
    <ScrollView style={styles.tagViewer}>
      {createdTags && createdTags.length > 0 ? (
        createdTags.map((tag) => (
          <View
            key={tag.id}
            style={[
              styles.tagItemContainer,
              deletingTagId === tag.id && { opacity: 0.5 }, // efeito simples de "apagando"
            ]}
          >
            {editingTagId === tag.id ? (
              <>
                <TextInput
                  style={styles.editTagInput}
                  value={editedTagName}
                  onChangeText={setEditedTagName}
                  placeholder="Edit tag name"
                />
                <TouchableOpacity
                  onPress={handleSaveEditedTag}
                  style={[styles.saveEditButton, isSaving && styles.saveEditButtonDisabled]}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveEditText}>{isSaving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.tagNameContainer}>
                  <TouchableOpacity
                    style={[styles.tagItem, selectedTagName === tag.name && styles.tagItemSelected]}
                    onPress={() => handleTagClick(tag.name)}
                  >
                    <Text>{tag.name}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => handleEditTag(tag)} style={styles.editButton}>
                  <PencilIcon width={16} height={16} color="#3D9F44" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDeletingTagId(tag.id); // inicia animação
                    setTimeout(() => handleDeleteTag(tag.id), 300); // espera 300ms e deleta
                  }}
                  style={styles.editButton}
                >
                  <TrashIcon width={16} height={16} color="#DF2F2F" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noTagsMessage}>No tags available.</Text>
      )}
    </ScrollView>

    <TextInput
      style={styles.tagInput}
      value={newTagName}
      onChangeText={setNewTagName}
      placeholder="New tag name"
    />
    <TouchableOpacity style={styles.addTagButton} onPress={handleAddNewTag}>
      <Text style={styles.addTagButtonText}>Add New Tag</Text>
    </TouchableOpacity>
  </View>
)}

            <TouchableOpacity
              style={[
                styles.saveButton,
                !(inputValue !== '' && selectedTagName && selectedType) && styles.saveButtonDisabled,
              ]}
              onPress={handleTagSelect}
              disabled={!(inputValue !== '' && selectedTagName && selectedType)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    width: '100%',
    maxWidth: 600,
  },
  calendar: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  arrowLeft: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowRight: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#3D9F44',
    fontWeight: 'bold',
    lineHeight: 30,
  },
  monthName: {
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#3D9F44',
    fontFamily: 'LexendDeca_400Regular',
    fontSize: 12,
  },
  calendarGrid: {
    padding: 5,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  today: {
    backgroundColor: '#b7ecbb',
  },
  calendarDayEmpty: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: 'transparent',
  },
  dayContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    textAlign: 'center',
  },
  tags: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    flexDirection: 'column',
    gap: 2,
    alignItems: 'flex-end',
  },
  tag: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  income: {
    backgroundColor: '#3D9F44',
  },
  expense: {
    backgroundColor: '#DF2F2F',
  },
  tagOptions: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -160 }, { translateY: -200 }],
    width: 320,
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeModalText: {
    fontSize: 24,
    color: '#888',
  },
  inputValue: {
    width: '90%',
    padding: 12,
    fontSize: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3D9F44',
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 20,
  },
  tagSelection: {
    marginTop: 20,
    flexDirection: 'column',
    gap: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3D9F44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#3D9F44',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular',
  },
  tagViewerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  tagViewerText: {
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
  },
  tagViewerArrow: {
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
  },
  tagViewerContainer: {
    width: '100%',
    marginTop: 10,
  },
  tagViewer: {
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 5,
  },
  tagItem: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 5,
  },
  tagItemSelected: {
    backgroundColor: '#b7ecbb',
  },
  noTagsMessage: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
  },
  tagInput: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: 'LexendDeca_400Regular',
  },
  addTagButton: {
    padding: 8,
    backgroundColor: '#3D9F44',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  addTagButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'LexendDeca_400Regular',
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#3D9F44',
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'LexendDeca_400Regular',
  },

  editIconButton: {
  marginLeft: 8,
  padding: 4,
},

tagNameContainer: {
  flex: 1,
},

editTagInput: {
  flex: 1,
  borderWidth: 1,
  borderRadius: 8,
  padding: 6,
  fontFamily: 'LexendDeca_400Regular',
},

saveEditButton: {
  backgroundColor: '#3D9F44',
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginLeft: 8,
  alignItems: 'center',
  justifyContent: 'center',
},

saveEditText: {
  color: 'white',
  fontWeight: '600',
  fontSize: 14,
},

saveEditButtonDisabled: {
  opacity: 0.6,
},


tagItemContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  marginBottom: 5,
  paddingHorizontal: 10,
  paddingVertical: 1,
},

editButton: {
  backgroundColor: 'transparent', 
  padding: 4,
},


});

export default Calendar;