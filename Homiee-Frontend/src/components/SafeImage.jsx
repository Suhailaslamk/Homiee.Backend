import React, { useState } from 'react';

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#e2e8f0"/>
      <circle cx="300" cy="240" r="88" fill="#cbd5e1"/>
      <rect x="150" y="370" width="300" height="34" rx="17" fill="#cbd5e1"/>
      <rect x="195" y="420" width="210" height="24" rx="12" fill="#cbd5e1"/>
    </svg>
  `);

export default function SafeImage({ src, alt, className, fallbackSrc = FALLBACK_IMAGE }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const resolvedSrc = resolveImageUrl(src);
  const currentSrc = !resolvedSrc || failedSrc === resolvedSrc ? fallbackSrc : resolvedSrc;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(resolvedSrc)}
    />
  );
}

function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') {
    return src;
  }

  if (/^(data:|blob:|https?:\/\/)/i.test(src)) {
    return src;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7153/api';
  const baseOrigin = apiBase.replace(/\/api\/?$/, '');
  const normalizedPath = src.startsWith('/') ? src : `/${src}`;

  return `${baseOrigin}${normalizedPath}`;
}
