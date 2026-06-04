import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gowithflow.app',
  appName: 'GoWithFlow',
  webDir: 'dist/analog/public',
  server: {
    url: 'http://10.147.254.186:4200',
    cleartext: true
  }
};

export default config;
