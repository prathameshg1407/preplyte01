// test-tts.js
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

async function testTTS() {
  console.log('🔍 Testing Google Cloud TTS Setup...\n');
  
  // Check credentials file
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-service-account.json';
  const absolutePath = path.resolve(credPath);
  
  console.log(`📁 Checking credentials at: ${absolutePath}`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error('❌ Credentials file not found!');
    console.log('\n📝 Please ensure google-service-account.json is in the backend folder');
    return;
  }
  
  // Read and validate JSON
  try {
    const content = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    console.log(`✅ Credentials file found`);
    console.log(`   Project ID: ${content.project_id}`);
    console.log(`   Service Account: ${content.client_email}\n`);
  } catch (error) {
    console.error('❌ Invalid JSON in credentials file');
    return;
  }
  
  // Set environment variable
  process.env.GOOGLE_APPLICATION_CREDENTIALS = absolutePath;
  
  // Test TTS connection
  console.log('🔗 Connecting to Google Cloud TTS...');
  
  try {
    const client = new TextToSpeechClient();
    
    // List voices to test authentication
    const [result] = await client.listVoices({
      languageCode: 'en-US',
    });
    
    console.log(`✅ Successfully connected to TTS API!`);
    console.log(`   Available voices: ${result.voices.length}`);
    
    // Try to synthesize speech
    console.log('\n🎤 Testing speech synthesis...');
    
    const request = {
      input: { text: 'Hello, this is a test.' },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    
    const [response] = await client.synthesizeSpeech(request);
    
    if (response.audioContent) {
      // Save test audio
      const outputFile = 'test-audio.mp3';
      fs.writeFileSync(outputFile, response.audioContent, 'binary');
      console.log(`✅ Speech synthesis successful!`);
      console.log(`   Test audio saved to: ${outputFile}`);
    }
    
    console.log('\n🎉 All tests passed! TTS is working correctly.');
    
  } catch (error) {
    console.error('\n❌ TTS API Error:', error.message);
    
    if (error.code === 16) {
      console.log('\n🔑 Authentication Issue:');
      console.log('   1. Your service account key may be invalid or revoked');
      console.log('   2. Please generate a new key from Google Cloud Console');
      console.log('   3. Download and replace google-service-account.json');
    } else if (error.code === 7) {
      console.log('\n🚫 Permission Issue:');
      console.log('   1. Text-to-Speech API may not be enabled');
      console.log('   2. Enable it at: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
    } else if (error.code === 3) {
      console.log('\n⚠️ Configuration Issue:');
      console.log('   Check your API parameters');
    } else {
      console.log('\n❓ Unknown error. Details:', error);
    }
  }
}

// Run the test
testTTS().catch(console.error);