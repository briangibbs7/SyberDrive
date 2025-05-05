import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Table, Form, Button, Card, Modal
} from 'react-bootstrap';

function GlobalSearchResults({ query, onBack, darkMode }) {
  const [results, setResults] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [gridView, setGridView] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`http://sja-files:3001/api/search-indexed?q=${encodeURIComponent(query)}`);
        setResults(res.data || []);
      } catch (err) {
        console.error('Search failed:', err);
      }
    };
    fetchResults();
  }, [query]);

  const sortedResults = [...results].sort((a, b) => {
    const valA = sortField === 'name' ? a.name.toLowerCase()
               : sortField === 'size' ? a.size
               : sortField === 'modified' ? new Date(a.modified) : '';
    const valB = sortField === 'name' ? b.name.toLowerCase()
               : sortField === 'size' ? b.size
               : sortField === 'modified' ? new Date(b.modified) : '';
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleDownload = (filePath) => {
    window.open(`http://sja-files:3001/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  const handlePreview = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4'].includes(ext)) {
      setPreviewFile(file);
    } else if (ext === 'txt') {
      try {
        const res = await axios.get(`http://sja-files:3001/api/files/text?path=${encodeURIComponent(file.path)}`);
        setPreviewText(res.data);
        setPreviewFile(file);
      } catch (err) {
        console.error('Text preview failed:', err);
      }
    } else {
      setPreviewText('Preview not available for this file type.');
      setPreviewFile(file);
    }
  };

  const handleOpenLocation = (filePath) => {
    const folderPath = filePath.replace(/[/\\][^/\\]+$/, '');
    window.dispatchEvent(new CustomEvent('openFolder', { detail: folderPath }));
    onBack();
  };

  const isImage = (name) => /\.(jpg|jpeg|png|gif)$/i.test(name);

  const highlightMatch = (text) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <Container fluid className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}>
      <Row className="sticky-top bg-body-tertiary py-2 px-3 align-items-center border-bottom">
        <Col>
          <h5>🔍 Search Results for: <span className="badge bg-secondary">{query}</span></h5>
        </Col>
        <Col xs="auto">
          <Button size="sm" variant="outline-secondary" onClick={onBack}>⬅ Back</Button>
        </Col>
      </Row>

      <Row className="px-3 py-2">
        <Col md={3}></Col>
        <Col md={9} className="d-flex justify-content-end gap-2 mb-2">
          <Button size="sm" onClick={() => setGridView(!gridView)}>
            {gridView ? 'List View' : 'Grid View'}
          </Button>
          <Form.Select size="sm" value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
            <option value="modified">Sort: Date</option>
          </Form.Select>
          <Button size="sm" onClick={() => setSortAsc(!sortAsc)}>
            {sortAsc ? '▲' : '▼'}
          </Button>
        </Col>

        <Col md={12}>
          {!gridView ? (
            <Table striped bordered hover size="sm" variant={darkMode ? 'dark' : 'light'}>
              <thead>
                <tr><th>Name</th><th>Size</th><th>Date Modified</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {sortedResults.map(file => (
                  <tr key={file.path}>
                    <td dangerouslySetInnerHTML={{ __html: highlightMatch(file.name) }}></td>
                    <td>{file.size?.toLocaleString() || '-'} bytes</td>
                    <td>{file.modified ? new Date(file.modified).toLocaleString() : '-'}</td>
                    <td>
                      <Button size="sm" onClick={() => handleDownload(file.path)} className="me-1">Download</Button>
                      <Button size="sm" variant="info" onClick={() => handlePreview(file)} className="me-1">Preview</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleOpenLocation(file.path)}>Open Location</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Row className="g-3">
              {sortedResults.map(file => (
                <Col md={4} key={file.path}>
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body>
                      <Card.Title
                        className="text-truncate"
                        dangerouslySetInnerHTML={{ __html: highlightMatch(file.name) }}
                      />
                      {isImage(file.name) && (
                        <Card.Img
                          src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(file.path)}`}
                          alt="thumb"
                          style={{ maxHeight: 120, objectFit: 'contain' }}
                        />
                      )}
                      <small className="text-muted">Size: {file.size?.toLocaleString()} bytes</small><br />
                      <small className="text-muted">Date: {file.modified ? new Date(file.modified).toLocaleString() : '-'}</small>
                      <div className="mt-2 d-flex gap-2">
                        <Button size="sm" onClick={() => handleDownload(file.path)}>Download</Button>
                        <Button size="sm" variant="info" onClick={() => handlePreview(file)}>Preview</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenLocation(file.path)}>Open Location</Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      <Modal show={!!previewFile} onHide={() => setPreviewFile(null)} size="xl" centered>
        <Modal.Header closeButton><Modal.Title>Preview: {previewFile?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {previewFile?.name?.endsWith('.pdf') && (
            <iframe
              src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
              style={{ width: '100%', height: '80vh' }}
              title="PDF Preview"
            />
          )}
          {isImage(previewFile?.name) && (
            <img
              src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
          {previewFile?.name?.endsWith('.txt') && (
            <pre style={{ maxHeight: '80vh', overflowY: 'auto' }}>{previewText}</pre>
          )}
          {!previewFile?.name?.match(/\\.(pdf|txt|jpg|jpeg|png|gif|mp4)$/i) && (
            <div>{previewText}</div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default GlobalSearchResults;