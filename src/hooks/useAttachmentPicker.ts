import {useCallback, useRef} from 'react';
import {Platform, Alert, PermissionsAndroid, Linking} from 'react-native';
import DocumentPicker, {
  types as docPickerTypes,
} from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import {
  PendingAttachment,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  ALLOWED_EXTENSIONS_LABEL,
} from '../types/chat';

interface UseAttachmentPickerOptions {
  onAttachmentSelected: (attachment: PendingAttachment) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'This app needs camera access to take photos.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[AttachmentPicker] Camera permission error:', err);
    return false;
  }
};

export const useAttachmentPicker = ({
  onAttachmentSelected,
}: UseAttachmentPickerOptions) => {
  const isPickerActive = useRef(false);

  const handlePickDocument = useCallback(async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;
    try {
      const result = await DocumentPicker.pick({
        type: [docPickerTypes.pdf],
        copyTo: 'cachesDirectory',
      });
      const file = result[0];
      if (!file) return;

      const mimeType = file.type || 'application/octet-stream';
      if (
        !ALLOWED_MIME_TYPES.includes(
          mimeType as (typeof ALLOWED_MIME_TYPES)[number],
        )
      ) {
        Alert.alert(
          'Unsupported File',
          `Only ${ALLOWED_EXTENSIONS_LABEL} files are supported.`,
        );
        return;
      }

      const fileSize = file.size || 0;
      if (fileSize === 0) {
        Alert.alert('Invalid File', 'The selected file appears to be empty.');
        return;
      }
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'File Too Large',
          `Maximum file size is ${MAX_FILE_SIZE_LABEL}. Selected: ${formatFileSize(fileSize)}.`,
        );
        return;
      }

      onAttachmentSelected({
        uri: file.fileCopyUri || file.uri,
        name: file.name || 'document',
        mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        console.warn('[AttachmentPicker] Document pick failed:', err);
        Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    } finally {
      isPickerActive.current = false;
    }
  }, [onAttachmentSelected]);

  const handlePickImage = useCallback(async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });
      if (!image) return;

      const fileSize = image.size || 0;
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'File Too Large',
          `Maximum file size is ${MAX_FILE_SIZE_LABEL}. Selected: ${formatFileSize(fileSize)}.`,
        );
        return;
      }

      const fileName =
        image.filename || image.path.split('/').pop() || 'image.jpg';
      const mimeType = image.mime || 'image/jpeg';

      onAttachmentSelected({
        uri: image.path,
        name: fileName,
        mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        console.warn('[AttachmentPicker] Image pick failed:', err);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    } finally {
      isPickerActive.current = false;
    }
  }, [onAttachmentSelected]);

  const handleTakePhoto = useCallback(async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Camera permission is needed to take photos. Please enable it in Settings.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ],
          );
          return;
        }
      }

      const image = await ImagePicker.openCamera({
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });
      if (!image) return;

      const fileSize = image.size || 0;
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'File Too Large',
          `Maximum file size is ${MAX_FILE_SIZE_LABEL}. Selected: ${formatFileSize(fileSize)}.`,
        );
        return;
      }

      const fileName =
        image.filename || image.path.split('/').pop() || 'photo.jpg';
      const mimeType = image.mime || 'image/jpeg';

      onAttachmentSelected({
        uri: image.path,
        name: fileName,
        mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        console.warn('[AttachmentPicker] Camera failed:', err);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    } finally {
      isPickerActive.current = false;
    }
  }, [onAttachmentSelected]);

  return {
    handlePickDocument,
    handlePickImage,
    handleTakePhoto,
  };
};
