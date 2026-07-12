const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'app');
const rawFile = path.join(publicDir, 'logooriginal_raw.webp');
const activeFile = path.join(publicDir, 'logooriginal.webp');

// Backup the raw file if not already done
if (!fs.existsSync(rawFile) && fs.existsSync(activeFile)) {
  console.log('Backing up raw logooriginal.webp to logooriginal_raw.webp...');
  fs.copyFileSync(activeFile, rawFile);
}

const sourceFile = fs.existsSync(rawFile) ? rawFile : activeFile;

const targets = [
  // WebP optimized version for general use in codebase (15% rounding for rounded-square brand look)
  { destDir: publicDir, name: 'logooriginal.webp', width: 512, height: 512, format: 'webp', quality: 85, rounding: 0.15 },
  
  // PNG target assets in public/
  { destDir: publicDir, name: 'logo-le-small.png', width: 128, height: 128, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'logo-le-rounded.png', width: 256, height: 256, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'logo-le.png', width: 512, height: 512, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'logo-clean-circle.png', width: 256, height: 256, format: 'png', rounding: 0.50 }, // circular
  { destDir: publicDir, name: 'logo-clean-square.png', width: 256, height: 256, format: 'png', rounding: 0.00 }, // square
  { destDir: publicDir, name: 'logo-crop-700.png', width: 256, height: 256, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'logo-crop-750.png', width: 256, height: 256, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'logo-crop-800.png', width: 256, height: 256, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'app-icon.png', width: 256, height: 256, format: 'png', rounding: 0.15 },
  { destDir: publicDir, name: 'favicon.png', width: 64, height: 64, format: 'png', rounding: 0.50 }, // circular favicon
  { destDir: publicDir, name: 'icons/icon-192x192.png', width: 192, height: 192, format: 'png', rounding: 0.50 }, // PWA circles
  { destDir: publicDir, name: 'icons/icon-512x512.png', width: 512, height: 512, format: 'png', rounding: 0.50 },

  // Next.js App Router Favicon target (using icon.png)
  { destDir: appDir, name: 'icon.png', width: 32, height: 32, format: 'png', rounding: 0.50 } // circular
];

async function optimizeLogos() {
  console.log('Starting logo optimization and resizing...');
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source logo file ${sourceFile} not found!`);
    process.exit(1);
  }

  // 1. Delete app/favicon.ico if it exists, since Next.js prioritizes it and it contains the default Next.js icon
  const appFavicon = path.join(appDir, 'favicon.ico');
  if (fs.existsSync(appFavicon)) {
    console.log('Deleting default app/favicon.ico to allow app/icon.png and favicon.png to work...');
    fs.unlinkSync(appFavicon);
  }

  // Get metadata to calculate center extraction once
  const metadata = await sharp(sourceFile).metadata();
  const rawWidth = metadata.width;
  const rawHeight = metadata.height;
  const size = Math.min(rawWidth, rawHeight);
  
  // Crop an 85% region from the raw image preserving aspect ratio (zoom-in)
  const cropWidth = Math.floor(rawWidth * 0.85);
  const cropHeight = Math.floor(rawHeight * 0.85);
  const left = Math.floor((rawWidth - cropWidth) / 2);
  const top = Math.floor((rawHeight - cropHeight) / 2);

  // 2. Generate all optimized targets
  for (const target of targets) {
    const outputPath = path.join(target.destDir, target.name);
    console.log(`Optimizing target: ${target.name} (${target.width}x${target.height} as ${target.format})`);
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      // Generate SVG mask for target's specific rounded corners radius
      const roundingVal = target.rounding !== undefined ? target.rounding : 0.15;
      const rx = target.width * roundingVal;
      const ry = target.height * roundingVal;
      
      const roundedCorners = Buffer.from(
        `<svg width="${target.width}" height="${target.height}">
          <rect x="0" y="0" width="${target.width}" height="${target.height}" rx="${rx}" ry="${ry}" fill="#fff"/>
        </svg>`
      );

      let pipeline = sharp(sourceFile)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(target.width, target.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .composite([{
          input: roundedCorners,
          blend: 'dest-in'
        }]);

      if (target.format === 'webp') {
        pipeline = pipeline.webp({ quality: target.quality });
      } else if (target.format === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9 });
      }

      await pipeline.toFile(outputPath);
      const stats = fs.statSync(outputPath);
      console.log(`Successfully generated ${target.name} in ${target.destDir} - Size: ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.error(`Error generating ${target.name}:`, err);
    }
  }

  console.log('Logo optimization and resizing completed successfully!');
}

optimizeLogos();
