let TienTrinhSoApp = 0;
let TienTrinhHienTai = 0;
let TienTrinhAppTruoc = '';
function ApDungCauHinh() {
    var cd = localStorage.getItem('nex_chu_de') || 'dark';
    if (cd === 'system' && window.DienTu) {
        window.DienTu.LayChuDeHeThong().then(function (s) {
            document.documentElement.setAttribute('data-chu-de', s.toLowerCase());
        });
    } else {
        document.documentElement.setAttribute('data-chu-de', cd);
    }
    var boTron = localStorage.getItem('caidat-bo-tron') !== 'false';
    document.documentElement.style.setProperty('--do-bo', boTron ? '8px' : '0px');
    document.documentElement.style.setProperty('--do-bo-nho', boTron ? '4px' : '0px');
    document.documentElement.style.setProperty('--do-bo-lon', boTron ? '12px' : '0px');
    var tatAnim = localStorage.getItem('caidat-tat-anim') === 'true';
    document.documentElement.style.setProperty('--chuyen-dong', tatAnim ? '0s' : '0.2s cubic-bezier(0.4,0,0.2,1)');
    document.documentElement.style.setProperty('--chuyen-dong-nhanh', tatAnim ? '0s' : '0.15s cubic-bezier(0.4,0,0.2,1)');
    document.documentElement.style.setProperty('--chuyen-dong-cham', tatAnim ? '0s' : '0.3s cubic-bezier(0.4,0,0.2,1)');
    var coChu = parseInt(localStorage.getItem('caidat-co-chu') || '14', 10);
    document.documentElement.style.fontSize = coChu + 'px';
    var trongSuot = parseInt(localStorage.getItem('caidat-trong-suot') || '0', 10);
    document.documentElement.style.setProperty('--alpha-nen', 1 - (trongSuot / 100));
}
if (window.DienTu) {
    ApDungCauHinh();
    let p1 = window.DienTu.KhiKhoiTaoTienTrinh((DuLieu) => {
        try {
            if (DuLieu.chuDe) {
                if (DuLieu.chuDe === 'system') {
                    window.DienTu.LayChuDeHeThong().then(function (s) {
                        document.documentElement.setAttribute('data-chu-de', s.toLowerCase());
                    });
                } else {
                    document.documentElement.setAttribute('data-chu-de', DuLieu.chuDe);
                }
            }
            document.getElementById('tien-trinh-tieu-de').textContent = DuLieu.tieuDe;
            document.getElementById('tien-trinh-thanh').style.width = '0%';
            document.getElementById('tien-trinh-thanh').style.animation = '';
            document.getElementById('tien-trinh-phan-tram').textContent = '0%';

            let isUninstall = DuLieu.tieuDe.toLowerCase().includes('gỡ') || DuLieu.tieuDe.toLowerCase().includes('uninstall');
            let danhSachApp = DuLieu.danhSachApp || [];
            window.danhSachAppTienTrinh = danhSachApp;
            TienTrinhSoApp = danhSachApp.length;
            window.phanTramTungApp = {};
            window.isUninstallMode = isUninstall;
            let ds = document.getElementById('tien-trinh-danh-sach');
            ds.innerHTML = ''; document.getElementById('tien-trinh-thanh').style.backgroundColor = isUninstall ? 'var(--nguy-hiem)' : 'var(--mau-nhan)';

            let opts = {};
            if (isUninstall) {
                try { opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}'); } catch (e) { }
                if (opts.taoDiemLuu) {
                    ds.style.display = 'none';
                    let rsUi = document.getElementById('tien-trinh-diem-khoi-phuc');
                    if (rsUi) {
                        rsUi.style.display = 'flex';
                        let rpList = document.getElementById('danh-sach-diem-khoi-phuc-cu');
                        if (rpList) rpList.innerHTML = '<div style="padding: 20px; text-align: center; width: 100%;"><div class="spinner"></div><div style="margin-top: 10px; color: var(--chu-phu);">Đang tải dữ liệu điểm khôi phục...</div></div>';
                    }
                    document.getElementById('tien-trinh-tieu-de').textContent = 'Đang tạo điểm khôi phục hệ thống...';
                }
                if (opts.taoDiemLuu || opts.xoaTanDu) {
                    let btnNext = document.getElementById('tiep-theo-tien-trinh');
                    if (btnNext) {
                        btnNext.style.display = 'block';
                        btnNext.disabled = true;
                        btnNext.textContent = 'Đang gỡ...';
                    }
                }
            }

            danhSachApp.forEach(app => {
                let hang = document.createElement('div');
                hang.className = 'TienTrinh_Muc';
                hang.style.display = 'flex';
                hang.style.alignItems = 'center';
                hang.style.justifyContent = 'space-between';
                hang.style.padding = '8px 0';
                hang.style.borderBottom = '1px solid var(--vien)';

                let tenApp = typeof app === 'string' ? app : (app.name || app.id || 'Unknown App');
                let tenWrap = document.createElement('div');
                tenWrap.className = 'TienTrinh_TenWrap';
                tenWrap.style.display = 'flex';
                tenWrap.style.flexDirection = 'column';
                tenWrap.style.flex = '1';
                tenWrap.style.minWidth = '0';

                let appMode = typeof app === 'object' && app.mode ? app.mode : (isUninstall ? 'Đơn luồng' : 'Đơn luồng');
                let theLoaiHtml = `<span class="app-thread-mode" id="thread-mode-${encodeURIComponent(tenApp).replace(/%/g, '_')}" style="opacity: 0.6; font-size: 0.9em; margin-right: 20px; display: inline-block; width: 75px; text-align: left;">${appMode}</span>`;

                let topRow = document.createElement('div');
                topRow.style.display = 'flex';
                topRow.style.alignItems = 'center';
                topRow.innerHTML = `
            <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 16px;" title="${tenApp}">${tenApp}</div>
            ${theLoaiHtml}
            `;

                tenWrap.appendChild(topRow);

                let tt = document.createElement('div');
                tt.className = 'TienTrinh_TrangThai';
                tt.style.width = '130px';
                tt.style.flexShrink = '0';
                tt.style.display = 'flex';
                tt.style.alignItems = 'center';
                tt.style.justifyContent = 'flex-end';
                tt.style.fontSize = '0.9em';
                tt.style.paddingRight = '12px';
                tt.id = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
                tt.innerHTML = '<span class="status-text" style="display: inline-block; width: 105px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px;">Đang chờ...</span><span class="spinner" id="spinner-' + encodeURIComponent(tenApp).replace(/%/g, '_') + '" style="display: none; flex-shrink: 0;"></span>';
                tt.style.color = 'var(--chu-phu)';

                hang.appendChild(tenWrap);
                hang.appendChild(tt);
                ds.appendChild(hang);
            });
            if (ds.lastChild) {
                ds.lastChild.style.borderBottom = 'none';
            }

            let globalStages = document.getElementById('tien-trinh-global-stages');
            if (globalStages) {
                globalStages.innerHTML = '';
                let stagesData = [];

                if (isUninstall) {
                    let opts = {};
                    try {
                        opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}');
                    } catch (e) { }

                    if (opts.taoDiemLuu || opts.xoaTanDu) {
                        if (opts.taoDiemLuu) stagesData.push({ id: 'rs', name: 'Điểm lưu' });
                        stagesData.push({ id: 'un', name: 'Gỡ cài đặt' });
                        if (opts.xoaTanDu) stagesData.push({ id: 'cl', name: 'Xóa tàn dư' });
                    }
                } else {
                    let isAllDownloadable = danhSachApp.every(app => {
                        let isFileOrGop = typeof app === 'object' && ((app.source && app.source.type === 'File') || app.isFile || app.isGop || app.isMsStore);
                        return !isFileOrGop;
                    });
                    if (isAllDownloadable) {
                        stagesData.push({ id: 'dl', name: 'Tải xuống' });
                        stagesData.push({ id: 'in', name: 'Cài đặt' });
                    }
                }

                if (stagesData.length > 0) {
                    stagesData.forEach((st, idx) => {
                        let item = document.createElement('div');
                        item.className = 'GlobalStage_Item';
                        item.id = 'global-stage-' + st.id;
                        item.style.cssText = 'flex: 1; height: 6px; border-radius: var(--do-bo-nho); background: var(--nen-tang3); transition: all 0.3s; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);';
                        globalStages.appendChild(item);
                    });
                    globalStages.style.display = 'flex';
                } else {
                    globalStages.style.display = 'none';
                }
            }

            window.GlobalAppList = danhSachApp.map(app => {
                let name = typeof app === 'string' ? app : (app.name || app.id || 'Unknown App');
                let isFileOrGop = typeof app === 'object' && ((app.source && app.source.type === 'File') || app.isFile || app.isGop || app.isMsStore);
                return {
                    name: name,
                    isFile: isFileOrGop
                };
            });
            window.AppStatuses = {};
        } catch (error) {
            document.getElementById('tien-trinh-tieu-de').textContent = 'INIT ERR: ' + error.message;
        }
    });

    let p2 = window.DienTu.KhiCapNhatTienTrinh((DuLieu) => {
        try {
            let dsApp = document.getElementById('tien-trinh-danh-sach');
            let dsRp = document.getElementById('tien-trinh-diem-khoi-phuc');
            let btnNext = document.getElementById('tiep-theo-tien-trinh');

            if (DuLieu.waitingForUser && DuLieu.globalStage === 'rs') {
                if (dsApp) dsApp.style.display = 'none';
                if (dsRp) dsRp.style.display = 'flex';
                if (btnNext) {
                    btnNext.style.display = 'block';
                    btnNext.disabled = false;
                    btnNext.textContent = 'Tiếp theo';
                    btnNext.onclick = () => {
                        btnNext.disabled = true;
                        btnNext.textContent = window.isUninstallMode ? 'Đang gỡ...' : 'Đang xử lý...';
                        if (window.DienTu && window.DienTu.TiepTucTienTrinh) {
                            window.DienTu.TiepTucTienTrinh();
                        } else {
                            window.dispatchEvent(new CustomEvent('mock-next-clicked'));
                            localStorage.setItem('mock-next-clicked', Date.now().toString());
                        }
                    };

                    let hideUiCb = () => {
                        btnNext.disabled = true;
                        btnNext.textContent = window.isUninstallMode ? 'Đang gỡ...' : 'Đang xử lý...';
                        if (dsRp) dsRp.style.display = 'none';
                        if (dsApp) dsApp.style.display = 'block';
                    };
                    let listener = (e) => {
                        if (e.type === 'mock-hide-rp-ui' || (e.type === 'storage' && e.key === 'mock-hide-rp-ui')) {
                            window.removeEventListener('mock-hide-rp-ui', listener);
                            window.removeEventListener('storage', listener);
                            hideUiCb();
                        }
                    };
                    window.addEventListener('mock-hide-rp-ui', listener);
                    window.addEventListener('storage', listener);
                }

                let rpNew = document.getElementById('diem-khoi-phuc-moi');
                if (rpNew && DuLieu.newRestorePointName) {
                    rpNew.innerHTML = `<div style="font-size: 0.85rem; color: var(--chu-phu); margin-bottom: 6px;">Điểm khôi phục mới sẽ tạo:</div>
                <div style="padding: 10px 12px; background: var(--nen-tang2); border: 1px solid var(--vien); border-radius: var(--do-bo); font-weight: 600; color: var(--thanh-cong); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    ${DuLieu.newRestorePointName}
                </div>`;
                }

                let tieuDe = document.getElementById('tien-trinh-tieu-de');
                if (tieuDe) tieuDe.textContent = 'Đang tạo điểm khôi phục hệ thống...';

                let rsStage = document.getElementById('global-stage-rs');
                if (rsStage) rsStage.style.background = 'var(--canh-bao)';
                let unStage = document.getElementById('global-stage-un');
                if (unStage) unStage.style.background = 'var(--nen-tang3)';
                let clStage = document.getElementById('global-stage-cl');
                if (clStage) clStage.style.background = 'var(--nen-tang3)';

                let rpList = document.getElementById('danh-sach-diem-khoi-phuc-cu');
                if (rpList && DuLieu.restorePoints) {
                    rpList.innerHTML = '';
                    if (DuLieu.restorePoints.length === 0) {
                        rpList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--chu-phu); font-size: 0.9rem; font-style: italic; background: rgba(0,0,0,0.1); border-radius: var(--do-bo);">Không có điểm khôi phục cũ nào.</div>';
                    } else {
                        DuLieu.restorePoints.forEach(rp => {
                            let div = document.createElement('div');
                            div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--nen-tang2); border: 1px solid var(--vien); border-radius: var(--do-bo); transition: all 0.2s;';
                            div.innerHTML = `
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 500; font-size: 0.95rem; color: var(--chu-chinh);">${rp.description}</span>
                                <span style="font-size: 0.8rem; color: var(--chu-phu); margin-top: 2px;">${rp.creationTime}</span>
                            </div>
                            <button class="Nut rp-del-btn" data-id="${rp.sequenceNumber}" style="padding: 6px 10px; border-radius: var(--do-bo-nho); border: 1px solid var(--nguy-hiem); background: transparent; color: var(--nguy-hiem); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Xóa">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        `;
                            let btnDel = div.querySelector('.rp-del-btn');
                            btnDel.onmouseover = () => { btnDel.style.background = 'var(--nguy-hiem)'; btnDel.style.color = '#fff'; };
                            btnDel.onmouseout = () => { btnDel.style.background = 'transparent'; btnDel.style.color = 'var(--nguy-hiem)'; };
                            btnDel.onclick = async () => {
                                btnDel.disabled = true;
                                btnDel.style.opacity = '0.5';
                                btnDel.innerHTML = '<div class="spinner" style="margin:0; width: 14px; height: 14px;"></div>';
                                if (window.DienTu && window.DienTu.XoaDiemKhoiPhuc) {
                                    await window.DienTu.XoaDiemKhoiPhuc(rp.sequenceNumber);
                                    div.remove();
                                    if (rpList.children.length === 0) {
                                        rpList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--chu-phu); font-size: 0.9rem; font-style: italic; background: rgba(0,0,0,0.1); border-radius: var(--do-bo);">Không có điểm khôi phục cũ nào.</div>';
                                    }
                                } else {
                                    setTimeout(() => {
                                        div.style.opacity = '0';
                                        setTimeout(() => {
                                            div.remove();
                                            if (rpList.children.length === 0) {
                                                rpList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--chu-phu); font-size: 0.9rem; font-style: italic; background: rgba(0,0,0,0.1); border-radius: var(--do-bo);">Không có điểm khôi phục cũ nào.</div>';
                                            }
                                        }, 200);
                                    }, 800);
                                }
                            };
                            rpList.appendChild(div);
                        });
                    }
                }
            }

            if (window.isUninstallMode && DuLieu.globalStage) {
                let opts = {};
                try { opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}'); } catch (e) { }
                let allDone = true;
                let hasError = false;
                if (window.GlobalAppList) {
                    for (let app of window.GlobalAppList) {
                        let st = (window.AppStatuses && window.AppStatuses[app.name]) ? window.AppStatuses[app.name] : 'waiting';
                        if (st !== 'done' && st !== 'error') allDone = false;
                        if (st === 'error') hasError = true;
                    }
                }
                let activeStage = DuLieu.globalStage;
                let globalItems = document.querySelectorAll('.GlobalStage_Item');
                let foundActive = false;
                globalItems.forEach(item => {
                    if (item.id === 'global-stage-' + activeStage) {
                        if (hasError) {
                            item.style.background = 'var(--nguy-hiem)';
                        } else {
                            item.style.background = allDone ? 'var(--thanh-cong)' : 'var(--canh-bao)';
                        }
                        foundActive = true;
                    } else if (!foundActive) {
                        item.style.background = 'var(--thanh-cong)';
                    } else {
                        item.style.background = 'var(--nen-tang3)';
                    }
                });
            }

            if (!DuLieu.name) return;

            let tenApp = DuLieu.name;
            let phanTram = DuLieu.percent || 0;
            let trangThai = DuLieu.short_status || (DuLieu.status === 'done' ? 'Hoàn tất' : (DuLieu.status === 'error' ? 'Lỗi' : (phanTram + '%')));

            if (DuLieu.status === 'installing') {
                if (!window.FakeInstallProgress) window.FakeInstallProgress = {};
                if (!window.FakeInstallProgress[tenApp]) {
                    window.FakeInstallProgress[tenApp] = { pct: DuLieu.percent || 0, interval: null };
                    window.FakeInstallProgress[tenApp].interval = setInterval(() => {
                        if (!window.AppStatuses || window.AppStatuses[tenApp] !== 'installing') {
                            clearInterval(window.FakeInstallProgress[tenApp].interval);
                            return;
                        }
                        let obj = window.FakeInstallProgress[tenApp];
                        if (obj.pct < 99) {
                            obj.pct += Math.floor(Math.random() * 3) + 1;
                            if (obj.pct > 99) obj.pct = 99;
                            let ttEl_local = document.getElementById('tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_'));
                            if (ttEl_local) {
                                let txt = ttEl_local.querySelector('.status-text');
                                if (txt) txt.textContent = obj.pct + '%';
                            }
                            if (window.phanTramTungApp) {
                                window.phanTramTungApp[tenApp] = obj.pct;
                                let tDiem = 0;
                                for (let k in window.phanTramTungApp) {
                                    tDiem += window.phanTramTungApp[k];
                                }
                                let tPhanTram = Math.min(100, tDiem / Math.max(1, TienTrinhSoApp));
                            }
                        }
                    }, 800);
                }
                trangThai = window.FakeInstallProgress[tenApp].pct + '%';
                phanTram = window.FakeInstallProgress[tenApp].pct;
            } else {
                if (window.FakeInstallProgress && window.FakeInstallProgress[tenApp]) {
                    clearInterval(window.FakeInstallProgress[tenApp].interval);
                    delete window.FakeInstallProgress[tenApp];
                }
            }

            let tongPhanTram = 0;
            if (!window.phanTramTungApp) window.phanTramTungApp = {};
            window.phanTramTungApp[tenApp] = phanTram;

            if (TienTrinhSoApp > 0 && window.danhSachAppTienTrinh) {
                let tongDiem = 0;
                for (let app of window.danhSachAppTienTrinh) {
                    let t = window.phanTramTungApp[app.name || app] || 0;
                    if (app.status === 'done' || app.status === 'error') t = 100;
                    tongDiem += t;
                }
                if (DuLieu.status === 'done' || DuLieu.status === 'error') {
                    window.phanTramTungApp[tenApp] = 100;
                    tongDiem = window.danhSachAppTienTrinh.reduce((sum, a) => sum + (window.phanTramTungApp[a.name] || 0), 0);
                }
                tongPhanTram = Math.min(100, tongDiem / TienTrinhSoApp);
            }

            if (true) {
                let idTt = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
                let ttEl = document.getElementById(idTt);

                if (ttEl) {
                    let textSpan = ttEl.querySelector('.status-text');
                    let displayTrangThai = trangThai;
                    if (displayTrangThai === 'Lỗi') displayTrangThai = 'Lỗi - Bỏ qua';
                    if (textSpan) textSpan.textContent = displayTrangThai;
                    else ttEl.textContent = displayTrangThai;

                    if (DuLieu.status_color) ttEl.style.color = DuLieu.status_color;
                    ttEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
                    if (DuLieu.full_status) ttEl.title = DuLieu.full_status;

                    let spinner = ttEl.querySelector('.spinner');
                    if (DuLieu.status === 'done' || DuLieu.status === 'error') {
                        if (spinner) spinner.style.display = 'none';
                        ttEl.className = 'TienTrinh_TrangThai ' + (DuLieu.status === 'done' ? 'thanh-cong' : 'loi');
                        if (DuLieu.status === 'done') ttEl.style.color = 'var(--thanh-cong)';

                        if (DuLieu.status === 'error') {
                            if (!window.AppErrorDetails) window.AppErrorDetails = {};
                            window.AppErrorDetails[tenApp] = DuLieu.full_status || "Lỗi không xác định";
                            if (!window.AppErrorStage) {
                                window.AppErrorStage = DuLieu.globalStage || (window.isUninstallMode ? 'un' : (hasDownloading ? 'dl' : 'in'));
                            }
                        }
                    } else {
                        if (spinner) spinner.style.display = 'inline-block';
                    }

                    if (!window.AppStatuses) window.AppStatuses = {};
                    window.AppStatuses[tenApp] = DuLieu.status;

                    if (window.GlobalAppList) {
                        let hasDownloading = false;
                        let allDoneOrError = true;
                        let hasError = false;

                        for (let app of window.GlobalAppList) {
                            let st = window.AppStatuses[app.name] || 'waiting';
                            if (st !== 'done' && st !== 'error') {
                                allDoneOrError = false;
                            }
                            if (st === 'error') {
                                hasError = true;
                            }
                            if (st === 'downloading' || (!app.isFile && st === 'waiting')) {
                                hasDownloading = true;
                            }
                        }
                        if (window.isUninstallMode) hasError = false;

                        let isProcessFinished = allDoneOrError;
                        let tieuDe = document.getElementById('tien-trinh-tieu-de');

                        if (window.isUninstallMode) {
                            let opts = {};
                            try { opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}'); } catch (e) { }
                            let activeStage = DuLieu.globalStage || 'un';

                            if (opts.xoaTanDu && activeStage !== 'cl') {
                                isProcessFinished = false;
                            }

                            activeStage = (isProcessFinished && hasError && window.AppErrorStage) ? window.AppErrorStage : (DuLieu.globalStage || 'un');
                            let globalItems = document.querySelectorAll('.GlobalStage_Item');
                            let foundActive = false;
                            globalItems.forEach(item => {
                                if (item.id === 'global-stage-' + activeStage) {
                                    if (allDoneOrError && hasError) {
                                        item.style.background = 'var(--nguy-hiem)';
                                    } else if (allDoneOrError && !hasError) {
                                        item.style.background = 'var(--thanh-cong)';
                                    } else {
                                        item.style.background = 'var(--canh-bao)';
                                    }
                                    foundActive = true;
                                } else if (!foundActive) {
                                    item.style.background = 'var(--thanh-cong)';
                                } else {
                                    item.style.background = 'var(--nen-tang3)';
                                }
                            });
                            if (tieuDe) {
                                if (isProcessFinished) {
                                    tieuDe.textContent = hasError ? 'Tiến trình kết thúc (Có lỗi)' : 'Hoàn tất tiến trình';
                                } else {
                                    if (DuLieu.globalStage === 'rs') tieuDe.textContent = 'Đang tạo điểm khôi phục hệ thống...';
                                    else if (DuLieu.globalStage === 'un') tieuDe.textContent = 'Đang tiến hành gỡ cài đặt...';
                                    else if (DuLieu.globalStage === 'cl') tieuDe.textContent = 'Đang dọn dẹp tàn dư hệ thống...';
                                }
                            }

                            if (DuLieu.showCleanupList || (window.isUninstallMode && opts.xoaTanDu && isProcessFinished)) {
                                let dsRp = document.getElementById('tien-trinh-diem-khoi-phuc');
                                let dsApp = document.getElementById('tien-trinh-danh-sach');
                                let dsSum = document.getElementById('tien-trinh-tong-ket-don-dep');
                                if (dsApp) dsApp.style.display = 'none';
                                if (dsRp) dsRp.style.display = 'none';
                                if (dsSum) {
                                    dsSum.style.display = 'flex';
                                    let regSum = document.getElementById('tong-ket-registry');
                                    let fileSum = document.getElementById('tong-ket-tep-tin');
                                    let currentState = isProcessFinished ? 'done' : 'selecting';

                                    if (regSum && regSum.dataset.state !== currentState) {
                                        regSum.dataset.state = currentState;
                                        regSum.innerHTML = '';
                                        let regs = DuLieu.leftoverRegs || [];
                                        if (regs.length === 0) {
                                            let d = document.createElement('div'); d.textContent = 'Không có tàn dư Registry nào được tìm thấy.'; d.style.fontStyle = 'italic'; d.style.opacity = '0.7'; regSum.appendChild(d);
                                        } else {
                                            regs.forEach((r, i) => {
                                                let d = document.createElement('div');
                                                if (isProcessFinished) {
                                                    d.textContent = 'Đã xóa: ' + r;
                                                } else {
                                                    d.innerHTML = `<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" class="OChon" checked id="mock-reg-${i}"> ${r}</label>`;
                                                }
                                                regSum.appendChild(d);
                                            });
                                        }
                                    }
                                    if (fileSum && fileSum.dataset.state !== currentState) {
                                        fileSum.dataset.state = currentState;
                                        fileSum.innerHTML = '';
                                        let files = DuLieu.leftoverFiles || [];
                                        if (files.length === 0) {
                                            let d = document.createElement('div'); d.textContent = 'Không có tệp tin/thư mục rác nào được tìm thấy.'; d.style.fontStyle = 'italic'; d.style.opacity = '0.7'; fileSum.appendChild(d);
                                        } else {
                                            files.forEach((f, i) => {
                                                let d = document.createElement('div');
                                                if (isProcessFinished) {
                                                    d.textContent = 'Đã dọn dẹp: ' + f;
                                                } else {
                                                    d.innerHTML = `<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" class="OChon" checked id="mock-file-${i}"> ${f}</label>`;
                                                }
                                                fileSum.appendChild(d);
                                            });
                                        }
                                    }
                                }
                            }
                        } else {
                            let dlStage = document.getElementById('global-stage-dl');
                            let inStage = document.getElementById('global-stage-in');
                            if (dlStage && inStage) {
                                let errorStage = window.AppErrorStage || (hasDownloading ? 'dl' : 'in');
                                if (allDoneOrError) {
                                    if (hasError) {
                                        if (errorStage === 'dl') {
                                            dlStage.style.background = 'var(--nguy-hiem)';
                                            inStage.style.background = 'var(--nen-tang3)';
                                        } else {
                                            dlStage.style.background = 'var(--thanh-cong)';
                                            inStage.style.background = 'var(--nguy-hiem)';
                                        }
                                    } else {
                                        dlStage.style.background = 'var(--thanh-cong)';
                                        inStage.style.background = 'var(--thanh-cong)';
                                    }
                                    if (tieuDe) tieuDe.textContent = hasError ? 'Tiến trình kết thúc (Có lỗi nghiêm trọng)' : 'Hoàn tất tiến trình';
                                } else if (hasDownloading) {
                                    dlStage.style.background = 'var(--canh-bao)';
                                    inStage.style.background = 'var(--nen-tang3)';
                                    if (tieuDe) tieuDe.textContent = 'Đang tải xuống dữ liệu...';
                                } else {
                                    dlStage.style.background = 'var(--thanh-cong)';
                                    inStage.style.background = 'var(--canh-bao)';
                                    if (tieuDe) tieuDe.textContent = 'Đang tiến hành cài đặt...';
                                }
                            }
                        }

                        if (isProcessFinished) {
                            let btnHuy = document.getElementById('dong-tien-trinh');
                            let btnBaoCao = document.getElementById('bao-cao-loi');
                            let btnNext = document.getElementById('tiep-theo-tien-trinh');
                            if (btnNext) btnNext.style.display = 'none';

                            if (btnHuy) {
                                btnHuy.textContent = 'Đóng';
                                btnHuy.dataset.isCancel = 'false';
                                if (hasError) {
                                    btnHuy.style.background = '';
                                    btnHuy.style.color = '';
                                    btnHuy.style.border = '';
                                    if (btnBaoCao) {
                                        btnBaoCao.style.display = 'block';
                                        btnBaoCao.onclick = () => {
                                            let details = "=== BÁO CÁO LỖI HỆ THỐNG ===\nThời gian: " + new Date().toLocaleString() + "\n\nDanh sách các tiến trình thất bại:\n";
                                            if (window.AppErrorDetails) {
                                                for (let app in window.AppErrorDetails) {
                                                    details += "- [" + app + "]: " + window.AppErrorDetails[app] + "\n";
                                                }
                                            } else {
                                                details += "- Không có thông tin lỗi chi tiết.\n";
                                            }
                                            document.getElementById('chi-tiet-bao-cao-loi').value = details;
                                            document.getElementById('lop-phu-modal').classList.remove('an');
                                            document.getElementById('hop-thoai-bao-cao-loi').classList.remove('an');
                                        };
                                    }
                                } else {
                                    btnHuy.style.background = 'var(--mau-nhan)';
                                    btnHuy.style.color = '#fff';
                                    btnHuy.style.border = 'none';
                                    if (btnBaoCao) btnBaoCao.style.display = 'none';
                                }
                            }
                        } else if (allDoneOrError && window.isUninstallMode) {
                            let btnNext = document.getElementById('tiep-theo-tien-trinh');
                            if (btnNext) {
                                btnNext.style.display = 'block';
                                btnNext.disabled = false;
                                btnNext.textContent = 'Tiếp theo';
                            }
                            let btnHuy = document.getElementById('dong-tien-trinh');
                            if (btnHuy) {
                                btnHuy.textContent = 'Hủy';
                                btnHuy.dataset.isCancel = 'true';
                                btnHuy.style.background = '';
                                btnHuy.style.color = '';
                                btnHuy.style.border = '';
                            }
                            let btnBaoCao = document.getElementById('bao-cao-loi');
                            if (btnBaoCao) btnBaoCao.style.display = 'none';
                        } else if (window.isUninstallMode && DuLieu.globalStage === 'cl' && DuLieu.waitingForUser) {
                            let btnNext = document.getElementById('tiep-theo-tien-trinh');
                            if (btnNext) {
                                btnNext.style.display = 'block';
                                btnNext.disabled = false;
                                btnNext.textContent = 'Tiếp theo';
                                btnNext.onclick = () => {
                                    btnNext.disabled = true;
                                    btnNext.textContent = 'Đang dọn dẹp...';
                                    let checkBoxes = document.querySelectorAll('#tien-trinh-tong-ket-don-dep input[type="checkbox"]');
                                    checkBoxes.forEach(cb => cb.disabled = true);
                                    if (window.DienTu && window.DienTu.TiepTucTienTrinh) {
                                        window.DienTu.TiepTucTienTrinh();
                                    } else {
                                        window.dispatchEvent(new CustomEvent('mock-cleanup-next-clicked'));
                                        localStorage.setItem('mock-cleanup-next-clicked', Date.now().toString());
                                    }
                                };
                            }
                            let btnHuy = document.getElementById('dong-tien-trinh');
                            if (btnHuy) {
                                btnHuy.textContent = 'Hủy';
                                btnHuy.style.background = '';
                                btnHuy.style.color = '';
                                btnHuy.style.border = '';
                            }
                            let btnBaoCao = document.getElementById('bao-cao-loi');
                            if (btnBaoCao) btnBaoCao.style.display = 'none';
                        } else {
                            let btnNext = document.getElementById('tiep-theo-tien-trinh');
                            if (btnNext) {
                                let opts = {};
                                try { opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}'); } catch (e) { }
                                if (window.isUninstallMode && (opts.taoDiemLuu || opts.xoaTanDu)) {
                                    btnNext.style.display = 'block';
                                    btnNext.disabled = true;
                                    if (DuLieu.globalStage === 'cl') {
                                        btnNext.textContent = 'Đang dọn dẹp...';
                                    } else {
                                        btnNext.textContent = 'Đang gỡ...';
                                    }
                                } else {
                                    btnNext.style.display = 'none';
                                }
                            }

                            let btnHuy = document.getElementById('dong-tien-trinh');
                            if (btnHuy) {
                                btnHuy.textContent = 'Hủy';
                                btnHuy.dataset.isCancel = 'true';
                                btnHuy.style.background = '';
                                btnHuy.style.color = '';
                                btnHuy.style.border = '';
                            }
                            let btnBaoCao = document.getElementById('bao-cao-loi');
                            if (btnBaoCao) btnBaoCao.style.display = 'none';
                        }
                    }
                }
                if (ttEl && ttEl.parentElement) {
                    let threadModeEl = document.getElementById('thread-mode-' + encodeURIComponent(tenApp).replace(/%/g, '_'));
                    if (threadModeEl && DuLieu.thread_mode) {
                        threadModeEl.textContent = DuLieu.thread_mode;
                        if (DuLieu.thread_mode_color) {
                            threadModeEl.style.color = DuLieu.thread_mode_color;
                            threadModeEl.style.opacity = '1';
                        }
                    }
                    if (!window.LastStatusApp) window.LastStatusApp = {};
                    if (window.LastStatusApp[tenApp] !== DuLieu.status) {
                        window.LastStatusApp[tenApp] = DuLieu.status;
                        if (DuLieu.status === 'installing') {
                            let ds = document.getElementById('tien-trinh-danh-sach');
                            let offsetTop = ttEl.parentElement.offsetTop;
                            if (offsetTop > ds.scrollTop + ds.clientHeight - 50 || offsetTop < ds.scrollTop) {
                                ds.scrollTo({ top: offsetTop - 50, behavior: 'smooth' });
                            }
                        }
                    }
                }
            }

            let isUninstall = window.isUninstallMode;
            let finalDisplayPercent = tongPhanTram;
            if (isUninstall) {
                let opts = {};
                try { opts = JSON.parse(localStorage.getItem('uninstall_opts') || '{}'); } catch (e) { }

                let hasRs = opts.taoDiemLuu;
                let hasCl = opts.xoaTanDu;

                let rsWeight = hasRs ? 25 : 0;
                let clWeight = hasCl ? 25 : 0;
                let unWeight = 100 - rsWeight - clWeight;

                let activeStage = DuLieu.globalStage || 'un';
                let rsProg = 0, unProg = 0, clProg = 0;

                if (activeStage === 'rs') {
                    rsProg = DuLieu.percent || 0;
                    if (DuLieu.waitingForUser) rsProg = 0;
                    else if (!DuLieu.waitingForUser && !DuLieu.percent) rsProg = 50;
                } else if (activeStage === 'un') {
                    rsProg = 100;
                    unProg = tongPhanTram;
                } else if (activeStage === 'cl') {
                    rsProg = 100;
                    unProg = 100;
                    clProg = DuLieu.percent || 50;
                }

                finalDisplayPercent = (rsProg * rsWeight / 100) + (unProg * unWeight / 100) + (clProg * clWeight / 100);

                let isDoneOrErr = window.GlobalAppList && window.GlobalAppList.every(app => window.AppStatuses && (window.AppStatuses[app.name] === 'done' || window.AppStatuses[app.name] === 'error'));
                if (isDoneOrErr && activeStage === 'cl') finalDisplayPercent = 100;
            }

            window.targetProgress = finalDisplayPercent;

            if (window.targetProgress === 0) {
                window.currentProgress = 0;
                document.getElementById('tien-trinh-thanh').style.width = '0%';
                let phanTramText = document.getElementById('tien-trinh-phan-tram');
                if (phanTramText) phanTramText.textContent = '0%';
            } else if (!window.isProgressAnimating) {
                if (typeof window.currentProgress !== 'number') {
                    window.currentProgress = parseFloat(document.getElementById('tien-trinh-thanh').style.width) || 0;
                }
                window.isProgressAnimating = true;

                let animate = () => {
                    let pBar = document.getElementById('tien-trinh-thanh');
                    if (!pBar) {
                        window.isProgressAnimating = false;
                        return;
                    }

                    let diff = window.targetProgress - window.currentProgress;

                    if (diff < 0) {
                        window.targetProgress = window.currentProgress;
                        diff = 0;
                    }

                    if (diff > 0) {
                        let step = Math.max(0.5, diff * 0.1);
                        if (step > diff) step = diff;
                        window.currentProgress += step;
                    }

                    pBar.style.width = window.currentProgress + '%';
                    let phanTramText = document.getElementById('tien-trinh-phan-tram');
                    if (phanTramText) phanTramText.textContent = Math.round(window.currentProgress) + '%';

                    if (window.currentProgress >= window.targetProgress) {
                        window.currentProgress = window.targetProgress;
                        window.isProgressAnimating = false;
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            }

            let mauThanh = isUninstall ? 'var(--canh-bao)' : 'var(--mau-nhan)';
            if (window.targetProgress >= 100) mauThanh = 'var(--thanh-cong)';
            else if (window.targetProgress >= 75) mauThanh = 'var(--thanh-cong)';
            else if (window.targetProgress >= 50) mauThanh = 'var(--canh-bao)';
            else if (window.targetProgress >= 25) mauThanh = 'var(--mau-uoc-tinh)';
            document.getElementById('tien-trinh-thanh').style.backgroundColor = mauThanh;

            let phanTramText = document.getElementById('tien-trinh-phan-tram');
            phanTramText.style.textShadow = '0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)';
        } catch (err) {
            let tieuDe = document.getElementById('tien-trinh-tieu-de');
            if (tieuDe) tieuDe.textContent = 'UPDATE ERR: ' + err.message;
        }
    });

    let p3 = window.DienTu.KhiHoanTatTienTrinh((ketQua) => {
        let coLoi = false;

        if (window.isUninstallMode) {
            if (ketQua && Array.isArray(ketQua)) {
                coLoi = ketQua.some(k => !k.success);
            }
            let stage3El = document.getElementById('tien-trinh-stage-status-stage-3');
            let stage4El = document.getElementById('tien-trinh-stage-status-stage-4');
            if (stage3El) {
                stage3El.textContent = coLoi ? 'Lỗi' : 'Hoàn tất';
                stage3El.style.color = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)';
            }
            if (stage4El) {
                stage4El.textContent = 'Hoàn tất';
                stage4El.style.color = 'var(--thanh-cong)';
            }
        } else {
            if (ketQua && Array.isArray(ketQua)) {
                ketQua.forEach(k => {
                    let idTt = 'tien-trinh-tt-' + encodeURIComponent(k.name).replace(/%/g, '_');
                    let ttEl = document.getElementById(idTt);
                    if (ttEl) {
                        ttEl.textContent = k.success ? 'Hoàn tất' : 'Lỗi';
                        ttEl.className = 'TienTrinh_TrangThai ' + (k.success ? 'thanh-cong' : 'loi');
                    }
                    if (!k.success) coLoi = true;
                });
            }
        }

        document.getElementById('tien-trinh-tieu-de').textContent = coLoi ? 'Hoàn tất (có lỗi)' : 'Hoàn tất';
        document.getElementById('tien-trinh-thanh').style.width = '100%';
        document.getElementById('tien-trinh-thanh').style.backgroundColor = coLoi ? 'var(--canh-bao)' : 'var(--thanh-cong)';
        document.getElementById('tien-trinh-thanh').style.animation = 'none';
        document.getElementById('tien-trinh-phan-tram').textContent = '100%';
        let nutDong = document.getElementById('dong-tien-trinh');
        nutDong.disabled = false;
        nutDong.style.opacity = '1';
        nutDong.className = 'Nut Nut--chinh';
        nutDong.textContent = 'Đóng';
        nutDong.dataset.isCancel = 'false';
        let btnNext = document.getElementById('tiep-theo-tien-trinh');
        if (btnNext) btnNext.style.display = 'none';
        let btnBaoLoi = document.getElementById('bao-cao-loi');
        if (btnBaoLoi && coLoi) {
            btnBaoLoi.style.display = 'block';
            btnBaoLoi.onclick = () => {
                let errorText = "Nex Launcher Error Report\nDate: " + new Date().toLocaleString() + "\nOS: " + navigator.userAgent + "\n\nFailed Apps:\n";
                if (ketQua) ketQua.forEach(k => {
                    if (!k.success) {
                        errorText += "- " + k.name + (k.error ? " (Error: " + k.error + ")" : " (Unknown Error)") + "\n";
                    }
                });
                document.getElementById('chi-tiet-bao-cao-loi').value = errorText;
                document.getElementById('hop-thoai-bao-cao-loi').classList.remove('an');
                document.getElementById('lop-phu-modal').classList.remove('an');
            };
        }
    });

    Promise.all([p1, p2, p3]).then(() => {
        if (window.__TAURI__ && window.__TAURI__.event) {
            window.__TAURI__.event.emit('tien-trinh-ready', {});
        }
    }).catch((err) => {
        console.error(err);
        if (window.__TAURI__ && window.__TAURI__.event) {
            window.__TAURI__.event.emit('tien-trinh-ready', {});
        }
    });
}
document.getElementById('dong-bao-cao-loi-x')?.addEventListener('click', () => {
    document.getElementById('hop-thoai-bao-cao-loi').classList.add('an');
    document.getElementById('lop-phu-modal').classList.add('an');
});
document.getElementById('dong-bao-cao-loi-ok')?.addEventListener('click', () => {
    document.getElementById('hop-thoai-bao-cao-loi').classList.add('an');
    document.getElementById('lop-phu-modal').classList.add('an');
});
document.getElementById('copy-bao-cao-loi')?.addEventListener('click', () => {
    let text = document.getElementById('chi-tiet-bao-cao-loi').value;
    navigator.clipboard.writeText(text).then(() => {
        let btn = document.getElementById('copy-bao-cao-loi');
        let oldText = btn.innerHTML;
        btn.innerHTML = 'Đã Copy!';
        setTimeout(() => { btn.innerHTML = oldText; }, 2000);
    });
});
document.getElementById('dong-tien-trinh').addEventListener('click', () => {
    let nutDong = document.getElementById('dong-tien-trinh');
    if (nutDong.dataset.isCancel === 'true') {
        if (window.DienTu && window.DienTu.HuyTienTrinh) {
            window.DienTu.HuyTienTrinh();
        }
        nutDong.disabled = true;
        nutDong.style.opacity = '0.5';
        nutDong.textContent = 'Đang hủy...';
    } else {
        if (window.DienTu) window.DienTu.DongCuaSoTienTrinh();
    }
});
let btnThuNho = document.getElementById('thu-nho-tien-trinh');
if (btnThuNho) {
    btnThuNho.addEventListener('click', () => {
        if (window.DienTu) window.DienTu.ThuNho();
    });
}

if (window.DienTu && window.DienTu.KiemTraDevMode) {
    window.DienTu.KiemTraDevMode().then(isDev => {
        if (!isDev) {
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('keydown', e => {
                if (e.key === 'F12' || e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
                    e.preventDefault();
                }
            });
        }
    }).catch(e => { });
}
