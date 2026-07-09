const sharp = require('sharp');
const path = require('path');

async function run() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-le-small.png');
  const image = sharp(logoPath);
  const metadata = await image.metadata();
  console.log('Metadata:', metadata);
  
  // Let's output a few cropped versions to see which one cuts the border perfectly
  // 1. Center crop of 800x800
  await sharp(logoPath)
    .extract({ left: 112, top: 112, width: 800, height: 800 })
    .toFile(path.join(__dirname, '..', 'public', 'logo-crop-800.png'));
    
  // 2. Center crop of 750x750
  await sharp(logoPath)
    .extract({ left: 137, top: 137, width: 750, height: 750 })
    .toFile(path.join(__dirname, '..', 'public', 'logo-crop-750.png'));
    
  // 3. Center crop of 700x700
  await sharp(logoPath)
    .extract({ left: 162, top: 162, width: 700, height: 700 })
    .toFile(path.join(__dirname, '..', 'public', 'logo-crop-700.png'));

  console.log('Crops generated successfully in public/');
}

run().catch(console.error);
