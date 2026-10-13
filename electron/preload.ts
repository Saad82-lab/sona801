import { contextBridge, ipcRenderer, clipboard } from 'electron';

contextBridge.exposeInMainWorld('desktopAPI', {
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName: string, data: ArrayBuffer) =>
    ipcRenderer.invoke('dialog:saveFile', defaultName, data),
  writeClipboard: (text: string) => Promise.resolve(clipboard.writeText(text)),
  readClipboard: () => Promise.resolve(clipboard.readText()),
});
