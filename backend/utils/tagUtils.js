
const fs = require('fs');
const path = require('path');

function getTagsFromFile() {
  const tagsPath = path.join(__dirname, '../tags.json');
  try {
    return JSON.parse(fs.readFileSync(tagsPath));
  } catch {
    return {};
  }
}

module.exports = { getTagsFromFile };
