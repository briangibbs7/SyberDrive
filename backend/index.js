const express = require('express');
const cors = require('cors');
const files = require('./routes/files');
const search = require('./routes/search');
const searchIndexed = require('./routes/search-indexed'); // ✅ NEW

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/files', files);
app.use('/api/search', search);                   // optional: existing recursive search
app.use('/api/search-indexed', searchIndexed);    // ✅ new fast Windows-indexed search

// Root
app.get('/', (req, res) => {
  res.send('SJA-FILES backend is running!');
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://sja-files:${PORT}`);
});
