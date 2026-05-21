const fs = require('fs');
const path = require('path');
const https = require('https');

// Target directory for images
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// List of images to download
const imagesToDownload = [
  {
    name: 'hero-1.webp',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=75&w=1200&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'hero-2.webp',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=75&w=1200&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'hero-3.webp',
    url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=75&w=1200&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'dresses.webp',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=75&w=600&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'tops.webp',
    url: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=75&w=600&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'accessories.webp',
    url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=75&w=600&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'brand-story.webp',
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=75&w=800&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'product-silk-dress.webp',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=75&w=600&auto=format&fit=crop&fm=webp'
  },
  {
    name: 'product-white-blouse.webp',
    url: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=75&w=600&auto=format&fit=crop&fm=webp'
  }
];

// Ensure the directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  console.log(`Creating directory: ${IMAGES_DIR}`);
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Download a single file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        console.log(`Successfully downloaded: ${path.basename(destPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete local file on error
      reject(err);
    });
  });
}

// Download all images sequentially
async function run() {
  console.log('Starting image downloads & compression check...');
  for (const img of imagesToDownload) {
    const destPath = path.join(IMAGES_DIR, img.name);
    try {
      console.log(`Downloading ${img.name}...`);
      await downloadFile(img.url, destPath);
    } catch (error) {
      console.error(`Error downloading ${img.name}:`, error.message);
    }
  }
  console.log('Image download process finished successfully!');
}

run();
