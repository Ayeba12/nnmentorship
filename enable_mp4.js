import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!muxTokenId || !muxTokenSecret) {
  console.error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in .env.local');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64');
const assetId = 'dVPPw201bfKthvsLLHU02Mzj01EE702UZFa6HmWPQEWJOu00'; // The user's ready asset ID

async function main() {
  console.log(`Enabling MP4 support for Mux Asset: ${assetId}...`);
  try {
    const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}/mp4-support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        mp4_support: 'capped-1080p' // Request MP4 file generation
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mux API returned status ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('✅ Success! Mux is now generating MP4 files for this asset.');
    console.log('Wait 1-2 minutes for Mux to render the MP4 versions.');
  } catch (err) {
    console.error('❌ Failed to enable MP4 support:', err.message);
  }
}

main();
