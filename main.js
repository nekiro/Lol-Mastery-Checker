const { app, BrowserWindow, ipcMain } = require('electron');

const { settings, parseMastery } = require('./js/ipcMain.js');

exports.createMainWindow = function () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    maxHeight: 1200,
    minWidth: 800,
    maxWidth: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Mastery Checker',
  });

  mainWindow.loadFile('./html/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  return mainWindow;
};

app.whenReady().then(async () => {
  const mainWindow = exports.createMainWindow();

  await settings.load();

  setTimeout(async () => {
    const nickName = settings.get('summoner');
    if (nickName) await parseMastery(nickName);

    const findChamp = settings.get('findChamp');
    if (findChamp) mainWindow.webContents.send('filterChampList', findChamp);
  }, 500);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) exports.createMainWindow();
  });
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    await settings.save();
    app.quit();
  }
});
