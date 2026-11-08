// WebRTC and HTMLMediaElement stream control helper for Low-Bandwidth Audio-Only Mode

export function setMediaStreamsAudioOnly(audioOnly = true) {
  try {
    // 1. Inspect all HTMLVideoElements on page
    if (typeof document !== 'undefined') {
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach((video) => {
        if (video.srcObject && typeof video.srcObject.getVideoTracks === 'function') {
          video.srcObject.getVideoTracks().forEach((track) => {
            track.enabled = !audioOnly
          })
        }
        if (video.srcObject && typeof video.srcObject.getAudioTracks === 'function') {
          video.srcObject.getAudioTracks().forEach((track) => {
            track.enabled = true // Always ensure audio is active and unmuted
          })
        }
      })
    }

    // 2. Inspect any WebRTC PeerConnection instances tracked globally
    if (typeof window !== 'undefined' && Array.isArray(window.__spandanPeerConnections)) {
      window.__spandanPeerConnections.forEach((pc) => {
        try {
          const receivers = pc.getReceivers?.() || []
          receivers.forEach((receiver) => {
            if (receiver.track && receiver.track.kind === 'video') {
              receiver.track.enabled = !audioOnly
            }
            if (receiver.track && receiver.track.kind === 'audio') {
              receiver.track.enabled = true
            }
          })
        } catch (e) {
          console.warn('[MediaStreamControl] Error controlling peer connection receiver:', e)
        }
      })
    }
  } catch (err) {
    console.warn('[MediaStreamControl] Failed to toggle media stream tracks:', err)
  }
}

