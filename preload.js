const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  },
  invoke: (channel, ...args) => {
    ipcRenderer.invoke(channel, ...args);
  }
});