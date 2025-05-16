import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Table, Form, Button, Card, Modal
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
      const res = await axios.get('http://sja-files:3001/api/files', { params: { path: targetPath } });
      setFiles(res.data.files || []);
      setFolders(res.data.folders || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleFolderClick = (folderPath) => setCurrentPath(folderPath);
  const handleLevelUp = () => {
    const parts = currentPath.split(/[/\\]+/);
    if (parts.length > 1) setCurrentPath(parts.slice(0, -1).join('\\'));
  };
  const handleHome = () => setCurrentPath(path);

  const handleDownload = (filePath) => {
    window.open(`http://sja-files:3001/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  const handlePreview = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'mp4'].includes(ext)) {
      setPreviewFile(file);
    } else if (ext === 'avi') {
      try {
        const res = await axios.get(`http://sja-files:3001/api/files/convert-video?path=${encodeURIComponent(file.path)}`);
        setPreviewFile({ ...file, convertedUrl: `http://sja-files:3001${res.data.url}` });
      } catch (err) {
        console.error('AVI to MP4 conversion failed', err);
      }
    } else if (ext === 'txt') {
      try {
        const res = await axios.get(`http://sja-files:3001/api/files/text?path=${encodeURIComponent(file.path)}`);
        setPreviewText(res.data);
        setPreviewFile(file);
      } catch (err) {
        console.error('Text preview error:', err);
      }
    } else if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      setPreviewFile(file);
    }
  };

  const isImage = (name) => /\.(jpg|jpeg|png|gif|bmp)$/i.test(name);
  const isOfficeDoc = (name) => /\.(doc|docx|xls|xlsx)$/i.test(name);

  const highlightMatch = (text) => {
    const term = search || globalSearch;
    if (!term) return text;
    return text.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>');
  };

  const sortedFiles = [...files].filter(file =>
    file.name.toLowerCase().includes(search.toLowerCase()) ||
    (globalSearch && file.name.toLowerCase().includes(globalSearch.toLowerCase()))
  ).sort((a, b) => {
    const valA = sortField === 'name' ? a.name.toLowerCase() :
                 sortField === 'size' ? a.size :
                 new Date(a.modified);
    const valB = sortField === 'name' ? b.name.toLowerCase() :
                 sortField === 'size' ? b.size :
                 new Date(b.modified);
    return (valA < valB ? -1 : valA > valB ? 1 : 0) * (sortAsc ? 1 : -1);
  });

  const pathParts = currentPath.split(/[/\\]+/);

  return (
    <Container fluid className={darkMode ? 'bg-dark text-white' : 'bg-white text-dark'}>
      <Row className="px-3 py-3">
        <Col md={3}>
          <div className="mb-3">
            <Button size="sm" variant="outline-primary" onClick={handleHome}>🏠 Home</Button>{' '}
            <Button size="sm" variant="outline-secondary" onClick={handleLevelUp}>⬆ Up</Button>
          </div>
          <h6>📂 Current Path</h6>
          <ul className="list-unstyled">
            {pathParts.map((part, i) => {
              const subPath = pathParts.slice(0, i + 1).join('\\');
              return (
                <li key={i}>
                  <div
                    className="subfolder-item py-1 px-2 rounded mb-1"
                    style={{ cursor: 'pointer', backgroundColor: darkMode ? '#495057' : '#f1f3f5' }}
                    onClick={() => setCurrentPath(subPath)}
                  >
                    📁 {part}
                  </div>
                </li>
              );
            })}
          </ul>

          <h6 className="mt-4">📁 Subfolders</h6>
          <ul className="list-unstyled">
            {folders.map(folder => (
              <li key={folder.path}>
                <div
                  className="subfolder-item py-1 px-2 rounded"
                  style={{ cursor: 'pointer', backgroundColor: darkMode ? '#6c757d' : '#e9ecef' }}
                  onClick={() => handleFolderClick(folder.path)}
                >
                  📁 {folder.name}
                </div>
              </li>
            ))}
          </ul>
        </Col>

        <Col md={9}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>📄 Files</h5>
            <div className="d-flex gap-2">
              <Button size="sm" onClick={() => setGridView(!gridView)}>{gridView ? 'List View' : 'Grid View'}</Button>
              <Form.Select size="sm" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
                <option value="modified">Sort: Modified</option>
              </Form.Select>
              <Button size="sm" onClick={() => setSortAsc(!sortAsc)}>{sortAsc ? '▲' : '▼'}</Button>
            </div>
          </div>

          {!gridView ? (
            <Table striped bordered hover size="sm" variant={darkMode ? 'dark' : 'light'}>
              <thead><tr><th>Name</th><th>Size</th><th>Modified</th><th>Actions</th></tr></thead>
              <tbody>
                {sortedFiles.map(file => (
                  <tr key={file.path}>
                    <td dangerouslySetInnerHTML={{ __html: highlightMatch(file.name) }} />
                    <td>{file.size?.toLocaleString()} bytes</td>
                    <td>{file.modified ? new Date(file.modified).toLocaleString() : '-'}</td>
                    <td>
                      <Button size="sm" className="me-1" onClick={() => handleDownload(file.path)}>Download</Button>
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
                          alt="Preview"
                          style={{ maxHeight: 120, objectFit: 'contain' }}
                        />
                      )}
                      {file.name.toLowerCase().endsWith('.pdf') && (
                        <iframe
                          src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(file.path)}`}
                          title="PDF"
                          style={{ width: '100%', height: '120px', border: 'none' }}
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
        <Modal.Header closeButton><Modal.Title>Preview: {previewFile?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {previewFile?.name?.endsWith('.pdf') && (
            <iframe
              src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
              title="PDF Preview"
              style={{ width: '100%', height: '80vh' }}
            />
          )}
          {isImage(previewFile?.name) && (
            <img
              src={`http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
              alt="Image"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
          {previewFile?.name?.endsWith('.txt') && (
            <pre style={{ maxHeight: '80vh', overflowY: 'auto' }}>{previewText}</pre>
          )}
          {isOfficeDoc(previewFile?.name) && (
            <iframe
              src={`http://sja-files:3001/api/files/convert-pdf?path=${encodeURIComponent(previewFile.path)}`}
              title="Converted Office Preview"
              style={{ width: '100%', height: '80vh', border: 'none' }}
            />
          )}
          {(previewFile?.convertedUrl || previewFile?.name?.endsWith('.mp4')) && (
            <video controls style={{ width: '100%' }}>
              <source
                src={previewFile.convertedUrl || `http://sja-files:3001/api/files/download?path=${encodeURIComponent(previewFile.path)}`}
                type="video/mp4"
              />
            </video>
          )}
          {previewFile?.path && (
            <div className="mt-3">
              <Form.Label>File Location</Form.Label>
              <Form.Control type="text" readOnly value={previewFile.path} />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default FileBrowser;