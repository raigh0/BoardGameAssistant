import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../components/theme';
import { RootStackParamList } from '../types';

import HomeScreen from '../screens/home/HomeScreen';
import Phase10SetupScreen from '../screens/phase10/Phase10SetupScreen';
import Phase10GameScreen from '../screens/phase10/Phase10GameScreen';
import WizardSetupScreen from '../screens/wizard/WizardSetupScreen';
import WizardGameScreen from '../screens/wizard/WizardGameScreen';
import CaboSetupScreen from '../screens/cabo/CaboSetupScreen';
import CaboGameScreen from '../screens/cabo/CaboGameScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'BoardGame Assistant', headerLargeTitle: true }}
        />
        <Stack.Screen
          name="Phase10Setup"
          component={Phase10SetupScreen}
          options={{ title: 'Phase 10 – Neues Spiel' }}
        />
        <Stack.Screen
          name="Phase10Game"
          component={Phase10GameScreen}
          options={{ title: 'Phase 10' }}
        />
        <Stack.Screen
          name="WizardSetup"
          component={WizardSetupScreen}
          options={{ title: 'Wizard – Neues Spiel' }}
        />
        <Stack.Screen
          name="WizardGame"
          component={WizardGameScreen}
          options={{ title: 'Wizard' }}
        />
        <Stack.Screen
          name="CaboSetup"
          component={CaboSetupScreen}
          options={{ title: 'Cabo – Neues Spiel' }}
        />
        <Stack.Screen
          name="CaboGame"
          component={CaboGameScreen}
          options={{ title: 'Cabo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
