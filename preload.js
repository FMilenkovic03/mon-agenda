const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agenda', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (events) => ipcRenderer.invoke('save-events', events)
})