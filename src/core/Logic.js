const { ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
let addon;
try {
    addon = require('../../build/Release/nex_addon.node');
} catch (e) {
    try {
        addon = require('../../../build/Release/nex_addon.node');
    } catch(e2) {
        console.error("Failed to load nex_addon:", e2);
    }
}
function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error('Failed to download: ' + response.statusCode));
            }
            let len = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;
            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (len && onProgress) {
                    let percent = Math.round((downloaded / len) * 100);
                    onProgress(percent);
                }
            });
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}
function runSilentCommand(command, args, onProgress) {
    return new Promise((resolve) => {
        const child = spawn(command, args, { windowsHide: true, shell: true });
        child.stdout.on('data', (data) => {
            let str = data.toString();
            let match = str.match(/(\d+)%/);
            if (match && onProgress) {
                onProgress(parseInt(match[1]));
            }
        });
        child.on('close', (code) => {
            if (code === 0 || code === 0x8A150101 || code === -1978334975 || code === 3010) {
                resolve({ success: true, code: code });
            } else {
                resolve({ success: false, code: code });
            }
        });
        child.on('error', () => {
            resolve({ success: false, code: -1 });
        });
    });
}
async function waitForMSI() {
    return new Promise(resolve => {
        const check = () => {
            exec(`powershell -NoProfile -Command "try { $m = [System.Threading.Mutex]::OpenExisting('Global\\_MSIExecute'); $m.Dispose(); exit 1 } catch { exit 0 }"`, (err) => {
                if (err && err.code === 1) {
                    setTimeout(check, 3000);
                } else {
                    resolve();
                }
            });
        };
        check();
    });
}
function KiemTraThuMucNhayCam(targetPath) {
    const p = targetPath.toLowerCase();
    const rootDir = path.parse(p).root.toLowerCase();
    if (p === rootDir || p === `${rootDir}windows` || p === `${rootDir}windows\\system32` || p.includes('system32')) {
        return 3; 
    }
    if (p.includes('program files') || p === `${rootDir}users`) {
        return 2;
    }
    return 1;
}
function LayPhysicalDrive(driveLetter) {
    if (driveLetter.startsWith('\\\\.\\PhysicalDrive')) return driveLetter;
    if (driveLetter.length === 2 && driveLetter[1] === ':') return `\\\\.\\${driveLetter}`;
    return null;
}
async function PhaHuyDuLieu(targetPath, options = {}) {
    if (!addon) throw new Error("Native addon chưa được cài đặt hoặc tải lỗi.");
    if (options.isDrive) {
        const drive = LayPhysicalDrive(targetPath);
        if (!drive) throw new Error("Đường dẫn ổ đĩa không hợp lệ.");
        const passes = options.passes || 3;
        return addon.wipeRegion(drive, 0, options.length || 1024 * 1024 * 1024, passes);
    }
    const MAX_BUF_SIZE = 4 * 1024 * 1024;
    const buf = Buffer.alloc(MAX_BUF_SIZE);
    const wipeFile = (filePath) => {
        const stat = fs.statSync(filePath);
        const size = stat.size;
        if (size === 0) { fs.unlinkSync(filePath); return true; }
        const passes = options.passes || 3;
        const BUF_SIZE = Math.min(size, MAX_BUF_SIZE);
        const fd = fs.openSync(filePath, 'r+');
        for (let pass = 0; pass < passes; pass++) {
            let remaining = size;
            let pos = 0;
            while (remaining > 0) {
                const chunk = Math.min(BUF_SIZE, remaining);
                if (pass % 2 === 0) {
                    require('crypto').randomFillSync(buf, 0, chunk);
                } else {
                    buf.fill(0x00, 0, chunk);
                }
                fs.writeSync(fd, buf, 0, chunk, pos);
                pos += chunk;
                remaining -= chunk;
            }
            fs.fsyncSync(fd);
        }
        fs.closeSync(fd);
        fs.unlinkSync(filePath);
        return true;
    };
    const wipeStat = fs.statSync(targetPath);
    if (wipeStat.isFile()) {
        return wipeFile(targetPath);
    } else if (wipeStat.isDirectory()) {
        const dirsToRM = [];
        const queue = [targetPath];
        while (queue.length > 0) {
            const currentDir = queue.shift();
            dirsToRM.push(currentDir);
            let entries;
            try { entries = fs.readdirSync(currentDir, { withFileTypes: true }); } catch(e) { continue; }
            for (const entry of entries) {
                const full = path.join(currentDir, entry.name);
                if (entry.isDirectory()) queue.push(full);
                else {
                    try { wipeFile(full); }
                    catch(e) { console.warn('Skip locked file:', full, e.message); }
                }
            }
        }
        while (dirsToRM.length > 0) {
            try { fs.rmdirSync(dirsToRM.pop()); } catch(e) {}
        }
        return true;
    }
    throw new Error("Đường dẫn không hợp lệ.");
}
let dangHuyTienTrinh = false;
function DangKyIPCLogic() {
    ipcMain.on('huy-tien-trinh', () => {
        dangHuyTienTrinh = true;
    });
    ipcMain.handle('tien-hanh-cai-dat', async (event, apps, options = {}) => {
        dangHuyTienTrinh = false;
        let results = [];
        for (let app of apps) {
            if (dangHuyTienTrinh) {
                results.push({ name: app.name || app, success: false, error: 'Cancelled by user' });
                continue;
            }
            let success = false;
            let errorMsg = "";
            let type = app.source ? app.source.type : 'Winget';
            if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading', percent: 0 });
            if (type === 'Link') {
                try {
                    let exeName = app.source.value.split('/').pop() || 'installer.exe';
                    if (exeName.includes('?')) exeName = exeName.split('?')[0];
                    let uniqueId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);
                    let dest = path.join(os.tmpdir(), uniqueId + '_' + exeName);
                    await downloadFile(app.source.value, dest, (percent) => {
                        if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading', percent });
                    });
                    if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'installing', percent: 100 });
                    await waitForMSI();
                    let args = app.source.silent_args ? app.source.silent_args.split(' ').filter(a => a) : [];
                    let commandStr = `"${dest}" ` + args.join(" ");
                    if (addon && addon.nativeInstallApp) {
                        success = addon.nativeInstallApp(commandStr);
                        if (!success) errorMsg = "Lỗi thực thi (Native Addon Failed)";
                    } else {
                        let res = await runSilentCommand(dest, args);
                        success = res.success;
                        if (!success) errorMsg = "Mã lỗi: " + res.code + (res.code === 1618 ? " (Đang có tiến trình MSI khác chạy)" : "");
                    }
                    await waitForMSI();
                } catch(e) {
                    success = false;
                    errorMsg = e.message;
                }
            } else {
                let id = app.source ? app.source.value : app.name;
                let args = ['install', '--id', `"${id}"`, '--accept-package-agreements', '--accept-source-agreements'];
                if (options.silent !== false) args.push('--silent');
                let commandStr = "winget " + args.join(" ");
                if (addon && addon.nativeInstallApp) {
                    if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading/installing', percent: 50 });
                    success = addon.nativeInstallApp(commandStr);
                    if (!success) errorMsg = "Lỗi Winget qua Native Addon";
                    if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'done', percent: 100 });
                } else {
                    let res = await runSilentCommand('winget', args, (percent) => {
                        if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading', percent });
                    });
                    success = res.success;
                    if (!success) errorMsg = "Winget trả về mã lỗi: " + res.code;
                }
                await waitForMSI();
            }
            results.push({ name: app.name, success, error: errorMsg });
        }
        return results;
    });
    ipcMain.handle('tien-hanh-cap-nhat', async (event, apps, options = {}) => {
        let results = [];
        for (let app of apps) {
            let success = false;
            let errorMsg = "";
            if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading', percent: 0 });
            let id = app.id || app.name;
            let args = ['upgrade', '--id', `"${id}"`, '--accept-package-agreements', '--accept-source-agreements'];
            if (options.silent !== false) args.push('--silent', '--disable-interactivity');
            let commandStr = "winget " + args.join(" ");
            try {
                if (addon && addon.nativeInstallApp) {
                    if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: 'downloading/installing', percent: 50 });
                    success = addon.nativeInstallApp(commandStr);
                    if (!success) errorMsg = "Lỗi cập nhật qua Native Addon";
                } else {
                    let res = await runSilentCommand("winget", args);
                    success = res.success;
                    if (!success) errorMsg = "Winget trả về mã lỗi: " + res.code;
                }
            } catch(e) {
                success = false;
                errorMsg = e.message;
            }
            if (options.showProgress) event.sender.send('tien-trinh-cai-dat', { name: app.name, status: success ? 'done' : 'error', percent: 100 });
            results.push({ name: app.name, success, error: errorMsg });
        }
        return results;
    });
    ipcMain.handle('tien-hanh-go-cai-dat', async (event, apps, options = {}) => {
        dangHuyTienTrinh = false;
        let results = [];
        for (let app of apps) {
            if (dangHuyTienTrinh) {
                results.push({ name: app.name || app, success: false, error: 'Cancelled by user' });
                continue;
            }
            let name = app.name || app;
            if (options.showProgress) event.sender.send('tien-trinh-go-cai-dat', { name: name, status: 'uninstalling', percent: 0 });
            let args = ['uninstall', '--name', `"${name}"`, '--accept-source-agreements'];
            if (options.silent !== false) {
                args.push('--silent');
            } else {
                args.push('--interactive');
            }
            let commandStr = "winget " + args.join(" ");
            let success = false;
            let errorMsg = "";
            if (addon && addon.nativeUninstallApp) {
                success = addon.nativeUninstallApp(commandStr);
                if (!success) errorMsg = "Lỗi gỡ cài đặt qua Native Addon";
            } else {
                let res = await runSilentCommand('winget', args);
                success = res.success;
                if (!success) errorMsg = "Winget trả về mã lỗi: " + res.code;
            }
            await waitForMSI();
            results.push({ name: name, success, error: errorMsg });
        }
        return results;
    });
    ipcMain.handle('chon-duong-dan-khoi-phuc', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });
    ipcMain.handle('tien-hanh-khoi-phuc', async (event, drivePath, outDir) => {
        if (!addon || !addon.nativeRecoverData) {
            throw new Error("Native addon chưa được cài đặt hoặc tải lỗi.");
        }
        return new Promise((resolve) => {
            addon.nativeRecoverData(drivePath, outDir, (percent, isDone) => {
                event.sender.send('tien-trinh-khoi-phuc', percent);
                if (isDone !== undefined) {
                    resolve(isDone);
                }
            });
        });
    });
    ipcMain.handle('don-dep-he-thong', async (event, cheDoc) => {
        const os = require('os');
        const pathMap = {
            nhanh: [
                path.join(os.tmpdir()),
                'C:\\Windows\\Temp',
                path.join(process.env.LOCALAPPDATA || '', 'Temp'),
            ].filter(Boolean),
            thong_minh: [
                path.join(os.tmpdir()),
                'C:\\Windows\\Temp',
                path.join(process.env.LOCALAPPDATA || '', 'Temp'),
                'C:\\Windows\\Prefetch',
                path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Windows\\Explorer'),
                path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Recent'),
            ].filter(Boolean),
            tat_ca: [
                path.join(os.tmpdir()),
                'C:\\Windows\\Temp',
                path.join(process.env.LOCALAPPDATA || '', 'Temp'),
                'C:\\Windows\\Prefetch',
                path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Windows\\Explorer'),
                path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Recent'),
                'C:\\Windows\\SoftwareDistribution\\Download',
                path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Windows\\INetCache'),
            ].filter(Boolean)
        };
        const targets = pathMap[cheDoc] || pathMap['nhanh'];
        let tongXoa = 0, tongLoi = 0;
        const xoaThuMuc = (dir) => {
            try {
                if (!fs.existsSync(dir)) return;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const e of entries) {
                    const full = path.join(dir, e.name);
                    try {
                        if (e.isDirectory()) {
                            fs.rmSync(full, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(full);
                        }
                        tongXoa++;
                    } catch { tongLoi++; }
                }
            } catch { tongLoi++; }
        };
        for (const t of targets) xoaThuMuc(t);
        if (cheDoc === 'tat_ca') {
            await new Promise(r => exec('cleanmgr /sagerun:1', r));
        }
        return { tongXoa, tongLoi };
    });
}
module.exports = { DangKyIPCLogic, KiemTraThuMucNhayCam, PhaHuyDuLieu };
