import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface CameraResult {
  uri: string;
  base64: string;
}

export function useCamera() {
  const [photo, setPhoto] = useState<CameraResult | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = useCallback(async (): Promise<CameraResult | null> => {
    setLoading(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setLoading(false);
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const r = { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' };
        setPhoto(r);
        setLoading(false);
        return r;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
    setLoading(false);
    return null;
  }, []);

  const pickFromGallery = useCallback(async (): Promise<CameraResult | null> => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const r = { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' };
        setPhoto(r);
        setLoading(false);
        return r;
      }
    } catch (err) {
      console.error('Gallery error:', err);
    }
    setLoading(false);
    return null;
  }, []);

  const clearPhoto = useCallback(() => setPhoto(null), []);

  return { photo, loading, takePhoto, pickFromGallery, clearPhoto };
}
