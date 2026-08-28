/**
 * react-native-image-crop-picker rejects with this same error code on both
 * iOS and Android whenever the user has denied (or previously permanently
 * denied) gallery/photo library access — whether or not the OS still shows
 * its own system prompt on that attempt. Centralizing the check here means
 * every picker call site (ServiceTwo, SignUp, EditProfile, chat attachments)
 * reacts to permission denial the same way instead of drifting.
 *
 * Camera permission is intentionally out of scope — it already has its own
 * handling (see useAttachmentPicker's requestCameraPermission).
 */
export const GALLERY_PERMISSION_ERROR_CODE = 'E_NO_LIBRARY_PERMISSION';

export const isGalleryPermissionError = (error: unknown): boolean =>
  !!error &&
  typeof error === 'object' &&
  (error as {code?: string}).code === GALLERY_PERMISSION_ERROR_CODE;
