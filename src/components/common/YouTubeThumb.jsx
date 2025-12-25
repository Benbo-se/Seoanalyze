'use client';

import { useState } from 'react';

export default function YouTubeThumb({ id = 'hda9pweGWmo' }) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          title="YouTube video"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    );
  }

  return (
    <div className="thumb-wrap" style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
      <button
        onClick={() => setPlay(true)}
        aria-label="Spela upp video"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          border: 0, 
          padding: 0, 
          cursor: 'pointer', 
          background: 'transparent'
        }}
      >
        <img
          src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
          srcSet={`
            https://img.youtube.com/vi/${id}/sddefault.jpg     640w,
            https://img.youtube.com/vi/${id}/hqdefault.jpg      480w
          `}
          sizes="(min-width: 900px) 640px, 100vw"
          alt="Video thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        
        {/* Play Button Overlay */}
        <span style={{
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80px', 
          height: '80px', 
          background: 'rgba(255, 107, 107, 0.9)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white" style={{marginLeft: '4px'}}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
        
        {/* Video Duration Badge */}
        <span style={{
          position: 'absolute', 
          bottom: '20px', 
          right: '20px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '6px 12px', 
          borderRadius: '6px', 
          fontSize: '14px', 
          fontWeight: '500'
        }}>
          3:42
        </span>
      </button>
    </div>
  );
}