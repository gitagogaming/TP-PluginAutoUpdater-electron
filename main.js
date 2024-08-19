const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { URL } = require('url');

class DownloadManager {
  constructor() {
    this.win = null;
  }

  createWindow() {
    this.win = new BrowserWindow({
      width: 800,
      height: 200,
      frame: false, 
      titleBarStyle: 'hidden', 
      backgroundColor: '#333',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false
      }
    });

    this.win.loadFile('index.html');

    // Start the download when the window loads
    this.win.webContents.on('did-finish-load', () => {
      const url = 'https://github.com/gitagogaming/Youtube-TouchPortal-Plugin/releases/download/v1.1.3/TP_YouTube_Plugin_v113_Windows.tpp'; // Replace with the actual URL
      this.startDownload(url);
    });

    this.win.on('closed', () => {
      this.win = null;
    });
  }

  async startDownload(url) {
    const fileName = path.basename(new URL(url).pathname);
    this.win.webContents.send('update-header-text', { text: `Downloading ${fileName}` });

    try {
      await this.downloadFile(url, fileName, (progress, total, downloaded) => {
        if (this.win && !this.win.isDestroyed()) {
          this.win.webContents.send('progress', { progress, total, downloaded });
        }
      });
      if (this.win && !this.win.isDestroyed()) {
        this.win.webContents.send('download-complete', { text: `Download completed: ${fileName}`, fileName: fileName });
      }
    } catch (error) {
      console.error('Download failed:', error);
      if (this.win && !this.win.isDestroyed()) {
        this.win.webContents.send('update-header-text', { text: `Download failed: ${error.message}` });
      }
    }
  }

  downloadFile(url, filePath, onProgress) {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return this.downloadFile(redirectUrl, filePath, onProgress)
              .then(resolve)
              .catch(reject);
          } else {
            reject('Redirect without location');
          }
        } else if (response.statusCode === 200) {
          const file = fs.createWriteStream(filePath);
          const totalLength = parseInt(response.headers['content-length'], 10);
          let downloadedLength = 0;

          response.on('data', (chunk) => {
            downloadedLength += chunk.length;
            file.write(chunk);
            if (onProgress) {
              onProgress(
                (downloadedLength / totalLength) * 100,
                (totalLength / 1024 / 1024).toFixed(2), // Total size in MB
                (downloadedLength / 1024 / 1024).toFixed(2) // Downloaded size in MB
              );
            }
          });

          response.on('end', () => {
            file.end(() => {
              console.log(`Download Complete! (${filePath})`);
              resolve(`Download Complete! \n(${filePath})`);
            });
          });

          response.on('error', (err) => {
            file.end();
            reject(`Error: ${err.message}`);
          });

          file.on('error', (err) => {
            reject(`File stream error: ${err.message}`);
          });
        } else {
          reject(`Failed to get '${url}' (${response.statusCode})`);
        }
      }).on('error', (err) => {
        reject(`Request error: ${err.message}`);
      });
    });
  }
}

const downloadManager = new DownloadManager();

app.whenReady().then(() => {
  downloadManager.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      downloadManager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('close-window', (event) => {
  BrowserWindow.getFocusedWindow().close();
});

ipcMain.handle('open-file', (event, filePath) => {
    console.log('Opening file:', filePath);
    shell.openPath(filePath).catch(err => {
      console.error('Failed to open file:', err);
    });

    app.quit();
  });