const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

// Config
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000; // For dev
let mainWindow;
let backendProcess;

function getBackendPath() {
    const isDev = !app.isPackaged;
    if (isDev) {
        // Relative to the root of the project
        return path.join(__dirname, '../backend/dist/edgelend-engine');
    }
    // In production, resources are unpacked to the resources folder
    // Mac: Contents/Resources/edgelend-engine
    return path.join(process.resourcesPath, 'edgelend-engine');
}

function startBackend() {
    const binaryPath = getBackendPath();
    console.log(`Starting backend from: ${binaryPath}`);

    backendProcess = spawn(binaryPath, [], {
        // Hide terminal window on Windows
        windowsHide: true,
        stdio: 'inherit' // Pipe logs to main process console
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend process:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code} and signal ${signal}`);
    });
}

function killBackend() {
    if (backendProcess) {
        console.log('Killing backend process...');
        backendProcess.kill();
        backendProcess = null;
    }
}

async function createWindow() {
    // Start backend first
    startBackend();

    // Wait for the backend to be ready
    try {
        console.log('Waiting for backend to be ready...');
        await waitOn({
            resources: [`http://localhost:${BACKEND_PORT}/api/market`],
            timeout: 20000 // 20s timeout
        });
    } catch (err) {
        console.error('Backend failed to start in time or is unreachable', err);
        // Continue anyway, maybe show error page
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        // Hide until loaded to avoid white flash
        show: false
    });

    const isDev = !app.isPackaged;

    if (isDev) {
        // In dev, load the running Vite server
        mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built index.html
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    killBackend();
    // On Mac, standard is to stay open, but for this "Terminal" app, full quit acts cleaner
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    killBackend();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
