import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AppStackNavigator } from './src/navigation/stack.tsx';

const queryClient = new QueryClient();

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppStackNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
