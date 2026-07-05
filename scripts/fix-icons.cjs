const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function fixIcons() {
  try {
    const inputPath = path.join(__dirname, 'public', 'logo-le-rounded.png');
    // Using logo-le-rounded.png as the base image for icons as it should be correct
    const out192 = path.join(__dirname, 'public', 'icons', 'icon-192x192.png');
    const out512 = path.join(__dirname, 'public', 'icons', 'icon-512x512.png');

    console.log('Generating 192x192...');
    await sharp(inputPath).resize(192, 192).png().toFile(out192);

    console.log('Generating 512x512...');
    await sharp(inputPath).resize(512, 512).png().toFile(out512);

    console.log('Icons fixed successfully!');
  } catch (error) {
    console.error('Error fixing icons:', error);
  }
}

fixIcons();
