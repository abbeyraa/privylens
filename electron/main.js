const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow = null;
let nextServer = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const PORT = process.env.PORT || 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/logo.png"),
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.on("did-fail-load", (event, errorCode) => {
    if (errorCode === -106) {
      console.log("Waiting for server to start...");
      setTimeout(() => {
        mainWindow.reload();
      }, 1000);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startNextServer() {
  if (isDev) {
    nextServer = spawn("npm", ["run", "dev"], {
      cwd: path.join(__dirname, ".."),
      shell: true,
      stdio: "inherit",
    });

    nextServer.on("error", (err) => {
      console.error("Failed to start Next.js server:", err);
    });
    return;
  }

  // Production mode
  let nextPath;
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    nextPath = path.join(appPath, ".next", "standalone");

    if (!require("fs").existsSync(nextPath)) {
      nextPath = path.join(process.resourcesPath, "app", ".next", "standalone");
    }
  } else {
    nextPath = path.join(__dirname, "..", ".next", "standalone");
  }

  const serverPath = path.join(nextPath, "server.js");
  const env = {
    ...process.env,
    PORT: `${PORT}`,
    HOSTNAME: "localhost",
    NODE_ENV: "production",
  };

  if (app.isPackaged) {
    const appPath = app.getAppPath();
    let staticPath = path.join(appPath, ".next", "static");
    if (!require("fs").existsSync(staticPath)) {
      staticPath = path.join(process.resourcesPath, "app", ".next", "static");
    }
    env.NEXT_STATIC_FOLDER = staticPath;
  } else {
    env.NEXT_STATIC_FOLDER = path.join(__dirname, "..", ".next", "static");
  }

  console.log("Starting Next.js server from:", nextPath);
  console.log("Server file:", serverPath);

  nextServer = spawn("node", [serverPath], {
    cwd: nextPath,
    shell: true,
    stdio: "inherit",
    env,
  });

  nextServer.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
    console.error("Server path:", serverPath);
    console.error("Next path:", nextPath);
    console.error("App path:", app.getAppPath());
    console.error("Resources path:", process.resourcesPath);
  });

  nextServer.on("exit", (code) => {
    console.log(`Next.js server exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startNextServer();

  setTimeout(
    () => {
      createWindow();
    },
    isDev ? 3000 : 2000
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (nextServer) {
      nextServer.kill();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
