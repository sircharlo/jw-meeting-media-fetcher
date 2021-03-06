const {
    app,
    BrowserWindow,
    ipcMain
  } = require("electron"), {
    autoUpdater
  } = require("electron-updater"),
  os = require("os");
require("@electron/remote/main").initialize();
var win = null;

function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    },
    width: 700,
    height: 700,
    resizable: false,
    title: "JW Meeting Media Fetcher"
  });
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  ipcMain.on("autoUpdate", () => {
    win.webContents.send("hideThenShow", ["InternetCheck", "UpdateCheck"]);
    autoUpdater.checkForUpdates();
  });

  ipcMain.on("noInternet", () => {
    win.webContents.send("hideThenShow", ["InternetCheck", "InternetFail"]);
    setInterval(() => {
      win.webContents.send("checkInternet");
    }, 10000);
  });

  autoUpdater.on("error", () => {
    win.webContents.send("goAhead");
  });


  autoUpdater.on("update-not-available", () => {
    win.webContents.send("goAhead");
  });

  autoUpdater.on("update-available", () => {
    if (os.platform() == "darwin") {
      win.webContents.send("goAhead");
      win.webContents.send("macUpdate");
    } else {
      win.webContents.send("hideThenShow", ["UpdateCheck", "UpdateAvailable"]);
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on("update-downloaded", () => {
    win.webContents.send("hideThenShow", ["UpdateAvailable", "UpdateDownloaded"]);
    setImmediate(() => {
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;

  app.whenReady().then(createUpdateWindow);

  app.on("window-all-closed", () => {
    app.quit();
  });
}
