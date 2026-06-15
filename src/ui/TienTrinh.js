let TienTrinhSoApp = 0;
let TienTrinhHienTai = 0;
let TienTrinhAppTruoc = '';
function ApDungCauHinh() {
    var cd = localStorage.getItem('nex_chu_de') || 'dark';
    if (cd === 'system' && window.DienTu) {
        window.DienTu.LayChuDeHeThong().then(function(s) {
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
    if (DuLieu.chuDe) {
        if (DuLieu.chuDe === 'system') {
            window.DienTu.LayChuDeHeThong().then(function(s) {
                document.documentElement.setAttribute('data-chu-de', s.toLowerCase());
            });
        } else {
            document.documentElement.setAttribute('data-chu-de', DuLieu.chuDe);
        }
    }
    document.getElementById('tien-trinh-tieu-de').textContent = DuLieu.tieuDe;
    document.getElementById('tien-trinh-thanh').style.width = '0%';
    document.getElementById('tien-trinh-phan-tram').textContent = '0%';

    let isUninstall = DuLieu.tieuDe.toLowerCase().includes('gỡ') || DuLieu.tieuDe.toLowerCase().includes('uninstall');
    let danhSachApp = DuLieu.danhSachApp || [];
    window.danhSachAppTienTrinh = danhSachApp;
    TienTrinhSoApp = danhSachApp.length;
    window.phanTramTungApp = {};
    window.isUninstallMode = isUninstall;
    let ds = document.getElementById('tien-trinh-danh-sach');
    ds.innerHTML = '';

    if (isUninstall) {
        let stages = [
            { id: 'stage-1', name: 'Xác nhận gỡ cài đặt', status: 'Hoàn tất', color: 'var(--thanh-cong)' },
            { id: 'stage-2', name: 'Tạo điểm lưu khôi phục', status: 'Hoàn tất', color: 'var(--thanh-cong)' },
            { id: 'stage-3', name: 'Thực thi gỡ cài đặt', status: 'Đang xử lý...', color: 'var(--chu-chinh)' },
            { id: 'stage-4', name: 'Quét và xóa tàn dư', status: 'Đang chờ...', color: 'var(--chu-phu)' }
        ];

        document.getElementById('tien-trinh-thanh').style.background = 'var(--nguy-hiem)';

        stages.forEach(stage => {
            let hang = document.createElement('div');
            hang.className = 'TienTrinh_Muc';
            hang.style.display = 'flex';
            hang.style.alignItems = 'center';
            hang.style.justifyContent = 'space-between';
            hang.style.padding = '8px 0';
            hang.style.borderBottom = '1px solid var(--vien)';
            if (stage.id === 'stage-4') hang.style.borderBottom = 'none';
            
            let ten = document.createElement('div');
            ten.className = 'TienTrinh_AppTen';
            ten.style.flex = '1';
            ten.style.fontWeight = '500';
            ten.style.paddingLeft = '12px';
            ten.textContent = stage.name;
            
            let tt = document.createElement('div');
            tt.className = 'TienTrinh_TrangThai';
            tt.id = 'tien-trinh-stage-status-' + stage.id;
            tt.style.width = '150px';
            tt.style.flexShrink = '0';
            tt.style.textAlign = 'right';
            tt.style.paddingRight = '12px';
            tt.textContent = stage.status;
            tt.style.color = stage.color;
            
            hang.appendChild(ten);
            hang.appendChild(tt);
            ds.appendChild(hang);
        });
        
        window.__TAURI__.event.listen('tien-trinh-stage-update', (e) => {
            let detail = e.payload;
            let ttEl = document.getElementById('tien-trinh-stage-status-' + detail.stage);
            if (ttEl) {
                ttEl.textContent = detail.status;
                if (detail.color) ttEl.style.color = detail.color;
            }
        });

    } else {
        document.getElementById('tien-trinh-thanh').style.background = 'var(--mau-nhan)';

        danhSachApp.forEach(app => {
          let hang = document.createElement('div');
          hang.className = 'TienTrinh_Muc';
          hang.style.display = 'flex';
          hang.style.alignItems = 'center';
          hang.style.justifyContent = 'space-between';
          hang.style.padding = '8px 0';
          hang.style.borderBottom = '1px solid var(--vien)';
          
          let ten = document.createElement('div');
          ten.className = 'TienTrinh_AppTen';
          ten.style.flex = '1';
          ten.style.minWidth = '0';
          ten.style.fontWeight = '500';
          ten.style.whiteSpace = 'nowrap';
          ten.style.overflow = 'hidden';
          ten.style.textOverflow = 'ellipsis';
          ten.style.paddingRight = '8px';
          ten.style.paddingLeft = '12px';
          let tenApp = typeof app === 'string' ? app : (app.name || app.id || 'Unknown App');
          ten.textContent = tenApp;
          ten.title = tenApp;
          
          let luong = document.createElement('div');
          luong.className = 'TienTrinh_LoaiLuong';
          luong.style.width = '80px';
          luong.style.flexShrink = '0';
          luong.style.textAlign = 'center';
          luong.style.color = 'var(--chu-phu)';
          luong.style.fontSize = '0.85em';
          luong.textContent = 'Đơn luồng';

          let tt = document.createElement('div');
          tt.className = 'TienTrinh_TrangThai';
          tt.style.width = '120px';
          tt.style.flexShrink = '0';
          tt.style.textAlign = 'right';
          tt.style.fontSize = '0.9em';
          tt.style.paddingRight = '12px';
          tt.id = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
          tt.textContent = 'Đang xử lý...';
          tt.style.color = 'var(--chu-phu)';
          
          hang.appendChild(ten);
          hang.appendChild(luong);
          hang.appendChild(tt);
          ds.appendChild(hang);
        });
        if (ds.lastChild) {
            ds.lastChild.style.borderBottom = 'none';
        }
    }
  });

  let p2 = window.DienTu.KhiCapNhatTienTrinh((DuLieu) => {
    let tenApp = DuLieu.name;
    let phanTram = DuLieu.percent;
    let trangThai = DuLieu.short_status || (DuLieu.status === 'done' ? 'Hoàn tất' : (DuLieu.status === 'error' ? 'Lỗi' : (phanTram + '%')));
    
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
    
    if (!window.isUninstallMode) {
        let idTt = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
        let ttEl = document.getElementById(idTt);
        if (ttEl) {
          ttEl.textContent = trangThai;
          if (DuLieu.status_color) ttEl.style.color = DuLieu.status_color;
          ttEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
          if (DuLieu.full_status) ttEl.title = DuLieu.full_status;
          if (DuLieu.status === 'done') ttEl.className = 'TienTrinh_TrangThai thanh-cong';
          else if (DuLieu.status === 'error') ttEl.className = 'TienTrinh_TrangThai loi';
        }
        if (ttEl && ttEl.parentElement) {
          let ds = document.getElementById('tien-trinh-danh-sach');
          let offsetTop = ttEl.parentElement.offsetTop;
          if (offsetTop > ds.scrollTop + ds.clientHeight - 50 || offsetTop < ds.scrollTop) {
            ds.scrollTop = offsetTop - ds.clientHeight / 2;
          }
        }
    }
    
    let isUninstall = window.isUninstallMode;
    if (isUninstall) {
        let stageProgress = {1: 25, 2: 50, 3: 75, 4: 100};
        tongPhanTram = stageProgress[DuLieu.stage || 3] || 75; 
    }

    document.getElementById('tien-trinh-thanh').style.width = tongPhanTram + '%';
    
    if (isUninstall) {
        let mauThanh = 'var(--nguy-hiem)';
        if (tongPhanTram >= 75) mauThanh = 'var(--thanh-cong)';
        else if (tongPhanTram >= 50) mauThanh = 'var(--canh-bao)';
        else if (tongPhanTram >= 25) mauThanh = 'var(--mau-uoc-tinh)';
        document.getElementById('tien-trinh-thanh').style.backgroundColor = mauThanh;
    } else {
        let mauThanh = 'var(--mau-nhan)';
        if (tongPhanTram >= 75) mauThanh = 'var(--thanh-cong)';
        else if (tongPhanTram >= 50) mauThanh = 'var(--canh-bao)';
        else if (tongPhanTram >= 25) mauThanh = 'var(--mau-uoc-tinh)';
        document.getElementById('tien-trinh-thanh').style.backgroundColor = mauThanh;
    }
    document.getElementById('tien-trinh-thanh').style.transition = 'width 0.3s ease, background-color 0.5s ease';
    
    let phanTramText = document.getElementById('tien-trinh-phan-tram');
    phanTramText.textContent = Math.round(tongPhanTram) + '%';
    phanTramText.style.textShadow = '0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)';
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
    document.getElementById('tien-trinh-thanh').style.background = coLoi ? 'var(--canh-bao)' : 'var(--thanh-cong)';
    document.getElementById('tien-trinh-phan-tram').textContent = '100%';
    let nutDong = document.getElementById('dong-tien-trinh');
    nutDong.disabled = false;
    nutDong.style.opacity = '1';
    nutDong.className = 'Nut Nut--chinh';
    nutDong.textContent = 'Đóng';
    nutDong.dataset.isCancel = 'false';
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
    }).catch(e => {});
}
