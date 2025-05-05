
const fs = require('fs').promises;
const path = require('path');

async function getFolderContents(folderPath) {
  const files = [];
  const folders = [];

  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    const stats = await fs.stat(fullPath);

    if (entry.isDirectory()) {
      folders.push({ name: entry.name, path: fullPath });
    } else {
      files.push({ name: entry.name, path: fullPath, size: stats.size, modified: stats.mtime });
    }
  }

  return { folders, files };
}

// Generator-based memory-safe recursion
async function* getFolderContentsRecursiveStream(folderPath) {
  try {
    const dir = await fs.opendir(folderPath);

    for await (const dirent of dir) {
      const fullPath = path.join(folderPath, dirent.name);

      if (dirent.isDirectory()) {
        yield* getFolderContentsRecursiveStream(fullPath); // Recurse safely
      } else {
        const stats = await fs.stat(fullPath);
        yield {
          name: dirent.name,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ Failed to scan', folderPath, err.message);
  }
}

module.exports = {
  getFolderContents,
  getFolderContentsRecursiveStream
};
