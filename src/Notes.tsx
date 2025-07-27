import React from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Note from './components/Note';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {TRootStackParamList} from './App';
/* SECURITY ENHANCEMENT: Import security utilities for secure data handling */
import {SecurityUtils} from './utils/SecurityUtils';
import {AuthService} from './services/AuthService';

export interface INote {
  title: string;
  text: string;
  /* SECURITY ENHANCEMENT: Add metadata for better security tracking */
  createdAt: number;
  id: string;
}

interface IProps {}

interface IState {
  notes: INote[];
  newNoteTitle: string;
  newNoteEquation: string;
  /* SECURITY ENHANCEMENT: Add loading and error states */
  isLoading: boolean;
  error: string | null;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Notes'> & IProps;

export default class Notes extends React.Component<TProps, IState> {
  constructor(props: Readonly<TProps>) {
    super(props);

    this.state = {
      notes: [],
      newNoteTitle: '',
      newNoteEquation: '',
      /* SECURITY ENHANCEMENT: Initialize security-related state */
      isLoading: false,
      error: null,
    };

    this.onNoteTitleChange = this.onNoteTitleChange.bind(this);
    this.onNoteEquationChange = this.onNoteEquationChange.bind(this);
    this.addNote = this.addNote.bind(this);
    /* SECURITY ENHANCEMENT: Add logout handler */
    this.handleLogout = this.handleLogout.bind(this);
  }

  public async componentDidMount() {
    this.setState({isLoading: true});
    try {
      const existing = await this.getStoredNotes();
      this.setState({notes: existing, error: null});
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.setState({error: 'Failed to load notes'});
    } finally {
      this.setState({isLoading: false});
    }
  }

  public async componentWillUnmount() {
    try {
      await this.storeNotes(this.state.notes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }

  /* SECURITY ENHANCEMENT: Secure note storage using user ID instead of password */
  private async getStoredNotes(): Promise<INote[]> {
    try {
      /* SECURITY ENHANCEMENT: Use secure user ID for storage key instead of password */
      const storageKey = `notes_${this.props.route.params.user.userId}`;
      const notesData = await SecurityUtils.secureRetrieve(storageKey);

      if (notesData) {
        return JSON.parse(notesData);
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to retrieve notes:', error);
      return [];
    }
  }

  /* SECURITY ENHANCEMENT: Secure note storage with encryption */
  private async storeNotes(notes: INote[]) {
    try {
      /* SECURITY ENHANCEMENT: Use secure user ID for storage key */
      const storageKey = `notes_${this.props.route.params.user.userId}`;
      const jsonValue = JSON.stringify(notes);
      await SecurityUtils.secureStore(storageKey, jsonValue);
    } catch (error) {
      console.error('Failed to store notes:', error);
      throw error;
    }
  }

  /* SECURITY ENHANCEMENT: Input validation and sanitization for note title */
  private onNoteTitleChange(value: string) {
    const validation = SecurityUtils.validateAndSanitizeInput(value, 'text');

    if (!validation.isValid) {
      this.setState({error: validation.errors.join(', ')});
      return;
    }

    this.setState({
      newNoteTitle: validation.sanitized,
      error: null,
    });
  }

  /* SECURITY ENHANCEMENT: Input validation and sanitization for note content */
  private onNoteEquationChange(value: string) {
    const validation = SecurityUtils.validateAndSanitizeInput(value, 'text');

    if (!validation.isValid) {
      this.setState({error: validation.errors.join(', ')});
      return;
    }

    this.setState({
      newNoteEquation: validation.sanitized,
      error: null,
    });
  }

  /* SECURITY ENHANCEMENT: Secure note creation with proper validation */
  private async addNote() {
    if (this.state.isLoading) return;

    /* SECURITY ENHANCEMENT: Validate inputs before creating note */
    const titleValidation = SecurityUtils.validateAndSanitizeInput(
      this.state.newNoteTitle,
      'text',
    );
    const textValidation = SecurityUtils.validateAndSanitizeInput(
      this.state.newNoteEquation,
      'text',
    );

    if (!titleValidation.isValid || !textValidation.isValid) {
      const errors = [...titleValidation.errors, ...textValidation.errors];
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    if (
      titleValidation.sanitized.trim() === '' ||
      textValidation.sanitized.trim() === ''
    ) {
      Alert.alert('Error', 'Title and equation cannot be empty.');
      return;
    }

    this.setState({isLoading: true});

    try {
      /* SECURITY ENHANCEMENT: Create note with secure ID and timestamp */
      const note: INote = {
        title: titleValidation.sanitized,
        text: textValidation.sanitized,
        createdAt: Date.now(),
        id: SecurityUtils.generateSecureUserId(
          titleValidation.sanitized + Date.now(),
        ),
      };

      const updatedNotes = [...this.state.notes, note];
      await this.storeNotes(updatedNotes);

      this.setState({
        notes: updatedNotes,
        newNoteTitle: '',
        newNoteEquation: '',
        error: null,
      });
    } catch (error) {
      console.error('Failed to add note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      this.setState({isLoading: false});
    }
  }

  /* SECURITY ENHANCEMENT: Secure logout functionality */
  private async handleLogout() {
    try {
      // Save current notes before logout
      await this.storeNotes(this.state.notes);

      // Call the logout handler passed from parent component
      if (this.props.route.params.onLogout) {
        this.props.route.params.onLogout();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout properly');
    }
  }

  /* SECURITY ENHANCEMENT: Secure note deletion */
  private async deleteNote(noteId: string) {
    try {
      const updatedNotes = this.state.notes.filter(note => note.id !== noteId);
      await this.storeNotes(updatedNotes);
      this.setState({notes: updatedNotes});
    } catch (error) {
      console.error('Failed to delete note:', error);
      Alert.alert('Error', 'Failed to delete note');
    }
  }

  public render() {
    const {isLoading, error, notes, newNoteTitle, newNoteEquation} = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View style={styles.header}>
            <Text style={styles.title}>
              {'Math Notes: ' + this.props.route.params.user.username}
            </Text>

            {/* SECURITY ENHANCEMENT: Add logout button */}
            <Button
              title="Logout"
              onPress={this.handleLogout}
              color="#ff6b6b"
            />
          </View>

          {/* SECURITY ENHANCEMENT: Display error messages */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* SECURITY ENHANCEMENT: Show loading state */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.titleInput}
              value={newNoteTitle}
              onChangeText={this.onNoteTitleChange}
              placeholder="Enter your title"
              /* SECURITY ENHANCEMENT: Add input security attributes */
              maxLength={100}
              autoCorrect={false}
              editable={!isLoading}
            />
            <TextInput
              style={styles.textInput}
              value={newNoteEquation}
              onChangeText={this.onNoteEquationChange}
              placeholder="Enter your math equation"
              /* SECURITY ENHANCEMENT: Add input security attributes */
              maxLength={1000}
              multiline={true}
              numberOfLines={4}
              autoCorrect={false}
              editable={!isLoading}
            />
            <Button
              title={isLoading ? 'Adding...' : 'Add Note'}
              onPress={this.addNote}
              disabled={isLoading}
            />
          </View>

          <View style={styles.notes}>
            {notes.length === 0 ? (
              <Text style={styles.emptyText}>
                No notes yet. Add your first note above!
              </Text>
            ) : (
              notes.map(note => (
                <View key={note.id} style={styles.noteContainer}>
                  <Note title={note.title} text={note.text} />
                  {/* SECURITY ENHANCEMENT: Add delete functionality */}
                  <Button
                    title="Delete"
                    onPress={() => this.deleteNote(note.id)}
                    color="#ff6b6b"
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  /* SECURITY ENHANCEMENT: Header styling with logout button */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  /* SECURITY ENHANCEMENT: Error display styling */
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 20,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
  /* SECURITY ENHANCEMENT: Loading state styling */
  loadingContainer: {
    padding: 15,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  /* SECURITY ENHANCEMENT: Input container styling */
  inputContainer: {
    padding: 20,
    paddingTop: 10,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notes: {
    padding: 20,
    paddingTop: 10,
  },
  /* SECURITY ENHANCEMENT: Empty state and note container styling */
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  noteContainer: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
});
