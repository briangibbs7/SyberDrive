const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ffmpegPath = 'C:/ffmpeg/bin/ffmpeg.exe';
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Serve files from a given path
router.get('/', async (req, res) => {
  const folderPath = decodeURIComponent(req.query.path || '');
  console.log('📁 Fetching files from:', folderPath);

  try {
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(folderPath, entry.name);
          const stats = await fs.promises.stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          };
        })
    );

    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(folderPath, entry.name)
      }));

    res.json({ files, folders });
  } catch (err) {
    console.error('❌ Error reading folder:', err.message);
    res.status(500).send('Failed to read folder');
  }
});

// Download or stream file (PDF/image inline handling)
router.get('/download', (req, res) => {
  const filePath = decodeURIComponent(req.query.path || '');
  console.log('[DOWNLOAD REQUEST]', filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const inlineTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.mp4'];
  const isInline = inlineTypes.includes(ext);

  res.setHeader('Content-Type', getMimeType(ext));
  res.setHeader(
    'Content-Disposition',
    `${isInline ? 'inline' : 'attachment'}; filename="${fileName}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  stream.on('error', (err) => {
    console.error('Stream error:', err);
    res.status(500).send('Error streaming file');
  });
});

// Text file preview
router.get('/text', (req, res) => {
  const filePath = decodeURIComponent(req.query.path || '');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error reading text file');
    res.send(data);
  });
});

// Auto-convert .avi to .mp4 for preview
router.get('/convert/avi', (req, res) => {
  const filePath = decodeURIComponent(req.query.path || '');
  if (!filePath.toLowerCase().endsWith('.avi')) return res.status(400).send('Not an AVI file');

  const targetPath = filePath.replace(/\.avi$/i, '.mp4');

  if (fs.existsSync(targetPath)) {
    console.log('✅ Already converted:', targetPath);
    return res.send({ path: targetPath });
  }

  console.log('🔄 Converting .avi → .mp4:', filePath);
  ffmpeg(filePath)
    .output(targetPath)
    .on('end', () => {
      console.log('✅ FFmpeg conversion complete');
      res.send({ path: targetPath });
    })
    .on('error', (err) => {
      console.error('❌ FFmpeg error:', err);
      res.status(500).send('Conversion failed');
    })
    .run();
});

const { execFile } = require('child_process');

router.get('/convert-pdf', (req, res) => {
  const filePath = decodeURIComponent(req.query.path || '');
  const ext = path.extname(filePath).toLowerCase();

  if (!['.doc', '.docx', '.xls', '.xlsx'].includes(ext)) {
    return res.status(400).send('Unsupported file type');
  }

  const outputPath = filePath.replace(ext, '.pdf');
  const script = ext === '.xls' || ext === '.xlsx'
    ? path.resolve(__dirname, '../convert-excel.ps1')
    : path.resolve(__dirname, '../convert-word.ps1');

  console.log(`Converting: ${filePath} → ${outputPath} using ${script}`);

  execFile('powershell.exe', [
    '-ExecutionPolicy', 'Bypass',
    '-File', script,
    filePath,
    outputPath
  ], (error) => {
    if (error) {
      console.error('PowerShell conversion failed:', error.message);
      return res.status(500).send('Conversion failed.');
    }

    // Confirm file was created
    fs.access(outputPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('PDF not found after conversion:', outputPath);
        return res.status(500).send('PDF not created.');
      }

      res.sendFile(outputPath);
    });
  });
});

// Helper function for MIME type
function getMimeType(ext) {
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.txt': return 'text/plain';
    case '.mp4': return 'video/mp4';
    default: return 'application/octet-stream';
  }
}

module.exports = router;