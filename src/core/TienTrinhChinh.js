const { app, BrowserWindow, ipcMain, Tray, Menu, nativeTheme } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const execPromise = util.promisify(exec);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');

const KhoaDonLe = app.requestSingleInstanceLock();
if (!KhoaDonLe) {
  app.quit();
}

let CuaSoChinh = null;
let BieuTuongKhay = null;
let ThuNhoKhiDong = true;

function TaoCuaSoChinh() {
  CuaSoChinh = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 1100,
    minHeight: 750,
    frame: false,
    transparent: true,
    icon: path.join(__dirname, '../ui/TaiNguyen', 'BieuTuong', 'logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'CauNoiTruoc.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  CuaSoChinh.loadFile(path.join(__dirname, '../ui/index.html'));

  CuaSoChinh.once('ready-to-show', () => {
    CuaSoChinh.show();
    CuaSoChinh.center();
  });

  CuaSoChinh.on('close', (SuKien) => {
    if (ThuNhoKhiDong) {
      SuKien.preventDefault();
      CuaSoChinh.hide();
    }
  });
}

function TaoBieuTuongKhay() {
  const DuongDanIcon = path.join(__dirname, '../ui/TaiNguyen', 'BieuTuong', 'logo.ico');
  BieuTuongKhay = new Tray(DuongDanIcon);

  const MenuKhay = Menu.buildFromTemplate([
    {
      label: 'Hiện Nex Launcher',
      click: () => {
        if (CuaSoChinh) {
          CuaSoChinh.show();
          CuaSoChinh.focus();
        }
      }
    },
    { type: 'separator' },
    { label: 'Installer', click: () => { CuaSoChinh?.show(); CuaSoChinh?.webContents.send('chuyen-trang', 'installer'); } },
    { label: 'Uninstaller', click: () => { CuaSoChinh?.show(); CuaSoChinh?.webContents.send('chuyen-trang', 'uninstaller'); } },
    { type: 'separator' },
    { label: 'Thoát', click: () => { ThuNhoKhiDong = false; app.quit(); } }
  ]);

  BieuTuongKhay.setToolTip('Nex Launcher v1.6');
  BieuTuongKhay.setContextMenu(MenuKhay);

  BieuTuongKhay.on('double-click', () => {
    if (CuaSoChinh) {
      CuaSoChinh.show();
      CuaSoChinh.focus();
    }
  });
}

ipcMain.on('dieu-khien-cua-so', (SuKien, HanhDong) => {
  if (!CuaSoChinh) return;
  switch (HanhDong) {
    case 'thu-nho':
      CuaSoChinh.minimize();
      break;
    case 'phong-to':
      if (CuaSoChinh.isMaximized()) {
        CuaSoChinh.unmaximize();
      } else {
        CuaSoChinh.maximize();
      }
      break;
    case 'dong':
      CuaSoChinh.close();
      break;
  }
});

ipcMain.handle('lay-trang-thai-cua-so', () => {
  if (!CuaSoChinh) return {};
  return {
    DaPhongTo: CuaSoChinh.isMaximized(),
    DaThuNho: CuaSoChinh.isMinimized(),
  };
});

ipcMain.handle('lay-chu-de-he-thong', () => {
  return nativeTheme.shouldUseDarkColors ? 'Dark' : 'Light';
});

function GuiSuKienCuaSo() {
  if (!CuaSoChinh) return;
  CuaSoChinh.on('maximize', () => {
    CuaSoChinh.webContents.send('trang-thai-cua-so', { DaPhongTo: true });
  });
  CuaSoChinh.on('unmaximize', () => {
    CuaSoChinh.webContents.send('trang-thai-cua-so', { DaPhongTo: false });
  });
}

app.whenReady().then(() => {
  TaoCuaSoChinh();
  TaoBieuTuongKhay();
  GuiSuKienCuaSo();
});

app.on('second-instance', () => {
  if (CuaSoChinh) {
    if (CuaSoChinh.isMinimized()) CuaSoChinh.restore();
    CuaSoChinh.show();
    CuaSoChinh.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('lay-thong-tin-them', async (event, appName) => {
  return new Promise((resolve) => {
    const ps = `
      $paths = @("HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*")
      $item = Get-ItemProperty $paths -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq '${appName.replace(/'/g, "''")}' -and $_.InstallLocation } | Select-Object -First 1
      if ($item -and $item.InstallLocation) {
        $loc = $item.InstallLocation
        if (Test-Path $loc) {
          $date = (Get-Item $loc).CreationTime.ToString("yyyyMMdd")
          $size = "{0:N2} MB" -f ((Get-ChildItem -Path $loc -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB)
          Write-Output "$date|$size"
        }
      }
    `;
    exec(`powershell -NoProfile -Command "${ps}"`, (err, stdout) => {
      let result = stdout ? stdout.trim() : '';
      if (!result) return resolve(null);
      let parts = result.split('|');
      resolve({ date: parts[0], size: parts[1] });
    });
  });
});

ipcMain.handle('lay-danh-sach-ung-dung', async () => {
  try {
    let p = path.join(__dirname, '../../Basic.json');
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data;
  } catch(e) {
    return [];
  }
});

let appIconCache = new Map();

ipcMain.handle('lay-phan-mem-da-cai', async () => {
  return new Promise((resolve) => {
    const ps = `
$paths = @(
    "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)
$apps = Get-ItemProperty $paths -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.DisplayName -and 
        $_.SystemComponent -ne 1 -and 
        -not $_.ParentKeyName 
    } |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, EstimatedSize, DisplayIcon, InstallLocation |
    Sort-Object DisplayName -Unique
ConvertTo-Json $apps -Compress
`;
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      try {
        let apps = JSON.parse(stdout);
        if (!Array.isArray(apps)) apps = [apps];
        appIconCache.clear();
        let result = apps.map(app => {
          let name = app.DisplayName || 'Unknown';
          if (app.DisplayIcon) {
            appIconCache.set(name, app.DisplayIcon);
          } else if (app.InstallLocation) {
            appIconCache.set(name, app.InstallLocation);
          }
          return {
            name: name,
            version: app.DisplayVersion || '',
            publisher: app.Publisher || '',
            installDate: app.InstallDate || '',
            size: app.EstimatedSize ? (app.EstimatedSize * 1024) : 0
          };
        });
        resolve(result);
      } catch (e) {
        resolve([]);
      }
    });
  });
});

async function timIconTrongThuMuc(root, baseName = '') {
  try {
    if (!fs.existsSync(root)) return null;

    const items = fs.readdirSync(root);

    let icoFiles = items.filter(i => i.toLowerCase().endsWith('.ico') && i.toLowerCase() !== 'app.ico');
    if (icoFiles.length > 0) {
      let b = fs.readFileSync(path.join(root, icoFiles[0]));
      return 'data:image/x-icon;base64,' + b.toString('base64');
    }

    let appFolders = items.filter(i =>
      i.startsWith('app-') &&
      fs.statSync(path.join(root, i)).isDirectory()
    );
    if (appFolders.length > 0) {
      appFolders.sort();
      let newestFolderPath = path.join(root, appFolders[appFolders.length - 1]);
      let exeFiles = fs.readdirSync(newestFolderPath).filter(f => f.toLowerCase().endsWith('.exe'));
      if (exeFiles.length > 0) {
        let rootName = path.basename(root).toLowerCase();
        let target = (baseName && exeFiles.find(f => f.toLowerCase() === baseName.toLowerCase())) ||
                     exeFiles.find(f => f.toLowerCase().startsWith(rootName)) ||
                     exeFiles.sort((a,b) => fs.statSync(path.join(newestFolderPath, b)).size - fs.statSync(path.join(newestFolderPath, a)).size)[0];
        const img = await app.getFileIcon(path.join(newestFolderPath, target), { size: 'normal' });
        return img.toDataURL();
      }
    }

    let exeFiles = items.filter(i => i.toLowerCase().endsWith('.exe'));
    if (exeFiles.length > 0) {
      let rootName = path.basename(root).toLowerCase();
      let target = (baseName && exeFiles.find(f => f.toLowerCase() === baseName.toLowerCase())) ||
                   exeFiles.find(f => f.toLowerCase().startsWith(rootName)) ||
                   exeFiles.sort((a,b) => fs.statSync(path.join(root, b)).size - fs.statSync(path.join(root, a)).size)[0];
      const img = await app.getFileIcon(path.join(root, target), { size: 'normal' });
      return img.toDataURL();
    }

    let subDirs = items.filter(i => {
      try { return fs.statSync(path.join(root, i)).isDirectory(); } catch(e) { return false; }
    });
    for (let sub of subDirs) {
      let subPath = path.join(root, sub);
      let subItems = fs.readdirSync(subPath);

      let subIco = subItems.find(i => i.toLowerCase().endsWith('.ico') && i.toLowerCase() !== 'app.ico');
      if (subIco) {
        let b = fs.readFileSync(path.join(subPath, subIco));
        return 'data:image/x-icon;base64,' + b.toString('base64');
      }

      let subExe = subItems.filter(i => i.toLowerCase().endsWith('.exe'));
      if (subExe.length > 0) {
        let rootName = path.basename(root).toLowerCase();
        let target = subExe.find(f => f.toLowerCase().startsWith(rootName)) ||
                     subExe.sort((a,b) => fs.statSync(path.join(subPath, b)).size - fs.statSync(path.join(subPath, a)).size)[0];
        const img = await app.getFileIcon(path.join(subPath, target), { size: 'normal' });
        return img.toDataURL();
      }
    }
  } catch(e) {}
  return null;
}

ipcMain.handle('lay-icon-app', async (event, appName) => {
  let iconPath = appIconCache.get(appName);

  if (iconPath) {
    if (iconPath.toLowerCase().includes('.exe')) {
      iconPath = iconPath.substring(0, iconPath.toLowerCase().indexOf('.exe') + 4);
    } else if (iconPath.toLowerCase().includes('.ico')) {
      iconPath = iconPath.substring(0, iconPath.toLowerCase().indexOf('.ico') + 4);
    } else if (iconPath.includes(',')) {
      iconPath = iconPath.split(',')[0];
    }

    if (iconPath.startsWith('"')) iconPath = iconPath.slice(1);
    if (iconPath.endsWith('"')) iconPath = iconPath.slice(0, -1);
    iconPath = iconPath.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
    iconPath = iconPath.trim();

    try {
      if (fs.existsSync(iconPath) && fs.statSync(iconPath).isDirectory()) {
        const img = await timIconTrongThuMuc(iconPath);
        if (img) return img;
      }
    } catch(e) {}

    try {
      if (fs.existsSync(iconPath)) {
        if (iconPath.toLowerCase().endsWith('.ico')) {
          let b = fs.readFileSync(iconPath);
          return 'data:image/x-icon;base64,' + b.toString('base64');
        } else if (iconPath.toLowerCase().endsWith('.png')) {
          let b = fs.readFileSync(iconPath);
          return 'data:image/png;base64,' + b.toString('base64');
        } else {
          const img = await app.getFileIcon(iconPath, { size: 'normal' });
          return img.toDataURL();
        }
      }
    } catch(e) {}

    try {
      let dir = path.dirname(iconPath);
      let baseName = path.basename(iconPath);
      let candidateRoots = [dir, path.dirname(dir)];

      for (let root of candidateRoots) {
        const img = await timIconTrongThuMuc(root, baseName);
        if (img) return img;
      }
    } catch(e) {}
  }

  try {
    let kw = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let searchKeywords = [...new Set([
      kw,
      appName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, ''),
    ])].filter(k => k.length >= 2);
    
    if (kw.includes('java')) searchKeywords.push('java', 'javaw');
    if (kw.includes('node')) searchKeywords.push('node');
    if (kw.includes('python')) searchKeywords.push('python');
    
    for (let k of searchKeywords) {
      if (k.length < 3) continue;
      try {
        let { stdout } = await execPromise(`where.exe ${k}`, { encoding: 'utf8', timeout: 2000, windowsHide: true });
        let lines = stdout.split('\\n').map(l => l.trim()).filter(l => l.toLowerCase().endsWith('.exe'));
        if (lines.length > 0 && fs.existsSync(lines[0])) {
          const img = await app.getFileIcon(lines[0], { size: 'normal' });
          return img.toDataURL();
        }
      } catch(e) {}
    }
  } catch(e) {}

  try {
    const searchName = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const commonDirs = [
      process.env['ProgramFiles'],
      process.env['ProgramFiles(x86)'],
      process.env['LOCALAPPDATA'],
      process.env['APPDATA'],
    ].filter(Boolean);

    for (let baseDir of commonDirs) {
      if (!fs.existsSync(baseDir)) continue;
      let subDirs = fs.readdirSync(baseDir).filter(i => {
        try {
          let normalized = i.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalized.includes(searchName.slice(0, 5)) &&
                 fs.statSync(path.join(baseDir, i)).isDirectory();
        } catch(e) { return false; }
      });
      for (let sub of subDirs) {
        let img = await timIconTrongThuMuc(path.join(baseDir, sub));
        if (img) return img;
      }
    }
  } catch(e) {}

  return null;
});

ipcMain.handle('xoa-ung-dung-installer', async (event, danhSachTen) => {
  try {
    let p = path.join(__dirname, '../../Basic.json');
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    let newData = data.filter(item => !danhSachTen.includes(item.name));
    fs.writeFileSync(p, JSON.stringify(newData, null, 4));
    return true;
  } catch(e) {
    return false;
  }
});

ipcMain.handle('them-ung-dung-installer', async (event, appInfo) => {
  try {
    let p = path.join(__dirname, '../../Basic.json');
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data.push(appInfo);
    fs.writeFileSync(p, JSON.stringify(data, null, 4));
    return true;
  } catch(e) {
    return false;
  }
});

ipcMain.handle('tim-kiem-winget', async (event, query) => {
  return new Promise((resolve) => {
    exec(`winget search "${query.replace(/"/g, '""')}" --accept-source-agreements`, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      let lines = stdout.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      let results = [];
      let startParsing = false;
      for (let line of lines) {
        if (line.startsWith('---')) {
          startParsing = true;
          continue;
        }
        if (startParsing) {
          let parts = line.split(/\\s{2,}/);
          if (parts.length >= 2) {
            results.push({ name: parts[0], id: parts[1] });
          }
        }
      }
      resolve(results.slice(0, 10));
    });
  });
});

const { DangKyIPCLogic } = require('./Logic.js');
DangKyIPCLogic();
