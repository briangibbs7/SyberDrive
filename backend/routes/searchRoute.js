
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getTagsFromFile } = require('../utils/tagUtils');

const sharedFolders = [
  'C:\\SJA-FILES\\Archive2019',
  'C:\\SJA-FILES\\DESIGNTEAM',
  'C:\\SJA-FILES\\groups_sa',
  'C:\\SJA-FILES\\NX_Data'
];

router.get('/search', async (req, res) => {
  const query = (req.query.query || '').toLowerCase();
  if (!query) return res.json([]);

  const tags = getTagsFromFile();
  const results = [];

  for (const basePath of sharedFolders) {
    await walkFolder(basePath, query, tags, results);
  }

  res.json(results);
});

async function walkFolder(folderPath, query, tags, results) {
  try {
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          await walkFolder(fullPath, query, tags, results);
        } else if (stat.isFile()) {
          const fileTags = tags[fullPath] || [];
          const matches = entry.toLowerCase().includes(query) ||
                          fileTags.some(t => t.toLowerCase().includes(query));
          if (matches) {
            results.push({
              name: entry,
              path: fullPath,
              size: stat.size,
              modified: stat.mtime,
              tags: fileTags
            });
          }
        }
      } catch {}
    }
  } catch {}
}

module.exports = router;
