const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const inputFile = path.join(publicDir, 'logooriginal.webp');

const targets = [
  { name: 'logo-le-small.png', type: 'png' },
  { name: 'logo-le-rounded.png', type: 'png' },
  { name: 'logo-le.png', type: 'png' },
  { name: 'logo-clean-circle.png', type: 'png' },
  { name: 'logo-clean-square.png', type: 'png' },
  { name: 'logo-crop-700.png', type: 'png' },
  { name: 'logo-crop-750.png', type: 'png' },
  { name: 'logo-crop-800.png', type: 'png' },
  { name: 'app-icon.png', type: 'png' },
  { name: 'favicon.png', type: 'png' },
  { name: 'icons/icon-192x192.png', type: 'png' },
  { name: 'icons/icon-512x512.png', type: 'png' }
];

async function replaceLogos() {
  console.log('Starting logo replacement process...');
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file ${inputFile} does not exist!`);
    process.exit(1);
  }

  for (const target of targets) {
    const outputPath = path.join(publicDir, target.name);
    console.log(`Generating: ${outputPath}`);
    
    // Create subdirectories if they do not exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      // Overwrite the file with the converted version
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      await sharp(inputFile)
        .png()
        .toFile(outputPath);
      console.log(`Successfully generated ${target.name}`);
    } catch (err) {
      console.error(`Error generating ${target.name}:`, err);
    }
  }

  console.log('Logo replacement completed!');
}

replaceLogos();
