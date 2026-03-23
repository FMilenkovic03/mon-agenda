const { app, BrowserWindow, Notification, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const dataPath = path.join(app.getPath('userData'), 'events.json')
let mainWindow = null
let currentTheme = 'mocha'

function loadData() {
  try {
    if (fs.existsSync(dataPath)) return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  } catch (e) {}
  return []
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 750, minWidth: 900, minHeight: 600,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
    title: 'Mon Agenda'
  })
  mainWindow.loadFile('index.html')
}

const THEMES = [
  { id: 'mocha',                  label: 'Mocha',          group: 'Catppuccin' },
  { id: 'macchiato',              label: 'Macchiato',      group: 'Catppuccin' },
  { id: 'frappe',                 label: 'Frappé',         group: 'Catppuccin' },
  { id: 'latte',                  label: 'Latte',          group: 'Catppuccin' },
  { id: 'everforest-dark',        label: 'Dark',           group: 'Everforest' },
  { id: 'everforest-light',       label: 'Light',          group: 'Everforest' },
  { id: 'gruvbox-dark',           label: 'Dark',           group: 'Gruvbox' },
  { id: 'gruvbox-light',          label: 'Light',          group: 'Gruvbox' },
  { id: 'gruvbox-material-dark',  label: 'Dark',           group: 'Gruvbox Material' },
  { id: 'gruvbox-material-light', label: 'Light',          group: 'Gruvbox Material' },
  { id: 'nord',                   label: 'Nord',           group: 'Nord' },
  { id: 'kanagawa-wave',          label: 'Wave',           group: 'Kanagawa' },
  { id: 'kanagawa-dragon',        label: 'Dragon',         group: 'Kanagawa' },
  { id: 'kanagawa-lotus',         label: 'Lotus',          group: 'Kanagawa' },
  { id: 'dracula',                label: 'Dracula',        group: 'Dracula' },
  { id: 'tokyo-night',            label: 'Night',          group: 'Tokyo Night' },
  { id: 'tokyo-storm',            label: 'Storm',          group: 'Tokyo Night' },
  { id: 'tokyo-day',              label: 'Day',            group: 'Tokyo Night' },
]

function buildMenu() {
  const themeItems = []
  const groups = [...new Set(THEMES.map(t => t.group))]
  groups.forEach((group, i) => {
    if (i > 0) themeItems.push({ type: 'separator' })
    themeItems.push({ label: '— ' + group + ' —', enabled: false })
    THEMES.filter(t => t.group === group).forEach(t => {
      themeItems.push({
        label: t.label, type: 'radio', checked: currentTheme === t.id,
        click: () => { currentTheme = t.id; mainWindow.webContents.send('set-theme', t.id); buildMenu() }
      })
    })
  })

  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Exporter JSON…', accelerator: 'CmdOrCtrl+E',
          click: async () => {
            const data = loadData()
            const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
              title: 'Exporter les données',
              defaultPath: 'mon-agenda-' + new Date().toISOString().slice(0,10) + '.json',
              filters: [{ name: 'JSON', extensions: ['json'] }]
            })
            if (canceled || !filePath) return
            try {
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
              mainWindow.webContents.send('toast', { title: 'Export JSON réussi !', emoji: '⬇', type: 'task' })
            } catch (e) {
              mainWindow.webContents.send('toast', { title: 'Erreur : ' + e.message, emoji: '❌', type: 'reminder' })
            }
          }
        },
        {
          label: 'Importer JSON…', accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
              title: 'Importer des données',
              filters: [{ name: 'JSON', extensions: ['json'] }],
              properties: ['openFile']
            })
            if (canceled || !filePaths.length) return
            try {
              const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'))
              saveData(data)
              mainWindow.webContents.send('import-data', data)
            } catch (e) {
              mainWindow.webContents.send('toast', { title: 'Fichier invalide : ' + e.message, emoji: '❌', type: 'reminder' })
            }
          }
        },
        {
          label: 'Exporter iCal…', accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow.webContents.send('request-ical-export')
        },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Vue Mois',    click: () => mainWindow.webContents.send('set-view', 'month') },
        { label: 'Vue Semaine', click: () => mainWindow.webContents.send('set-view', 'week') },
        { label: 'Vue Jour',    click: () => mainWindow.webContents.send('set-view', 'day') },
        { label: 'Vue Agenda',  click: () => mainWindow.webContents.send('set-view', 'agenda') },
        { type: 'separator' },
        { label: "Aujourd'hui", click: () => mainWindow.webContents.send('go-today') },
        { type: 'separator' },
        { label: 'Recharger',   accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'DevTools',    accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'Thème',
      submenu: themeItems
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  createWindow()
  buildMenu()

  setInterval(() => {
    const data = loadData()
    const events = Array.isArray(data) ? data : (data.events || [])
    const now = new Date()
    let changed = false
    events.forEach(ev => {
      if (!ev.reminder || !ev.time || !ev.date) return
      const evDate = new Date(ev.date + 'T' + ev.time)
      const diff = (evDate - now) / 60000
      if (diff > 0 && diff <= parseInt(ev.reminder) && !ev._notified) {
        new Notification({ title: 'Mon Agenda', body: 'Rappel : ' + ev.title + ' a ' + ev.time }).show()
        ev._notified = true
        changed = true
      }
    })
    if (changed) saveData(Array.isArray(data) ? events : Object.assign({}, data, { events }))
  }, 60000)
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('load-events', () => loadData())
ipcMain.handle('save-events', (_, data) => {
  // Sync currentTheme from renderer data
  if (data && data.theme) currentTheme = data.theme
  saveData(data)
  return true
})
ipcMain.handle('export-ical', async (_, icalStr) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter en iCal',
    defaultPath: 'mon-agenda-' + new Date().toISOString().slice(0,10) + '.ics',
    filters: [{ name: 'iCal', extensions: ['ics'] }]
  })
  if (canceled || !filePath) return { success: false }
  try { fs.writeFileSync(filePath, icalStr); return { success: true } }
  catch (e) { return { success: false, error: e.message } }
})