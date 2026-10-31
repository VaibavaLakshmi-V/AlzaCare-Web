// Text-to-speech with the browser's Web Speech API. Sentences queue up instead of cutting each other off.
export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text) {
  if (!speechSupported) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9 // a little slower, easier to follow
  window.speechSynthesis.speak(utterance)
}

// Chrome only plays speech after the user has interacted with the page once
export const hasUserActivation = () => navigator.userActivation?.hasBeenActive ?? true
