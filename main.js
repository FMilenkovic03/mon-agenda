const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

// Chemin vers le fichier de données
const dataPath = path.join(app.getPath('userData'), 'events.json')

// Charge les événements depuis le disque
function loadEvents() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    }
  } catch (e) {}
  return []
}

// Sauvegarde les événements sur le disque
function saveEvents(events) {
  fs.writeFileSync(dataPath, JSON.stringify(events, null, 2))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
    titleBarStyle: 'default',
    title: 'Mon Agenda'
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  // Vérifie les rappels toutes les minutes
  setInterval(() => {
    const events = loadEvents()
    const now = new Date()
    events.forEach(ev => {
      if (!ev.reminder || !ev.time || !ev.date) return
      const evDate = new Date(`${ev.date}T${ev.time}`)
      const diff = (evDate - now) / 60000 // en minutes
      if (diff > 0 && diff <= parseInt(ev.reminder) && !ev._notified) {
        new Notification({
          title: '🔔 Mon Agenda',
          body: `Rappel : ${ev.title} à ${ev.time}`
        }).show()
        ev._notified = true
      }
    })
    saveEvents(events)
  }, 60000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC — communication avec la page HTML
ipcMain.handle('load-events', () => loadEvents())
ipcMain.handle('save-events', (_, events) => { saveEvents(events); return true })