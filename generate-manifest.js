const fs = require('fs');
const path = require('path');

// Update this to point to the public folder
const imagesDir = path.join(__dirname, 'public', 'images');
const manifestPath = path.join(__dirname, 'public', 'image-manifest.json');

fs.readdir(imagesDir, (err, files) => {
  if (err) {
    console.error('Error reading images directory:', err);
    return;
  }
  // Filter for common image file extensions
  const images = files.filter(file => /\.(png|jpe?g|gif|svg)$/i.test(file));
  fs.writeFile(manifestPath, JSON.stringify(images, null, 2), (err) => {
    if (err) {
      console.error('Error writing manifest:', err);
    } else {
      console.log('Image manifest generated successfully.');
    }
  });
});
