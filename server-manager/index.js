const express = require('express');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. API to Get Running Services (via Docker)
app.get('/api/services', (req, res) => {
    // Assuming docker CLI is available inside this container or via socket
    exec('docker ps --format "{{json .}}"', (err, stdout) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch docker containers', details: err.message });
        }
        try {
            const containers = stdout.split('\n')
                                     .filter(line => line.trim() !== '')
                                     .map(line => JSON.parse(line));
            res.json(containers);
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse docker output' });
        }
    });
});

// 2. API to Start/Stop/Restart a service
app.post('/api/services/:action', (req, res) => {
    const { action } = req.params;
    const { containerId } = req.body;
    
    if (!['start', 'stop', 'restart'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    exec(`docker ${action} ${containerId}`, (err) => {
        if (err) {
            return res.status(500).json({ error: `Failed to ${action} container`, details: err.message });
        }
        res.json({ success: true, message: `Container ${action}ed successfully.` });
    });
});

// 3. File Manager: List Directory
// The root directory for the file manager will be the monorepo root mounted to /app-repo
const REPO_ROOT = process.env.REPO_ROOT || path.join(__dirname, '..');

app.get('/api/files', async (req, res) => {
    try {
        const queryPath = req.query.path || '';
        const targetPath = path.join(REPO_ROOT, queryPath);
        
        // Prevent path traversal
        if (!targetPath.startsWith(REPO_ROOT)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const items = await fs.readdir(targetPath);
        const fileList = [];
        
        for (let item of items) {
            const itemPath = path.join(targetPath, item);
            const stat = await fs.stat(itemPath);
            fileList.push({
                name: item,
                isDirectory: stat.isDirectory(),
                size: stat.size,
                path: path.join(queryPath, item).replace(/\\/g, '/')
            });
        }
        
        // Sort: directories first
        fileList.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        });

        res.json(fileList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. File Manager: Read File
app.get('/api/files/read', async (req, res) => {
    try {
        const queryPath = req.query.path;
        if (!queryPath) return res.status(400).json({ error: 'Path is required' });

        const targetPath = path.join(REPO_ROOT, queryPath);
        if (!targetPath.startsWith(REPO_ROOT)) return res.status(403).json({ error: 'Access denied' });

        const content = await fs.readFile(targetPath, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. File Manager: Write File
app.post('/api/files/write', async (req, res) => {
    try {
        const { path: queryPath, content } = req.body;
        if (!queryPath || content === undefined) return res.status(400).json({ error: 'Path and content are required' });

        const targetPath = path.join(REPO_ROOT, queryPath);
        if (!targetPath.startsWith(REPO_ROOT)) return res.status(403).json({ error: 'Access denied' });

        await fs.writeFile(targetPath, content, 'utf-8');
        res.json({ success: true, message: 'File saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server Manager Backend running on port ${PORT}`);
});
