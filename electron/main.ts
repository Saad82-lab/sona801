import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'BioCalc 11 - Windows 11 Desktop Spreadsheet Suite',
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f3f3f3',
      symbolColor: '#1f1f1f',
      height: 38
    },
    backgroundMaterial: 'mica',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Native File System I/O Handlers for Windows 11
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Excel or CSV Spreadsheet',
    properties: ['openFile'],
    filters: [
      { name: 'Spreadsheet Files (*.xlsx, *.xls, *.csv)', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
      { name: 'CSV Document (*.csv)', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (res.canceled || !res.filePaths.length) return { canceled: true };
  const filePath = res.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  return { canceled: false, filePath, data: buffer.buffer };
});

ipcMain.handle('dialog:saveFile', async (_, defaultName: string, data: ArrayBuffer) => {
  if (!mainWindow) return { success: false };
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Spreadsheet As',
    defaultPath: defaultName,
    filters: [
      { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
      { name: 'CSV Document (*.csv)', extensions: ['csv'] }
    ]
  });

  if (res.canceled || !res.filePath) return { success: false };
  fs.writeFileSync(res.filePath, Buffer.from(data));
  return { success: true, filePath: res.filePath };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
