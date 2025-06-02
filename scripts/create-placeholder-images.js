const fs = require('fs');
const path = require('path');

// Create a simple SVG placeholder image
function createPlaceholderSVG(width, height, text, bgColor = '#f0f0f0', textColor = '#666') {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

// List of missing images to create
const missingImages = [
  { name: 'about-hero.jpg', width: 800, height: 400, text: 'About Hero Image' },
  { name: 'team-1.jpg', width: 300, height: 300, text: 'Team Member 1' },
  { name: 'team-2.jpg', width: 300, height: 300, text: 'Team Member 2' },
  { name: 'team-3.jpg', width: 300, height: 300, text: 'Team Member 3' },
  { name: 'team-4.jpg', width: 300, height: 300, text: 'Team Member 4' },
  { name: 'mission.jpg', width: 600, height: 400, text: 'Mission Image' },
  { name: 'map.jpg', width: 600, height: 400, text: 'Map Image' },
  { name: 'recipient-dashboard.jpg', width: 800, height: 500, text: 'Recipient Dashboard' },
  { name: 'volunteer-dashboard.jpg', width: 800, height: 500, text: 'Volunteer Dashboard' },
  { name: 'facebook-icon.png', width: 32, height: 32, text: 'FB', bgColor: '#1877f2', textColor: '#fff' },
  { name: 'twitter-icon.png', width: 32, height: 32, text: 'TW', bgColor: '#1da1f2', textColor: '#fff' },
  { name: 'linkedin-icon.png', width: 32, height: 32, text: 'LI', bgColor: '#0077b5', textColor: '#fff' },
  { name: 'instagram-icon.png', width: 32, height: 32, text: 'IG', bgColor: '#e4405f', textColor: '#fff' }
];

// Ensure the images directory exists
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create placeholder images
missingImages.forEach(image => {
  const svgContent = createPlaceholderSVG(
    image.width, 
    image.height, 
    image.text, 
    image.bgColor, 
    image.textColor
  );
  
  const filePath = path.join(imagesDir, image.name.replace(/\.(jpg|png)$/, '.svg'));
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created placeholder: ${image.name} -> ${path.basename(filePath)}`);
});

console.log('All placeholder images created successfully!');
