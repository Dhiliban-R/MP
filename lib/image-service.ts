'use client';

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Upload donation images with optimization
export const uploadDonationImages = async (userId: string, files: File[]): Promise<string[]> => {
  if (files.length === 0) return [];
  
  try {
    const uploadPromises = files.map(async (file) => {
      // Optimize image before uploading
      const optimizedFile = await optimizeImage(file);
      
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `donations/${userId}/${filename}`);
      const metadata = {
        contentType: optimizedFile.type,
        customMetadata: {
          originalSize: String(file.size),
          optimizedSize: String(optimizedFile.size),
          optimized: 'true'
        }
      };
      
      const snapshot = await uploadBytes(storageRef, optimizedFile, metadata);
      return getDownloadURL(snapshot.ref);
    });
    
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// Helper function to optimize images client-side before upload
export const optimizeImage = async (file: File): Promise<File> => {
  // Skip optimization for small files (less than 200KB)
  if (file.size < 200 * 1024) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Resize the image
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.warn('Could not get canvas context for image optimization');
          resolve(file);
          return;
        }
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to Blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.warn('Failed to create blob from canvas');
              resolve(file);
              return;
            }
            
            // Create a new File object
            const optimizedFile = new File(
              [blob],
              file.name,
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            
            console.log(`Image optimized: ${file.size} -> ${optimizedFile.size} bytes`);
            resolve(optimizedFile);
          },
          'image/jpeg',
          0.8 // Quality (0.8 = 80%)
        );
      };
      
      img.onerror = () => {
        console.warn('Error loading image for optimization');
        resolve(file);
      };
      
      // Load the image
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error optimizing image:', error);
      resolve(file); // Return original file on error
    }
  });
};

// Delete images from storage
export const deleteImages = async (imageUrls: string[]): Promise<void> => {
  if (!imageUrls || imageUrls.length === 0) return;
  
  try {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        // Extract the path from the URL
        const path = url.split('firebase.storage.app/')[1].split('?')[0];
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with other deletions even if one fails
      }
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting images:', error);
    throw error;
  }
};

// Get image dimensions
export const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Check if file is a valid image
export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};