import { app, BrowserWindow, ipcMain, clipboard, Tray, Menu, globalShortcut, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getState, setState, getWindowBounds, saveWindowBounds } from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null

function toggleWindow() {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC!, 'tray-iconTemplate.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  tray.setToolTip('SlotPaste')

  const menu = Menu.buildFromTemplate([
    { label: 'Show / Hide', click: toggleWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', toggleWindow)
}

function createWindow() {
  const bounds = getWindowBounds()

  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 400,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    vibrancy: 'under-window',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
    },
  })

  // закрытие через ⌘W скрывает окно, не завершает процесс
  win.on('close', (e) => {
    e.preventDefault()
    win?.hide()
  })

  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  win.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (!win) return
      const [width, height] = win.getSize()
      saveWindowBounds({ width, height })
    }, 500)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.handle('store:get', () => getState())
ipcMain.handle('store:set', (_event, state) => setState(state))
ipcMain.handle('clipboard:write', (_event, text: string) => clipboard.writeText(text))
ipcMain.handle('autolaunch:get', () => app.getLoginItemSettings().openAtLogin)
ipcMain.handle('autolaunch:set', (_event, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (win) {
    win.show()
    win.focus()
  } else {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  globalShortcut.register('CommandOrControl+Shift+V', toggleWindow)
})