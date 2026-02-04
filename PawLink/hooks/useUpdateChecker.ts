import { useEffect, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Hook to check for OTA updates
 * - Checks on app mount
 * - Checks when app comes to foreground
 * - More robust error handling
 */
export function useUpdateChecker() {
  const checkForUpdates = useCallback(async () => {
    // Skip in development mode
    if (__DEV__) {
      console.log('[UpdateChecker] Skipping in development mode');
      return;
    }

    // Skip if updates are not enabled (e.g., development client)
    if (!Updates.isEnabled) {
      console.log('[UpdateChecker] Updates not enabled for this build');
      return;
    }

    try {
      console.log('[UpdateChecker] Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('[UpdateChecker] Update available, downloading...');
        
        // Download the update
        const fetchResult = await Updates.fetchUpdateAsync();
        
        if (fetchResult.isNew) {
          console.log('[UpdateChecker] Update downloaded, prompting user...');
          
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
                text: 'Restart Now',
                onPress: async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch (reloadError) {
                    console.error('[UpdateChecker] Error reloading:', reloadError);
                  }
                },
              },
            ]
          );
        }
      } else {
        console.log('[UpdateChecker] App is up to date');
      }
    } catch (error) {
      // Log the error but don't disrupt user experience
      console.log('[UpdateChecker] Error checking for updates:', error);
    }
  }, []);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates();

    // Also check when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkForUpdates]);
}
