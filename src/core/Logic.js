const { ipcMain } = require('electron');
const { exec } = require('child_process');

function runSilentCommand(command) {
    return new Promise((resolve) => {
        exec(command, { windowsHide: true }, (error) => {
            if (error) {
                // 0x8A150101 (-1978334975) is Winget's exit code for some benign cases
                if (error.code === 0 || error.code === 0x8A150101 || error.code === -1978334975) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } else {
                resolve(true);
            }
        });
    });
}

function DangKyIPCLogic() {
    ipcMain.handle('tien-hanh-cai-dat', async (event, apps) => {
        let count = 0;
        for (let app of apps) {
            let id = app.source ? app.source.value : app.name;
            let cmd = `winget install --id "${id}" --silent --accept-package-agreements --accept-source-agreements`;
            let success = await runSilentCommand(cmd);
            if (success) count++;
        }
        return { thanhCong: true, soLuong: count };
    });

    ipcMain.handle('tien-hanh-go-cai-dat', async (event, apps) => {
        let count = 0;
        for (let app of apps) {
            let name = app.name || app;
            let cmd = `winget uninstall --name "${name}" --silent --accept-source-agreements`;
            let success = await runSilentCommand(cmd);
            if (success) count++;
        }
        return { thanhCong: true, soLuong: count };
    });
}

module.exports = { DangKyIPCLogic };
