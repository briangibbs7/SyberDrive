import React, { useState, useEffect } from 'react';
import FileBrowser from './FileBrowser';
import GlobalSearchResults from './GlobalSearchResults';
import axios from 'axios';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { FaChevronRight, FaChevronDown, FaUsers } from 'react-icons/fa';
import './App.css';

const sharedFolders = [
  { name: 'Archive2019', path: 'F:\\Archive2019' },
  { name: 'DESIGNTEAM', path: 'G:\\DESIGNTEAM' },
  { name: 'GROUPS SA', path: 'E:\\Shares\\groups_sa' },
  { name: 'NX_Data', path: 'E:\\NX_Data' }
];

function App() {
  const [selectedFolder, setSelectedFolder] = useState(sharedFolders[0]);
  const [currentPath, setCurrentPath] = useState(sharedFolders[0].path);
  const [expanded, setExpanded] = useState({});
  const [subfolders, setSubfolders] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const showGlobalResults = globalSearch.length > 2;

  // ✅ Open Location support: watch for openFolder event
  useEffect(() => {
    const handleOpenFolder = (e) => {
      const folderPath = e.detail;
      const matched = sharedFolders.find(f => folderPath.startsWith(f.path));

      if (matched) {
        setSelectedFolder(matched);
        setCurrentPath(folderPath);
        setGlobalSearch('');
        console.log('[App] OpenFolder matched:', folderPath);
      } else {
        console.warn('[App] No matching shared folder for:', folderPath);
      }
    };

    window.addEventListener('openFolder', handleOpenFolder);
    return () => window.removeEventListener('openFolder', handleOpenFolder);
  }, []);

  const toggleExpand = async (folderPath) => {
    const isExpanded = expanded[folderPath];
    setExpanded({ ...expanded, [folderPath]: !isExpanded });

    if (!isExpanded && !subfolders[folderPath]) {
      try {
        const res = await axios.get('http://sja-files:3001/api/files', { params: { path: folderPath } });
        setSubfolders(prev => ({ ...prev, [folderPath]: res.data.folders || [] }));
      } catch (err) {
        console.error('Failed to fetch subfolders:', err);
      }
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expanded[folder.path];
    const children = subfolders[folder.path] || [];
    const isSelected = selectedFolder?.path === folder.path;

    return (
      <div key={folder.path} style={{ paddingLeft: `${level * 1.2}rem` }}>
        <div
          className={`d-flex align-items-center mb-1 folder-item ${isSelected ? 'selected' : ''} ${darkMode ? 'dark-mode' : ''}`}
          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <span onClick={() => toggleExpand(folder.path)} style={{ width: '1.2rem' }}>
            {children.length > 0 || !subfolders[folder.path]
              ? isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />
              : null}
          </span>
          <span
            className="d-flex align-items-center w-100"
            onClick={() => {
              setSelectedFolder(folder);
              setCurrentPath(folder.path);
            }}
          >
            <FaUsers className="me-2" />
            <span className="text-uppercase">{folder.name}</span>
          </span>
        </div>
        {isExpanded && children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <Container fluid className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'} style={{ height: '100vh', overflow: 'hidden' }}>
      <Row style={{ height: '100%' }}>
        <Col xs="auto" style={{ width: '270px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc' }}>
          <div style={{ padding: '1rem', height: '100vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="d-flex align-items-center text-uppercase">
                <FaUsers className="me-2" /> Shared Drives
              </h6>
            </div>
            {sharedFolders.map(folder => renderFolder(folder))}
          </div>
        </Col>

        <Col style={{ height: '100vh', overflowY: 'auto' }}>
          <Row className="align-items-center justify-content-between py-3 px-4 sticky-top"
               style={{ background: darkMode ? '#212529' : '#f8f9fa', zIndex: 1020 }}>
            <Col md={6}><h4>SJA-FILES</h4></Col>
            <Col md={6} className="d-flex justify-content-end align-items-center gap-3">
              <Form.Check
                type="switch"
                label="🌙 Dark Mode"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <Form.Control
                type="text"
                placeholder="Search all folders..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </Col>
          </Row>

          <Row className="px-4">
            <Col>
              {showGlobalResults ? (
                <GlobalSearchResults
                  query={globalSearch}
                  onBack={() => setGlobalSearch('')}
                  darkMode={darkMode}
                />
              ) : (
                <FileBrowser
                  key={currentPath}
                  path={currentPath}
                  onBack={() => setSelectedFolder(null)}
                  darkMode={darkMode}
                  globalSearch={globalSearch}
                />
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default App;