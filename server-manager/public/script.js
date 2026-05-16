// script.js
let currentPath = '';

// Tab switching logic
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabId + '-tab').style.display = 'block';
    event.currentTarget.classList.add('active');

    if (tabId === 'dashboard') loadServices();
    if (tabId === 'files') loadFiles('');
}

// Docker API
async function loadServices() {
    try {
        const res = await fetch('/api/services');
        const containers = await res.json();
        
        const grid = document.getElementById('services-grid');
        grid.innerHTML = '';

        if (!containers || containers.length === 0) {
            grid.innerHTML = '<p>No services found or Docker is not running.</p>';
            return;
        }

        containers.forEach(c => {
            const isRunning = c.State === 'running';
            let iconClass = 'bx-cube';
            if (c.Names.includes('php')) iconClass = 'bxl-php php';
            else if (c.Names.includes('node')) iconClass = 'bxl-nodejs node';
            else if (c.Names.includes('nginx')) iconClass = 'bx-globe';

            grid.innerHTML += `
                <div class="service-card">
                    <div class="service-header">
                        <i class='bx ${iconClass} service-icon'></i>
                        <div class="service-title">
                            <h4>${c.Names}</h4>
                            <span class="badge ${isRunning ? 'success' : 'warning'}">${c.State}</span>
                        </div>
                    </div>
                    <p class="service-desc">Image: ${c.Image}</p>
                    <div class="service-footer">
                        <span>${c.Status}</span>
                        <div style="display:flex; gap:5px;">
                            ${isRunning ? `<button class="btn btn-icon" onclick="manageService('${c.ID}', 'stop')"><i class='bx bx-stop'></i></button>` : `<button class="btn btn-icon" onclick="manageService('${c.ID}', 'start')"><i class='bx bx-play'></i></button>`}
                            <button class="btn btn-icon" onclick="manageService('${c.ID}', 'restart')"><i class='bx bx-refresh'></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function manageService(id, action) {
    if (!confirm(`Are you sure you want to ${action} this container?`)) return;
    try {
        const res = await fetch(`/api/services/${action}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ containerId: id })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadServices();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        alert('Network error');
    }
}

// File Manager API
async function loadFiles(path) {
    try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
        const files = await res.json();
        
        currentPath = path;
        const list = document.getElementById('file-list');
        list.innerHTML = '';

        if (path !== '') {
            const parentPath = path.split('/').slice(0, -1).join('/');
            list.innerHTML += `<div style="padding:10px; cursor:pointer;" onclick="loadFiles('${parentPath}')"><i class='bx bx-level-up'></i> .. (Go Back)</div>`;
        }

        files.forEach(f => {
            const icon = f.isDirectory ? 'bx-folder' : 'bx-file';
            const action = f.isDirectory ? `loadFiles('${f.path}')` : `openFile('${f.path}')`;
            list.innerHTML += `
                <div style="padding:10px; border-bottom: 1px solid var(--secondary); cursor:pointer; display:flex; align-items:center; gap:10px;" onclick="${action}">
                    <i class='bx ${icon}' style="font-size:20px;"></i>
                    ${f.name}
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

let activeFile = '';

async function openFile(path) {
    try {
        const res = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        activeFile = path;
        document.getElementById('file-editor-container').style.display = 'flex';
        document.getElementById('editing-filename').innerText = path;
        document.getElementById('file-content').value = data.content;
    } catch (e) {
        alert('Could not open file');
    }
}

async function saveFile() {
    if (!activeFile) return alert('No file opened');
    const content = document.getElementById('file-content').value;
    try {
        const res = await fetch('/api/files/write', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ path: activeFile, content })
        });
        const data = await res.json();
        if (data.success) {
            alert('File saved successfully!');
        } else {
            alert('Failed to save file: ' + data.error);
        }
    } catch (e) {
        alert('Network error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadServices();
});

function triggerDeploy() {
    alert("This action should be handled automatically via Webhook, or you can build a manual trigger endpoint.");
}
