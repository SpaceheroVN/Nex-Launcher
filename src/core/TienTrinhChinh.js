const { app, BrowserWindow, ipcMain, Tray, Menu, nativeTheme, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const execPromise = util.promisify(exec);
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
    case 'an-cua-so':
      CuaSoChinh.hide();
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
ipcMain.handle('kiem-tra-tai-nguyen', async () => {
  const os = require('os');
  function getCPUTimes() {
    const cpus = os.cpus();
    let idle = 0, total = 0;
    for (let cpu of cpus) {
      for (let type in cpu.times) total += cpu.times[type];
      idle += cpu.times.idle;
    }
    return { idle, total };
  }
  const startTimes = getCPUTimes();
  await new Promise(resolve => setTimeout(resolve, 100));
  const endTimes = getCPUTimes();
  const idleDifference = endTimes.idle - startTimes.idle;
  const totalDifference = endTimes.total - startTimes.total;
  const percentageCPU = totalDifference === 0 ? 0 : 100 - ~~(100 * idleDifference / totalDifference);
  return {
    totalRAM: os.totalmem(),
    freeRAM: os.freemem(),
    cpus: os.cpus().length,
    cpuUsage: percentageCPU
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
  const iconCachePath = path.join(app.getPath('userData'), 'IconCache');
  try {
    if (fs.existsSync(iconCachePath)) {
      fs.rmSync(iconCachePath, { recursive: true, force: true });
    }
    fs.mkdirSync(iconCachePath, { recursive: true });
  } catch(e) { console.error("Lỗi xóa cache:", e); }
  TaoCuaSoChinh();
  TaoBieuTuongKhay();
  GuiSuKienCuaSo();
});
app.on('will-quit', () => {
  try {
    const iconCachePath = path.join(app.getPath('userData'), 'IconCache');
    if (fs.existsSync(iconCachePath)) {
      fs.rmSync(iconCachePath, { recursive: true, force: true });
    }
  } catch(e) {}
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
ipcMain.handle('dat-luon-tren-cung', (event, val) => {
  if (CuaSoChinh) CuaSoChinh.setAlwaysOnTop(!!val);
});
ipcMain.handle('dat-thu-nho-khay', (event, val) => {
  ThuNhoKhiDong = !!val;
});
ipcMain.on('dat-tien-trinh', (event, data) => {
  if (CuaSoChinh) {
    if (data.percent < 0 || data.percent >= 100) {
      CuaSoChinh.setProgressBar(-1);
    } else {
      CuaSoChinh.setProgressBar(data.percent / 100.0);
    }
  }
  if (BieuTuongKhay) {
    if (data.text) {
      BieuTuongKhay.setToolTip(data.text);
    } else {
      BieuTuongKhay.setToolTip('Nex Launcher v1.6');
    }
  }
});
ipcMain.handle('lay-thong-tin-them', async (event, appName, installLoc) => {
  return new Promise((resolve) => {
    if (!installLoc) return resolve(null);
    const ps = `
      $loc = '${installLoc.replace(/'/g, "''")}'
      if (Test-Path $loc) {
        $date = (Get-Item $loc).CreationTime.ToString("yyyyMMdd")
        $size = "{0:N2} MB" -f ((Get-ChildItem -Path $loc -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB)
        Write-Output "$date|$size"
      }
    `;
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, (err, stdout) => {
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
            size: app.EstimatedSize ? (app.EstimatedSize * 1024) : 0,
            installLocation: app.InstallLocation || ''
          };
        });
        resolve(result);
      } catch (e) {
        resolve([]);
      }
    });
  });
});
async function TimIconTrongThuMuc(root, baseName = '') {
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
  if (!appName) return null;
  const iconCachePath = path.join(app.getPath('userData'), 'IconCache');
  const safeName = crypto.createHash('md5').update(appName).digest('hex') + '.txt';
  const cachedFile = path.join(iconCachePath, safeName);
  try {
    if (fs.existsSync(cachedFile)) {
      return fs.readFileSync(cachedFile, 'utf8');
    }
  } catch(e) {}
  const getIcon = async () => {
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
          const img = await TimIconTrongThuMuc(iconPath);
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
          const img = await TimIconTrongThuMuc(root, baseName);
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
          let lines = stdout.split('\n').map(l => l.trim()).filter(l => l.toLowerCase().endsWith('.exe'));
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
          let img = await TimIconTrongThuMuc(path.join(baseDir, sub));
          if (img) return img;
        }
      }
    } catch(e) {}
    return null;
  };
  let res = await getIcon();
  if (res) {
    try {
      if (!fs.existsSync(iconCachePath)) fs.mkdirSync(iconCachePath, { recursive: true });
      fs.writeFileSync(cachedFile, res, 'utf8');
    } catch(e) {}
  }
  return res;
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
ipcMain.handle('sua-ung-dung-installer', async (event, oldName, newAppInfo) => {
  try {
    let p = path.join(__dirname, '../../Basic.json');
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    let idx = data.findIndex(a => a.name === oldName);
    if (idx !== -1) {
      data[idx] = newAppInfo;
      fs.writeFileSync(p, JSON.stringify(data, null, 4));
      return true;
    }
    return false;
  } catch(e) {
    return false;
  }
});
ipcMain.handle('tim-kiem-winget', async (event, query) => {
  return new Promise((resolve) => {
    exec(`winget search "${query.replace(/"/g, '""')}" --accept-source-agreements`, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      let lines = stdout.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let results = [];
      let startParsing = false;
      for (let line of lines) {
        if (line.startsWith('---')) {
          startParsing = true;
          continue;
        }
        if (startParsing) {
          let parts = line.split(/\s{2,}/);
          if (parts.length >= 2) {
            results.push({ name: parts[0], id: parts[1] });
          }
        }
      }
      resolve(results.slice(0, 10));
    });
  });
});
const { DangKyIPCLogic, PhaHuyDuLieu, KiemTraThuMucNhayCam } = require('./Logic.js');
DangKyIPCLogic();
ipcMain.handle('kiem-tra-thu-muc-nhay-cam', (event, targetPath) => {
    return KiemTraThuMucNhayCam(targetPath);
});
ipcMain.handle('pha-huy-du-lieu', async (event, targetPath, options) => {
    try {
        return await PhaHuyDuLieu(targetPath, options);
    } catch (error) {
        return { success: false, error: error.message };
    }
});
ipcMain.handle('chon-duong-dan-pha-huy', async (event, type) => {
    if (!CuaSoChinh) return null;
    let options = { properties: [] };
    if (type === 'file') {
        options.properties = ['openFile'];
        options.title = 'Chọn tệp tin cần tiêu hủy';
    } else if (type === 'folder') {
        options.properties = ['openDirectory'];
        options.title = 'Chọn thư mục cần tiêu hủy';
    } else {
        return null;
    }
    const result = await dialog.showOpenDialog(CuaSoChinh, options);
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});
