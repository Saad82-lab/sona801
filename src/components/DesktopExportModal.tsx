import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Cpu, Laptop, ShieldCheck } from 'lucide-react';

interface DesktopExportModalProps {
  isOpen: boolean;
  darkMode: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({
  isOpen,
  darkMode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'electron' | 'tauri' | 'commands'>('electron');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const electronMainCode = `// electron/main.ts - Native Windows 11 Desktop Entry Point
import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    frame: true, // or false for custom Mica frameless titlebar
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f3f3f3',
      symbolColor: '#1f1f1f',
      height: 38
    },
    backgroundMaterial: 'mica', // Windows 11 native Mica effect!
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../build/icon.ico')
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Native File System I/O Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Excel or CSV Spreadsheet',
    properties: ['openFile'],
    filters: [
      { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true };
  const buffer = fs.readFileSync(res.filePaths[0]);
  return { canceled: false, filePath: res.filePaths[0], data: buffer.buffer };
});

ipcMain.handle('dialog:saveFile', async (_, defaultName: string, data: ArrayBuffer) => {
  if (!mainWindow) return { success: false };
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Spreadsheet As',
    defaultPath: defaultName,
    filters: [
      { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
      { name: 'CSV File (*.csv)', extensions: ['csv'] }
    ]
  });
  if (res.canceled || !res.filePath) return { success: false };
  fs.writeFileSync(res.filePath, Buffer.from(data));
  return { success: true, filePath: res.filePath };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });`;

  const electronBuilderConfig = `# electron-builder.yml - Windows 11 NSIS Installer Configuration
appId: com.biocalc.app
productName: BioCalc 11
copyright: Copyright © 2026 BioCalc Studio

directories:
  output: release
  buildResources: build

files:
  - dist/**/*
  - dist-electron/**/*
  - package.json

win:
  target:
    - target: nsis
      arch:
        - x64
        - arm64
  icon: build/icon.ico
  requestedExecutionLevel: asInvoker
  fileAssociations:
    - ext: xlsx
      name: Excel Workbook
      description: Open with BioCalc 11
    - ext: csv
      name: CSV Document
      description: Open with BioCalc 11

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: BioCalc 11`;

  const terminalCommands = `# 1. Install desktop packaging dependencies
npm install --save-dev electron electron-builder vite-plugin-electron

# 2. Run in Windows 11 Desktop Development Mode
npm run dev

# 3. Build Production Windows 11 (.exe) Installer
npm run build && npx electron-builder --win --x64

# Output Installer will be in /release/BioCalc 11 Setup.exe`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl h-[620px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-pop ${
        darkMode ? 'bg-[#252525] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#107c41]/15 text-[#107c41] rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Windows 11 Native Desktop Architecture & Packager</h3>
              <p className="text-[11px] text-neutral-400">
                Production Electron / Tauri Build Setup with Mica, Native Dialogs & File Associations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center px-5 border-b border-neutral-200 dark:border-neutral-700 gap-2 bg-neutral-50 dark:bg-neutral-900/40 text-xs">
          <button
            onClick={() => setActiveTab('electron')}
            className={`py-2 px-3 font-medium border-b-2 transition ${
              activeTab === 'electron'
                ? 'border-[#107c41] text-[#107c41] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Electron Main Process (main.ts)
          </button>
          <button
            onClick={() => setActiveTab('tauri')}
            className={`py-2 px-3 font-medium border-b-2 transition ${
              activeTab === 'tauri'
                ? 'border-[#107c41] text-[#107c41] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Installer Config (electron-builder.yml)
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-2 px-3 font-medium border-b-2 transition ${
              activeTab === 'commands'
                ? 'border-[#107c41] text-[#107c41] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Build Commands & Terminal
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 'electron' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-mono">electron/main.ts</span>
                <button
                  onClick={() => copyText('main', electronMainCode)}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-xs flex items-center gap-1 transition"
                >
                  {copiedKey === 'main' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'main' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                {electronMainCode}
              </pre>
            </div>
          )}

          {activeTab === 'tauri' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-mono">electron-builder.yml</span>
                <button
                  onClick={() => copyText('builder', electronBuilderConfig)}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-xs flex items-center gap-1 transition"
                >
                  {copiedKey === 'builder' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'builder' ? 'Copied' : 'Copy Config'}</span>
                </button>
              </div>
              <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                {electronBuilderConfig}
              </pre>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Terminal Commands</span>
                <button
                  onClick={() => copyText('cmd', terminalCommands)}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-xs flex items-center gap-1 transition"
                >
                  {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cmd' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-xl text-[12px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                {terminalCommands}
              </pre>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex flex-col gap-2 mt-2">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dual Runtime Compatibility:
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 leading-normal">
                  BioCalc 11 automatically senses its environment: when bundled with Electron, it calls native Windows file system dialogs (`dialog.showOpenDialog`) and binds directly to `.xlsx` files; in browser or PWA mode, it seamlessly switches to the modern HTML5 File System Access API with zero code changes required.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#107c41] text-white hover:bg-[#0c6334] rounded-lg text-xs font-semibold shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
