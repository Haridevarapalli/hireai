import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smarthire.ai',
  appName: 'SmartHire AI',
  webDir: 'public',

  server: {
    url: 'http://10.60.177.185:3000',
    androidScheme: 'http',
    cleartext: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#8b5cf6',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;