import React, { useState } from 'react';

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="%23f7f2ee"/>
      <path d="M300 240c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80zM150 480h300v-40c0-66.3-53.7-120-120-120h-60c-66.3 0-120 53.7-120 120v40z" fill="%23e8e1da"/>
      <rect x="200" y="520" width="200" height="20" rx="10" fill="%23e8e1da"/>
    </svg>
  `);

export default function SafeImage({ src, alt, className, fallbackSrc = FALLBACK_IMAGE }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [failedSrc, setFailedSrc] = useState(null);
  
  const resolvedSrc = resolveImageUrl(src);
  const currentSrc = !resolvedSrc || failedSrc === resolvedSrc ? fallbackSrc : resolvedSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-[var(--color-sand)]/20 animate-pulse" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setFailedSrc(resolvedSrc);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') {
    return src;
  }

  // 1. Handle absolute URLs (Cloud storage, Data URIs, Blobs)
  if (/^(data:|blob:|https?:\/\/)/i.test(src)) {
    return src;
  }

  // 2. Handle absolute Windows paths (sometimes leaked from backend in dev)
  // Example: C:\Homiee\uploads\img.jpg
  if (/^[A-Z]:\\/i.test(src)) {
    // This is a local path that the browser can't use directly.
    // We should ideally not have this, but if we do, we might try to extract the relative part.
    const parts = src.split(/[\\\/]wwwroot[\\\/]|[\\\/]public[\\\/]/i);
    if (parts.length > 1) {
      src = parts[1];
    } else {
      // Fallback: just use the filename
      src = src.split(/[\\\/]/).pop();
    }
  }

  // 3. Get the base URL from env
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5276/api';
  const baseOrigin = apiBase.replace(/\/api\/?$/, '');
  
  // 4. Normalize the source path
  const cleanSrc = src.replace(/\\/g, '/'); // Fix Windows-style paths
  const normalizedPath = cleanSrc.startsWith('/') ? cleanSrc : `/${cleanSrc}`;

  // 5. Append to origin
  return `${baseOrigin}${normalizedPath}`;
}
