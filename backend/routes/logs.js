const fs = require('fs');
const express = require('express');
const router = express.Router();
const path = require('path');

router.post('/preview', (req, res) => {
  const logEntry = `[${new Date().toISOString()}] Previewed: ${req.body.filePath}\\n`;
  fs.appendFileSync(path.join(__dirname, '../preview.log'), logEntry);
  res.sendStatus(200);
});

module.exports = router;