const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: 'Frango do Mindu PDV',
    icon: path.join(__dirname, '..', 'assets', 'logo.ico')
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

/* =========================================================
   LISTAR IMPRESSORAS INSTALADAS NO WINDOWS
   ========================================================= */
ipcMain.handle('listar-impressoras', async () => {
  return new Promise((resolve) => {
    const cmd = 'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"';
    exec(cmd, { windowsHide: true }, (err, stdout) => {
      if (err) {
        exec('wmic printer get name', { windowsHide: true }, (err2, stdout2) => {
          if (err2) return resolve([]);
          const linhas = stdout2
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && l.toLowerCase() !== 'name');
          resolve(linhas);
        });
        return;
      }
      const linhas = stdout
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l);
      resolve(linhas);
    });
  });
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});