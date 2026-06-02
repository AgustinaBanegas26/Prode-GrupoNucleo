import { Redirect } from 'expo-router';

import { LoadingScreen } from '../src/components/LoadingScreen';
import { useAuthStore } from '../src/store/authStore';

export default function HomeScreen() {
  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return session ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}
