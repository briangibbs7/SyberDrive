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
  { name: 'NX_Data', path: 'E:\\NX_Data' },
];

function App() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [subfolders, setSubfolders] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const showGlobalResults = globalSearch.length > 2;

  useEffect(() => {
    const saved = localStorage.getItem('lastFolder');
    if (saved) {
      setSelectedFolder({ name: '', path: saved });
    } else {
      setSelectedFolder(sharedFolders[0]);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const path = e.detail;
      setSelectedFolder({ name: '', path });
      localStorage.setItem('lastFolder', path);
      setGlobalSearch('');
    };
    window.addEventListener('openFolder', handler);
    return () => window.removeEventListener('openFolder', handler);
  }, []);

  const toggleExpand = async (folderPath) => {
    const isExpanded = expanded[folderPath];
    setExpanded({ ...expanded, [folderPath]: !isExpanded });

    if (!isExpanded && !subfolders[folderPath]) {
      try {
        const res = await axios.get('http://sja-files:3001/api/files', {
          params: { path: folderPath }
        });
        setSubfolders((prev) => ({
          ...prev,
          [folderPath]: res.data.folders || []
        }));
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
          style={{ cursor: 'pointer' }}
        >
          <span onClick={() => toggleExpand(folder.path)} style={{ width: '1.2rem' }}>
            {children.length > 0 || !subfolders[folder.path] ? (
              isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />
            ) : null}
          </span>
          <span
            className="d-flex align-items-center w-100"
            onClick={() => {
              setSelectedFolder(folder);
              localStorage.setItem('lastFolder', folder.path);
            }}
          >
            <FaUsers className="me-2" />
            <span className="text-uppercase">{folder.name}</span>
          </span>
        </div>
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const expandAll = async () => {
    const newExpanded = {};
    for (const folder of sharedFolders) {
      newExpanded[folder.path] = true;
      if (!subfolders[folder.path]) {
        try {
          const res = await axios.get('http://sja-files:3001/api/files', {
            params: { path: folder.path }
          });
          subfolders[folder.path] = res.data.folders || [];
        } catch (err) {
          console.warn('Expand all fetch error:', folder.path);
        }
      }
    }
    setExpanded(newExpanded);
    setSubfolders({ ...subfolders });
  };

  const collapseAll = () => setExpanded({});

  return (
    <Container fluid className={darkMode ? 'bg-dark text-white' : 'bg-light text-dark'} style={{ height: '100vh', overflow: 'hidden' }}>
      <Row style={{ height: '100%' }}>
        {/* Sidebar */}
        <Col xs="auto" style={{ width: '270px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc' }}>
          <div style={{ padding: '1rem', height: '100vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="d-flex align-items-center text-uppercase">
                <FaUsers className="me-2" /> Shared Drives
              </h6>
              <div className="d-flex gap-1">
                <Button size="sm" variant="outline-secondary" onClick={expandAll}>+</Button>
                <Button size="sm" variant="outline-secondary" onClick={collapseAll}>−</Button>
              </div>
            </div>
            <div>{sharedFolders.map(folder => renderFolder(folder))}</div>
          </div>
        </Col>

        {/* Main */}
        <Col style={{ height: '100vh', overflowY: 'auto' }}>
          <Row className="align-items-center justify-content-between py-3 px-4">
            <Col md={6}><h3>SJA-FILES Drive</h3></Col>
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
                selectedFolder && (
                  <FileBrowser
                    key={selectedFolder?.path}
                    path={selectedFolder.path}
                    onBack={() => setSelectedFolder(null)}
                    darkMode={darkMode}
                    globalSearch={globalSearch}
                  />
                )
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default App;