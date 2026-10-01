const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pdv', {
  version: '1.3.0'
});