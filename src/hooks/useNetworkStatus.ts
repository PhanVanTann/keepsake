import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** true = chắc chắn mất mạng (not reachable). null/undefined = đang xác định, coi như có mạng. */
export function useNetworkStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return unsubscribe;
  }, []);

  return isOffline;
}
