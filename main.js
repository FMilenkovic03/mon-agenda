const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const dataPath = path.join(app.getPath('userData'), 'events.json')

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    }
  } catch (e) {}
  return []
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
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
    const data = loadData()
    const events = Array.isArray(data) ? data : (data.events || [])
    const now = new Date()
    let changed = false
    events.forEach(ev => {
      if (!ev.reminder || !ev.time || !ev.date) return
      const evDate = new Date(`${ev.date}T${ev.time}`)
      const diff = (evDate - now) / 60000
      if (diff > 0 && diff <= parseInt(ev.reminder) && !ev._notified) {
        new Notification({
          title: '🔔 Mon Agenda',
          body: `Rappel : ${ev.title} à ${ev.time}`
        }).show()
        ev._notified = true
        changed = true
      }
    })
    if (changed) {
      const newData = Array.isArray(data) ? events : { ...data, events }
      saveData(newData)
    }
  }, 60000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('load-events', () => loadData())
ipcMain.handle('save-events', (_, data) => { saveData(data); return true })