import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingMenuButton } from './src/components/common/FloatingMenuButton';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationRef } from './src/navigation/navigationRef';
import { AppStackNavigator } from './src/navigation/stack.tsx';

const queryClient = new QueryClient();

function App(): React.JSX.Element {
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  const updateRoute = () => {
    if (navigationRef.isReady()) {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name || null);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={updateRoute}
            onStateChange={updateRoute}
          >
            <AppStackNavigator />
            <FloatingMenuButton currentRoute={currentRoute} />
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
