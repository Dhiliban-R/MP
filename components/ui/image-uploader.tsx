'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ImageUploaderProps {
  maxImages?: number;
  onImagesChange: (files: File[]) => void;
  initialPreviews?: string[];
  className?: string;
  variant?: 'default' | 'avatar' | 'gallery';
  currentImage?: string;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
}

export function ImageUploader({
  maxImages = 5,
  onImagesChange,
  initialPreviews = [],
  className = '',
  variant = 'default',
  currentImage,
  onImageUpload,
  placeholder = 'Upload Image'
}: ImageUploaderProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialPreviews);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setIsLoading(true);

      try {
        if (variant === 'avatar' && onImageUpload) {
          // Handle single avatar upload
          const uploadedUrl = await onImageUpload(file);
          setCurrentImageUrl(uploadedUrl);
          toast.success('Profile image updated successfully');
        } else {
          // Handle multiple image upload
          const newFiles = Array.from(e.target.files);

          // Limit to maxImages total
          const totalImages = imageFiles.length + newFiles.length;
          if (totalImages > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
          }

          // Create preview URLs
          const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

          setImageFiles(prev => [...prev, ...newFiles]);
          setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
          onImagesChange([...imageFiles, ...newFiles]);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setIsLoading(false);

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [variant, onImageUpload, imageFiles, maxImages, onImagesChange]);

  const removeImage = (index: number) => {
    // Remove from preview URLs
    const newPreviewUrls = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks if it's a local preview
    if (!initialPreviews.includes(previewUrls[index])) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    
    // Remove from files array
    const newImageFiles = [...imageFiles];
    newImageFiles.splice(index, 1);
    setImageFiles(newImageFiles);
    
    // Notify parent component
    onImagesChange(newImageFiles);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Avatar variant render
  if (variant === 'avatar') {
    return (
      <div className={`relative inline-block ${className}`}>
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={currentImageUrl} alt="Profile" />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-2xl">
            {placeholder.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <Button
          type="button"
          size="icon"
          variant="outline"
          className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background shadow-md hover:shadow-lg transition-all"
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    );
  }

  // Default gallery variant render
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-4">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border shadow-sm">
            <img
              src={url}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:shadow-md transition-all"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {previewUrls.length < maxImages && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-xl border-muted-foreground/25 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-2">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        multiple={variant === 'default' || variant === 'gallery'}
      />

      <p className="text-sm text-muted-foreground">
        {previewUrls.length === 0
          ? `Upload up to ${maxImages} images (max 5MB each)`
          : `${previewUrls.length} of ${maxImages} images uploaded`}
      </p>
    </div>
  );
}