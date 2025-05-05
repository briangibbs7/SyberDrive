import React, { useState } from 'react';
import { Modal, Button, Form, ProgressBar, Alert } from 'react-bootstrap';
import axios from 'axios';

function UploadModal({ show, onHide, currentPath, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('path', currentPath);

    try {
      setUploading(true);
      setError('');
      await axios.post('http://sja-files:3001/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });

      setSelectedFile(null);
      setUploading(false);
      setProgress(0);
      onUploadSuccess(); // trigger file list refresh
      onHide();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>📤 Upload File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group controlId="formFile">
          <Form.Label>Select a file to upload to:</Form.Label>
          <Form.Control type="file" onChange={handleFileChange} />
          <Form.Text muted>Destination: <code>{currentPath}</code></Form.Text>
        </Form.Group>

        {uploading && (
          <ProgressBar animated now={progress} label={`${progress}%`} className="mt-3" />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={uploading}>Cancel</Button>
        <Button variant="primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UploadModal;