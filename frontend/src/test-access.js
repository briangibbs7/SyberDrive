const fs = require('fs');

const folder = '\\\\SJA-FILES\\Archive2019';

try {
  const items = fs.readdirSync(folder);
  console.log('✅ Folder contents:', items);
} catch (err) {
  console.error('❌ Cannot read folder:', err.message);
}