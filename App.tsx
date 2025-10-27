import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, LexendDeca_400Regular, LexendDeca_700Bold } from '@expo-google-fonts/lexend-deca';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Home from './src/pages/Home';
import AuthScreen from './src/pages/AuthScreen';
import ProfilePage from './src/pages/ProfilePage';
import Chart from './src/pages/Chart';
import History from './src/pages/History';
import Camera from './src/pages/Camera';
import NewGoal from './src/pages/NewGoal';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState<any | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            options={{ headerShown: false }}
          >
            {(props) => <Home {...props} setUser={setUser} />}
          </Stack.Screen>
          <Stack.Screen
            name="Profile"
            options={{ headerShown: false }}
          >
            {(props) => <ProfilePage {...props} setUser={setUser} />}
          </Stack.Screen>
          <Stack.Screen
            name="Chart"
            options={{ headerShown: false }}
          >
            {(props) => <Chart {...props} setUser={setUser} />}
          </Stack.Screen>
          <Stack.Screen
            name="History"
            options={{ headerShown: false }}
          >
            {(props) => <History {...props} setUser={setUser} />}
          </Stack.Screen>
          <Stack.Screen
            name="Camera"
            component={Camera}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewGoal"
            component={NewGoal}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}