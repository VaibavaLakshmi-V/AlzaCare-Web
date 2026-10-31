// Grab the current video frame as a JPEG blob, optionally scaled down to `maxWidth`
export function captureFrame(video, maxWidth = null, quality = 0.85) {
  const scale = maxWidth ? Math.min(1, maxWidth / video.videoWidth) : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture a frame'))), 'image/jpeg', quality)
  })
}
