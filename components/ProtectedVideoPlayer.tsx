"use client";

import React from 'react';
import ReactPlayer from 'react-player';

// Cast ReactPlayer as any to bypass package type discrepancies in Next.js 15/16
const Player = ReactPlayer as any;

interface ProtectedVideoPlayerProps {
  videoProvider: 'mux' | 'r2' | 'youtube' | 'vimeo';
  url?: string;
  muxPlaybackId?: string;
}

export function ProtectedVideoPlayer({ videoProvider, url, muxPlaybackId }: ProtectedVideoPlayerProps) {
  // Prevent context menus on the player element to block "Save Video As" or inspector shortcuts
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 1. Resolve source URL based on provider
  let resolvedUrl = url || '';
  if (videoProvider === 'mux' && muxPlaybackId) {
    // Mux streams natively via HLS (.m3u8)
    resolvedUrl = `https://stream.mux.com/${muxPlaybackId}.m3u8`;
  }

  // 2. Direct HTML5 player for Cloudflare R2 (no egress fees, direct streaming)
  if (videoProvider === 'r2') {
    return (
      <div 
        className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-hairline bg-black select-none"
        onContextMenu={handleContextMenu}
      >
        <video
          src={resolvedUrl}
          className="w-full h-full object-cover"
          controls
          controlsList="nodownload nofullscreen noremoteplayback" // Blocks download and cast features
          disablePictureInPicture
          playsInline
        />
      </div>
    );
  }

  // 3. YouTube/Vimeo unlisted embeds with pointer-events protection overlay
  const isExternalEmbed = videoProvider === 'youtube' || videoProvider === 'vimeo';

  return (
    <div 
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-hairline bg-black select-none"
      onContextMenu={handleContextMenu}
    >
      <Player
        url={resolvedUrl}
        width="100%"
        height="100%"
        controls={!isExternalEmbed} // Hide controls for external embeds to obscure sources
        config={{
          youtube: {
            playerVars: {
              controls: 0,
              modestbranding: 1,
              rel: 0,
              disablekb: 1, // Disable keyboard hotkeys
              fs: 0, // Disable full screen button
            }
          },
          vimeo: {
            playerOptions: {
              controls: false,
              title: false,
              byline: false,
              portrait: false,
            }
          }
        }}
      />

      {/* Transparent Click-Shield Overlay for Unlisted YouTube/Vimeo */}
      {isExternalEmbed && (
        <div 
          className="absolute inset-0 z-10 bg-transparent cursor-default"
          onClick={(e) => {
            // Block all clicks to prevent pausing or navigating to youtube.com
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      )}
    </div>
  );
}
export default ProtectedVideoPlayer;
