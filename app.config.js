module.exports = ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    extra: {
      comicvineApiKey: process.env.EXPO_PUBLIC_COMICVINE_API_KEY || '',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'radstash-61837',
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    },
  },
});
