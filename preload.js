const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agenda', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (data) => ipcRenderer.invoke('save-events', data),
  exportJSON: (data) => ipcRenderer.invoke('export-json', data),
  importJSON: () => ipcRenderer.invoke('import-json'),
  exportICal: (icalStr) => ipcRenderer.invoke('export-ical', icalStr),
})