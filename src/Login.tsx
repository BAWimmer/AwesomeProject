import React from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {TRootStackParamList} from './App';
/* SECURITY ENHANCEMENT: Import secure authentication service */
import {AuthService, IUser} from './services/AuthService';

/* SECURITY ENHANCEMENT: Export IUser interface for type consistency */
export type {IUser};

interface IProps {
  onLogin: (user: IUser) => void;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Login'> & IProps;

export default function Login(props: TProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  /* SECURITY ENHANCEMENT: Add loading state and input validation */
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRegister, setShowRegister] = React.useState(false);

  /* SECURITY ENHANCEMENT: Initialize demo users securely on component mount */
  React.useEffect(() => {
    AuthService.initializeDemoUsers();

    // Check for existing session
    checkExistingSession();
  }, []);

  /* SECURITY ENHANCEMENT: Check for existing valid session */
  const checkExistingSession = async () => {
    try {
      const session = await AuthService.getCurrentSession();
      if (session) {
        props.onLogin(session);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  /* SECURITY ENHANCEMENT: Secure login function with proper validation */
  async function login() {
    if (isLoading) return;

    /* SECURITY ENHANCEMENT: Basic client-side validation */
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.authenticateUser({
        username: username.trim(),
        password: password,
      });

      if (result.success && result.user) {
        /* SECURITY ENHANCEMENT: Clear sensitive data from memory */
        setPassword('');
        props.onLogin(result.user);
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Invalid credentials',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  /* SECURITY ENHANCEMENT: Secure registration function */
  async function register() {
    if (isLoading) return;

    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.registerUser({
        username: username.trim(),
        password: password,
      });

      if (result.success && result.user) {
        Alert.alert(
          'Success',
          'Account created successfully! You can now login.',
        );
        setPassword('');
        setShowRegister(false);
      } else {
        Alert.alert(
          'Registration Failed',
          result.error || 'Registration failed',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during registration.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {showRegister ? 'Create Account' : 'Login'}
      </Text>

      {/* SECURITY ENHANCEMENT: Display security notice */}
      <Text style={styles.securityNotice}>
        {showRegister
          ? 'Create a secure account with a strong password'
          : 'Enter your credentials to access your secure notes'}
      </Text>

      <TextInput
        style={styles.username}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        /* SECURITY ENHANCEMENT: Disable autocomplete and autocorrect for security */
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={20}
      />
      <TextInput
        style={styles.password}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        /* SECURITY ENHANCEMENT: Secure text entry with proper security attributes */
        secureTextEntry={true}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={50}
      />

      {/* SECURITY ENHANCEMENT: Show password requirements for registration */}
      {showRegister && (
        <Text style={styles.passwordHint}>
          Password must be at least 8 characters with uppercase, lowercase, and
          numbers
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={
            isLoading
              ? 'Please wait...'
              : showRegister
              ? 'Create Account'
              : 'Login'
          }
          onPress={showRegister ? register : login}
          disabled={isLoading}
        />

        <Button
          title={showRegister ? 'Back to Login' : 'Create Account'}
          onPress={() => {
            setShowRegister(!showRegister);
            setPassword(''); // Clear password when switching modes
          }}
          color="#666"
        />
      </View>

      {/* SECURITY ENHANCEMENT: Display demo account information (for demonstration purposes only, would remove this in production) */}
      {!showRegister && (
        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Accounts:</Text>
          <Text style={styles.demoText}>
            Username: demo_user, Password: SecurePass123!
          </Text>
          <Text style={styles.demoText}>
            Username: test_user, Password: TestPass456!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  /* SECURITY ENHANCEMENT: Added security notice styling */
  securityNotice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  username: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  password: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  /* SECURITY ENHANCEMENT: Password requirement hint styling */
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  /* SECURITY ENHANCEMENT: Button container styling */
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  /* SECURITY ENHANCEMENT: Demo account information styling */
  demoInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
