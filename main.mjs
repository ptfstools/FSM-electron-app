import { app, BrowserWindow, BrowserView, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import RPC from 'discord-rpc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let rpc;

const CLIENT_ID = '1440987325340454952';

function setupDiscordRPC() {
  rpc = new RPC.Client({ transport: 'ipc' });
  rpc.on('ready', () => setActivity());
  rpc.login({ clientId: CLIENT_ID }).catch(console.error);
}

function setActivity(details = 'Controlling with the Flight Strip Manager', state = 'Online') {
  if (!rpc) return;
  rpc.setActivity({
    details: 'Controlling with the Flight Strip Manager',    
    state: 'Online',                   
    startTimestamp: new Date(),        
    largeImageKey: 'icon_large',       
    largeImageText: 'Flight Strip Manager Desktop',  
    smallImageKey: 'icon_small',       
    smallImageText: 'Electron',    
    instance: false
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'favicon.ico'),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:24scope'
    }
  });

  const topBar = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setBrowserView(topBar);
  topBar.setBounds({ x: 0, y: 0, width: 1200, height: 32 });
  topBar.setAutoResize({ width: true });
  await topBar.webContents.loadFile(path.join(__dirname, 'topbar.html'));

  const contentView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.addBrowserView(contentView);
  contentView.setBounds({ x: 0, y: 32, width: 1200, height: 768 });
  contentView.setAutoResize({ width: true, height: true });
  await contentView.webContents.loadURL('https://fsm.awdevsoftware.org/');

  contentView.webContents.on('did-navigate', (_, url) => setActivity(`Viewing ${url}`, 'Online'));

  mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(() => {
  createWindow();
  setupDiscordRPC();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window-control', (event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
      break;
    case 'close':
      mainWindow.close();
      break;
    default:
      console.error(`Unknown action: ${action}`);
  }
});

ipcMain.handle('open-external', async (e, url) => await shell.openExternal(url));

ipcMain.handle('clear-cookies', async () => {
  if (!mainWindow) return;
  try {
    await mainWindow.webContents.session.clearStorageData({ storages: ['cookies'] });
  } catch (e) {
    console.error(e);
  }
});
