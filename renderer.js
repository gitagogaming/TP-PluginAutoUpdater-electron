// renderer.js
  
  document.getElementById('close-button').addEventListener('click', () => {
    window.electron.invoke('close-window');
  });
  
  window.electron.on('progress', (event, data) => {
    document.getElementById('progress').style.width = `${data.progress}%`;
    document.getElementById('info').innerText = `Progress: ${data.downloaded} MB / ${data.total} MB `;
  });

  window.electron.on('update-header-text', (event, data) => {
    document.getElementById('headerDiv-Text').innerText = data.text;
  });

  window.electron.on('download-complete', (event, data) => {
    document.getElementById('info').innerText = 'Download complete!';
    window.electron.invoke('open-file', data.fileName);
  });