const { app, BrowserWindow } = require('electron')

require("./js/ipcMain.js")

exports.createMainWindow = function() {
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
		title: "Mastery Checker"
	})

	mainWindow.loadFile('./html/index.html')

	// Open the DevTools.
	//mainWindow.webContents.openDevTools()
    return mainWindow
}

app.whenReady().then(() => {
	exports.createMainWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})
