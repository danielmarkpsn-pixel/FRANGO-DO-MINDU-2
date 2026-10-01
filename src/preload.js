const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pdv', {
  version: '1.2.0'
});