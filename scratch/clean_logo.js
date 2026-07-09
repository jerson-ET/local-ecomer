const sharp = require('sharp');
const path = require('path');

async function run() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-le-small.png');
  const outCircle = path.join(__dirname, '..', 'public', 'logo-clean-circle.png');
  const outSquare = path.join(__dirname, '..', 'public', 'logo-clean-square.png');

  // 1. Generate clean square logo by cropping the center (cutting off the border)
  await sharp(logoPath)
    .extract({ left: 128, top: 128, width: 768, height: 768 })
    .toFile(outSquare);

  // 2. Generate clean circular logo by masking out the border to transparency
  // We crop to 960x960 to center it, then apply a circular SVG mask of radius 440 (diameter 880) to cut off the border
  const width = 960;
  const r = 430; // Radius that cuts off the dark border
  const cx = width / 2;
  const cy = width / 2;

  const svgMask = Buffer.from(`
    <svg width="${width}" height="${width}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" />
    </svg>
  `);

  await sharp(logoPath)
    .extract({ left: 32, top: 32, width: width, height: width })
    .composite([{
      input: svgMask,
      blend: 'dest-in'
    }])
    .png()
    .toFile(outCircle);

  console.log('Clean logo versions generated successfully!');
}

run().catch(console.error);
