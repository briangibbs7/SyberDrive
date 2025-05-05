import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Table, Form, Button, Breadcrumb, Modal, Card
} from 'react-bootstrap';

function FileBrowser({ path, onBack, darkMode, globalSearch }) {
  const [currentPath, setCurrentPath] = useState(path);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [gridView, setGridView] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetchData(currentPath);
  }, [currentPath]);

  const fetchData = async (targetPath) => {
    try {
      const res = await axios.get('http://sja-files:3001/api/files', {
        params: { path: targetPath }
      });
      setFiles(res.data.files || []);
      setFolders(res.data.folders || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleFolderClick = (folderPath) => setCurrentPath(folderPath);

  const handleDownload = (filePath) =>
    window.open(`http://sja-files:3001/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');

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
        console.error('Text preview error:', err);
      }
    }
  };

  const isImage = (name) => /\.(jpg|jpeg|png|gif)$/i.test(name);

  const highlightMatch = (text) => {
    const term = search || globalSearch;
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const sortedFiles = [...files].filter(file =>
    file.name.toLowerCase().includes(search.toLowerCase()) ||
    (globalSearch && file.name.toLowerCase().includes(globalSearch.toLowerCase()))
  ).sort((a, b) => {
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

  const pathParts = currentPath.split(/[/\\]+/);

  return (
    <Container fluid className={darkMode ? 'bg-dark text-white' : 'bg-white text-dark'}>
      <Row className="sticky-top bg-body-tertiary py-2 px-3 align-items-center border-bottom">
        <Col md="auto">
          <Button size="sm" onClick={onBack} variant="outline-primary">🏠 Home</Button>{' '}
          <Button size="sm" onClick={() => {
            const parts = currentPath.split(/[/\\]+/);
            if (parts.length > 1) setCurrentPath(parts.slice(0, -1).join('\\'));
          }} variant="outline-secondary">⬆ Up</Button>
        </Col>
        <Col>
          <Breadcrumb>
            {pathParts.map((part, i) => (
              <Breadcrumb.Item
                key={i}
                onClick={() => setCurrentPath(pathParts.slice(0, i + 1).join('\\'))}
                active={i === pathParts.length - 1}
              >
                {part}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col md={4}>
          <Form.Control
            size="sm"
            type="text"
            placeholder="Search this folder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>

      <Row className="px-3 py-2">
        <Col md={3}>
          <h6>📁 Subfolders</h6>
          <ul className="list-unstyled">
            {folders.map(folder => (
              <li key={folder.path}>
                <div
                  className={`subfolder-item py-1 px-2 rounded ${darkMode ? 'bg-secondary text-white' : 'bg-light text-dark'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleFolderClick(folder.path)}
                >
                  📁 {folder.name}
                </div>
              </li>
            ))}
          </ul>
        </Col>

        <Col md={9}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6>📄 Files</h6>
            <div className="d-flex gap-2">
              <Button size="sm" onClick={() => setGridView(!gridView)}>
                {gridView ? 'List View' : 'Grid View'}
              </Button>
              <Form.Select size="sm" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
                <option value="modified">Sort: Modified</option>
              </Form.Select>
              <Button size="sm" onClick={() => setSortAsc(!sortAsc)}>
                {sortAsc ? '▲' : '▼'}
              </Button>
            </div>
          </div>

          {!gridView ? (
            <Table striped bordered hover size="sm" variant={darkMode ? 'dark' : 'light'}>
              <thead>
                <tr><th>Name</th><th>Size</th><th>Date Modified</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {sortedFiles.map(file => (
                  <tr key={file.path}>
                    <td dangerouslySetInnerHTML={{ __html: highlightMatch(file.name) }} />
                    <td>{file.size?.toLocaleString()} bytes</td>
                    <td>{file.modified ? new Date(file.modified).toLocaleString() : '-'}</td>
                    <td>
                      <Button size="sm" onClick={() => handleDownload(file.path)} className="me-1">Download</Button>
                      <Button size="sm" variant="info" onClick={() => handlePreview(file)}>Preview</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Row className="g-3">
              {sortedFiles.map(file => (
                <Col md={4} key={file.path}>
                  <Card className={darkMode ? 'bg-secondary text-white' : ''}>
                    <Card.Body>
                      <Card.Title className="text-truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(file.name) }} />
                      {isImage(file.name) && (
                        <Card.Img
                          src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(file.path)}`}
                          alt="thumb"
                          style={{ maxHeight: 120, objectFit: 'contain' }}
                        />
                      )}
                      <small className="text-muted">Size: {file.size?.toLocaleString()} bytes</small><br />
                      <small className="text-muted">Modified: {file.modified ? new Date(file.modified).toLocaleString() : '-'}</small>
                      <div className="mt-2 d-flex gap-2">
                        <Button size="sm" onClick={() => handleDownload(file.path)}>Download</Button>
                        <Button size="sm" variant="info" onClick={() => handlePreview(file)}>Preview</Button>
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
        <Modal.Header closeButton>
          <Modal.Title>Preview: {previewFile?.name}</Modal.Title>
        </Modal.Header>
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
          {previewFile?.name?.endsWith('.mp4') && (
            <video controls style={{ width: '100%' }}>
              <source
                src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default FileBrowser;