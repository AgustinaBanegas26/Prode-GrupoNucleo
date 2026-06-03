import { Redirect } from 'expo-router';

import { LoadingScreen } from '../src/components/LoadingScreen';
import { useAuth } from '../src/providers/AuthProvider';

export default function HomeScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}

