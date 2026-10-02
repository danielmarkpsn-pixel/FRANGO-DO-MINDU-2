const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pdv', {
  version: '1.3.0',
  listarImpressoras: () => ipcRenderer.invoke('listar-impressoras')
});