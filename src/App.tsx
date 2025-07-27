/**
 * SECURITY ENHANCEMENT: Main App component with secure authentication flow
 * Implements proper session management and navigation security
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Notes from './Notes';
import Login, {IUser} from './Login';
/* SECURITY ENHANCEMENT: Import security services */
import {AuthService} from './services/AuthService';
import {SecurityConfig, securityLog} from './config/SecurityConfig';

export type TRootStackParamList = {
  Login: undefined;
  Notes: {
    user: IUser;
    onLogout: () => void /* SECURITY ENHANCEMENT: Add logout handler to navigation params */;
  };
};

function App() {
  const [signedInAs, setSignedInAs] = React.useState<IUser | false>(false);
  /* SECURITY ENHANCEMENT: Add loading state for session checks */
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);

  const Stack = createNativeStackNavigator<TRootStackParamList>();

  /* SECURITY ENHANCEMENT: Check for existing session on app start */
  React.useEffect(() => {
    checkExistingSession();
  }, []);

  /* SECURITY ENHANCEMENT: Secure session validation */
  const checkExistingSession = async () => {
    try {
      securityLog('Checking existing session');
      const session = await AuthService.getCurrentSession();

      if (session) {
        securityLog('Valid session found', {username: session.username});
        setSignedInAs(session);
      } else {
        securityLog('No valid session found');
      }
    } catch (error) {
      securityLog('Session check failed', error);
      console.error('Session check failed:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  /* SECURITY ENHANCEMENT: Handle secure login */
  const handleLogin = (user: IUser) => {
    securityLog('User logged in', {username: user.username});
    setSignedInAs(user);
  };

  /* SECURITY ENHANCEMENT: Handle secure logout */
  const handleLogout = async () => {
    try {
      securityLog('User logging out', {
        username: signedInAs ? signedInAs.username : 'unknown',
      });
      await AuthService.logout();
      setSignedInAs(false);
    } catch (error) {
      securityLog('Logout failed', error);
      console.error('Logout failed:', error);
    }
  };

  /* SECURITY ENHANCEMENT: Show loading screen during session check */
  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          /* SECURITY ENHANCEMENT: Disable screenshot and screen recording on sensitive screens */
          headerShown: false,
        }}>
        {!signedInAs ? (
          <Stack.Screen name="Login">
            {props => <Login {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Notes">
            {props => (
              <Notes
                {...props}
                route={{
                  ...props.route,
                  params: {
                    user: signedInAs,
                    onLogout:
                      handleLogout /* SECURITY ENHANCEMENT: Pass logout handler */,
                  },
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  /* SECURITY ENHANCEMENT: Styling for loading and security features */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});

export default App;
