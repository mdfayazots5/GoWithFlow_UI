import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gowithflow.app',
  appName: 'GoWithFlow',
  webDir: 'dist/analog/public',
  server: {
    url: 'http://192.168.31.216:4200',
    cleartext: true
  }
};

export default config;
