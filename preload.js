const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agenda', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (data) => ipcRenderer.invoke('save-events', data),
  exportICal: (icalStr) => ipcRenderer.invoke('export-ical', icalStr),
  onMessage: (channel, callback) => ipcRenderer.on(channel, (_, ...args) => callback(...args)),
})