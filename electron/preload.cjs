const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Add API functions here if needed, e.g. openExternalLinks
    ping: () => console.log('pong')
});
