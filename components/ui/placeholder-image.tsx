'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PlaceholderImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  placeholder?: string;
  fallbackIcon?: string;
}

export function PlaceholderImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  style,
  priority,
  placeholder,
  fallbackIcon = '🖼️'
}: PlaceholderImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Generate a gradient based on the alt text
  const generateGradient = (text: string) => {
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-yellow-400 to-orange-500',
      'from-red-400 to-pink-500',
      'from-indigo-400 to-purple-500',
      'from-teal-400 to-blue-500',
      'from-orange-400 to-red-500'
    ];
    
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (imageError) {
    const gradientClass = generateGradient(alt);
    
    return (
      <div 
        className={`bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white ${className}`}
        style={style}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">{fallbackIcon}</div>
          <p className="text-sm font-medium opacity-90">{placeholder || alt}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div 
          className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
          style={style}
        >
          <div className="text-gray-400 text-2xl">{fallbackIcon}</div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={style}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
}
