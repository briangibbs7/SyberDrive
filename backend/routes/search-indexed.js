
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

function getPreviewURL(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.pdf'].includes(ext)) {
    return `http://sja-files:3001/api/files/download?path=${encodeURIComponent(filePath)}`;
  }
  return null;
}

router.get('/', (req, res) => {
  const query = req.query.q?.trim();
  if (!query || query.length < 2) return res.json([]);

  const scriptPath = path.resolve(__dirname, '../search-index.ps1');
  const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -query "${query}"`;

  exec(psCommand, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error('PowerShell Search Error:', stderr || error.message);
      return res.status(500).json({ error: 'Windows Search failed.' });
    }

    const paths = stdout.split('|~|').filter(Boolean).map(p => {
      const fullPath = p.trim();
      return {
        name: path.basename(fullPath),
        path: fullPath,
        folder: path.dirname(fullPath),
        preview: getPreviewURL(fullPath)
      };
    });

    res.json(paths);
  });
});

module.exports = router;
