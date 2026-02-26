import { uploadToR2, getPublicUrl } from './lib/r2/client'
import fs from 'fs'
import dns from 'dns'

dns.setDefaultResultOrder('ipv4first')

async function testR2() {
    try {
        console.log("Endpoint:", process.env.R2_ENDPOINT);
        console.log("Bucket:", process.env.R2_BUCKET_NAME);

        // create a dummy buffer
        const buffer = Buffer.from('hello world', 'utf-8');
        const key = `test-${Date.now()}.txt`;

        console.log(`Uploading to ${key}...`);
        const url = await uploadToR2(buffer, key, 'text/plain');

        console.log('Success! URL:', url);
    } catch (error) {
        console.error('Error uploading to R2:', error);
    }
}

testR2()
