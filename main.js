// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join('favicon.png') ,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })


  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {

    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

