import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useUpdateChecker() {
  useEffect(() => {
    async function checkForUpdates() {
      // Skip in development
      if (__DEV__) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          // Download the update
          await Updates.fetchUpdateAsync();
          
          // Prompt user to restart
          Alert.alert(
            'Update Available',
            'A new version of PawLink is ready. Restart now to get the latest features and fixes.',
            [
              {
                text: 'Later',
                style: 'cancel',
              },
              {
                text: 'Restart',
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.log('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);
}
