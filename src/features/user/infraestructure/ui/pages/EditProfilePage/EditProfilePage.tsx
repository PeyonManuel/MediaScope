// src/pages/EditProfilePage/EditProfilePage.tsx (Example path)
// Added Avatar Upload Functionality with Cropping
// Removed Website URL field and logic
// Added missing previewUrl state declaration

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import styles from './EditProfilePage.module.css'; // CSS Module
import type { User } from '@supabase/supabase-js';

// Imports for react-image-crop
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import { supabase } from '../../../../../../lib/supabaseClient';
import { DefaultAvatarIcon } from '../../../../../../shared/infraestructure/components/ui/svgs';
import { ProfileFormData, ProfileResponse } from '../../../../domain';
import { updateUserProfileUseCase } from '../../../../useCases/useCases';

// Helper function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string // Keep filename for potential use
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelRatio = window.devicePixelRatio || 1;
  // Adjust canvas size for device pixel ratio for higher quality crop
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  // Calculate center points for potential rotation/scaling (though not used here)
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  // Translate so the top-left of the crop is at the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // If rotation/scaling were added, they'd happen around the image center here
  // Draw the image onto the canvas, adjusted for crop position
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob); // Resolve with blob or null if creation fails
      },
      'image/png', // Default to PNG, could use selectedFile.type
      0.9 // Quality setting for lossy formats like JPEG
    );
  });
}

function EditProfilePage() {
  const currentUser = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isFormPopulated, setIsFormPopulated] = useState(false);

  // State for cropping
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1 / 1);
  const imgRef = useRef<HTMLImageElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // --- FIXED: Added missing useState declaration ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State for image preview URL
  // --- ---

  const profileQueryKey = ['headerInfoProfile', currentUser?.id];
  // Query to fetch profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
    isSuccess: isProfileSuccess,
  } = useQuery<ProfileResponse | null, Error>({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<ProfileResponse | null> => {
      if (!currentUser) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, bio, updated_at, avatar_url')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to fetch profile');
      return data ? (data as ProfileResponse) : null;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });
  // Effect to populate form
  useEffect(() => {
    if (isProfileSuccess && profileData && !isFormPopulated) {
      setUsername(profileData.username ?? '');
      setBio(profileData.bio ?? '');
      setAvatarUrl(profileData.avatar_url ?? null);
      setIsFormPopulated(true);
    }
  }, [profileData, isProfileSuccess, isFormPopulated]);

  // Effect for generating file preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null); // Use the correct setter function name
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl); // Use the correct setter function name
    // Free memory when the component is unmounted or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  // Handler when image loads in ReactCrop
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  // Handler for file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setCrop(undefined);
      setCompletedCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImgSrc('');
    }
  };

  // Mutation to update profile data (text fields)
  const updateProfileMutation = useMutation<
    ProfileResponse | null,
    Error,
    Omit<ProfileFormData, 'avatar_url'> // Ensure 'url' is omitted if removed
  >({
    mutationFn: async (profileUpdates) => {
      if (!currentUser) throw new Error('User not authenticated');
      const updates = {
        username: profileUpdates.username,
        bio: profileUpdates.bio,
        updated_at: new Date().toISOString(),
        user_id: currentUser.id,
      };
      const data = await updateUserProfileUseCase.execute(updates);
      return data as ProfileResponse | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey, exact: true });
      alert('Profile details updated successfully!');
    },
    onError: (error) => {
      alert(`Error updating profile details: ${error.message}`);
    },
  });

  // Mutation for uploading CROPPED avatar
  const uploadAvatarMutation = useMutation<{ avatarUrl: string }, Error, Blob>({
    mutationFn: async (blob: Blob): Promise<{ avatarUrl: string }> => {
      if (!currentUser || !blob) throw new Error('User or blob missing');
      const fileExt = selectedFile?.name.split('.').pop() || 'png';
      const mimeType = selectedFile?.type || 'image/png';
      const fileName = `${currentUser.id}/${fileExt}`;
      const filePath = `${fileName}`;
      const croppedFile = new File([blob], fileName, { type: mimeType });
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedFile, { cacheControl: '3600', upsert: true });
      if (uploadError)
        throw new Error(uploadError.message || 'Failed to upload avatar.');
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      if (!urlData?.publicUrl)
        throw new Error('Failed to get avatar URL after upload.');
      const newAvatarUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);
      if (updateError)
        throw new Error(
          updateError.message || 'Failed to update profile with new avatar.'
        );
      return { avatarUrl: newAvatarUrl };
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: profileQueryKey, exact: true });
      alert('Profile picture updated!');
    },
    onError: (error) => {
      alert(`Error updating profile picture: ${error.message}`);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // Handler to perform the crop and upload
  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current || !selectedFile) {
      alert('Please select an image and make a crop selection.');
      return;
    }
    try {
      const croppedBlob = await getCroppedBlob(
        imgRef.current,
        completedCrop,
        selectedFile.name
      );
      if (croppedBlob) {
        uploadAvatarMutation.mutate(croppedBlob);
      } else {
        alert('Could not process the cropped image.');
      }
    } catch (e: any) {
      console.error('Cropping failed', e);
      alert(`Image cropping failed: ${e?.message}`);
    }
  };

  // Form Submit Handler
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username.trim().length < 3 && username.trim().length > 0) {
      alert('Username must be at least 3 characters long if provided.');
      return;
    }
    updateProfileMutation.mutate({
      username: username.trim() || null,
      bio: bio.trim() || null,
      user_id: currentUser?.id ?? '',
    });
  };

  // --- Render Logic ---
  if (isLoadingProfile && !isFormPopulated) {
    return <div className={styles.loadingMessage}>Loading profile...</div>;
  }
  if (isProfileError && !profileData) {
    return (
      <div className={styles.errorMessage}>
        Error loading profile: {profileError?.message}
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className={styles.errorMessage}>
        Please log in to edit your profile.
      </div>
    );
  }

  // Determine which avatar URL to display (preview > current fetched > default)
  const displayAvatarUrl = previewUrl || avatarUrl;
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Edit Your Profile</h1>

      {/* Avatar Section */}
      <div className={styles.avatarSection}>
        <div className={styles.avatarPreviewContainer}>
          {!imgSrc && displayAvatarUrl && (
            <img
              src={displayAvatarUrl}
              alt="Current profile avatar"
              className={styles.avatarPreview}
            />
          )}
          {!imgSrc && !displayAvatarUrl && (
            <div className={styles.avatarPreviewPlaceholder}>
              <DefaultAvatarIcon />
            </div>
          )}
          {/* Cropper is rendered below if imgSrc exists */}
        </div>
        <div className={styles.avatarControls}>
          <label htmlFor="avatar-upload" className={styles.avatarUploadLabel}>
            {/* Change label text based on whether an image is being cropped */}
            {imgSrc ? 'Change Image' : 'Choose Image'}
          </label>
          <input
            type="file"
            id="avatar-upload"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className={styles.avatarFileInput}
          />
          {/* Show filename only if a file is selected but not yet being cropped */}
          {selectedFile && !imgSrc && (
            <span className={styles.fileName}>{selectedFile.name}</span>
          )}
        </div>
      </div>

      {/* Cropper UI */}
      {imgSrc && (
        <div className={styles.cropperContainer}>
          <ReactCrop
            crop={crop}
            onChange={(_, pc) => setCrop(pc)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={100} // Example min size
            minHeight={100}
            // circularCrop // Uncomment for circular UI
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imgSrc}
              style={{ maxHeight: '400px', display: 'block' }} // Added display block
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <div className={styles.cropperActions}>
            <button
              type="button"
              onClick={handleCropAndUpload}
              disabled={!completedCrop || uploading}
              className={styles.uploadButton}>
              {uploading ? 'Uploading...' : 'Confirm Crop & Upload'}
            </button>
            <button
              type="button"
              onClick={() => {
                setImgSrc('');
                setSelectedFile(null);
                setCrop(undefined);
                setCompletedCrop(undefined);
              }} // Clear all crop state
              disabled={uploading}
              className={styles.cancelButton}>
              Cancel Crop
            </button>
          </div>
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        {/* Username Input */}
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            disabled={updateProfileMutation.isPending || uploading}
            maxLength={50}
          />
        </div>

        {/* Bio Textarea */}
        <div className={styles.formGroup}>
          <label htmlFor="bio" className={styles.label}>
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={styles.textarea}
            placeholder="Tell us a little about yourself..."
            disabled={updateProfileMutation.isPending || uploading}
            maxLength={300}
          />
        </div>

        {/* Submit Button for Text Fields */}
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={updateProfileMutation.isPending || uploading}>
            {updateProfileMutation.isPending ?
              'Saving...'
            : 'Save Profile Details'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfilePage;
