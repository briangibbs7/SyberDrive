
const express = require('express');
const router = express.Router();
const path = require('path');
const { getFolderContentsRecursiveStream } = require('../utils/fileScanner');
const TAGS_PATH = path.join(__dirname, '../tags.json');

const sharedFolders = [
  'F:\\Archive2019',
  'G:\\DESIGNTEAM',
  'E:\\Shares\\groups_sa',
  'E:\\NX_Data',
  'S:\\'
];

router.get('/', async (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  if (!query || query.length < 2) return res.json([]);

  let tags = {};
  try {
    tags = require(TAGS_PATH);
  } catch {}

  const results = [];

  for (const folder of sharedFolders) {
    try {
      for await (const file of getFolderContentsRecursiveStream(folder)) {
        const matchName = file.name.toLowerCase().includes(query);
        const matchTags = (tags[file.path] || []).some(tag => tag.toLowerCase().includes(query));
        if (matchName || matchTags) {
          results.push(file);
        }
      }
    } catch (err) {
      console.warn('⚠️ Search read failed for', folder, err.message);
    }
  }

  res.json(results);
});

module.exports = router;
