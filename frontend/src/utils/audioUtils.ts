/**
 * A reusable AudioContext to avoid creating multiple contexts, which can be resource-intensive.
 * It's created only when first needed.
 */
let audioContext: AudioContext | null = null;

/**
 * Takes an ArrayBuffer containing audio data, decodes it, and plays it through the browser's speakers.
 * @param arrayBuffer - The raw audio data chunk received from the server.
 * @returns A Promise that resolves when the audio chunk has finished playing.
 */
export const playAudioStream = (arrayBuffer: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) {
      reject(new Error('Invalid or empty audio data received.'));
      return;
    }

    // Initialize the AudioContext on the first playback request.
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API is not supported in this browser.', e);
        reject(new Error('Audio playback is not supported.'));
        return;
      }
    }

    // Ensure the audio context is active, especially after long periods of inactivity.
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Decode the audio data from the raw ArrayBuffer into a playable format.
    audioContext.decodeAudioData(
      arrayBuffer,
      (audioBuffer) => {
        // Create a source node to play the decoded audio.
        const source = audioContext!.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect the source to the speakers.
        source.connect(audioContext!.destination);
        
        // Set an event listener to resolve the promise once playback is complete.
        source.onended = () => {
          resolve();
        };
        
        // Start playback immediately.
        source.start(0);
      },
      (error) => {
        console.error('Error decoding audio data:', error);
        reject(new Error('Failed to decode audio data. Unsupported format.'));
      },
    );
  });
};