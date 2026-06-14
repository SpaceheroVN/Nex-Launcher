let TienTrinhSoApp = 0;
let TienTrinhHienTai = 0;
let TienTrinhAppTruoc = '';
function ApDungCauHinh() {
    let luu = localStorage.getItem('NexCauHinh');
    if (luu) {
        try {
            let CauHinh = JSON.parse(luu);
            let cd = CauHinh.chuDe;
            if (cd === 'system' && window.DienTu) {
                window.DienTu.LayChuDeHeThong().then(sysTheme => {
                    document.documentElement.setAttribute('data-chu-de', sysTheme.toLowerCase());
                });
            } else {
                document.documentElement.setAttribute('data-chu-de', cd || 'dark');
            }
            if (CauHinh.mauNhan) document.documentElement.style.setProperty('--mau-nhan', CauHinh.mauNhan);
            if (CauHinh.doBoGoc) {
                document.documentElement.style.setProperty('--do-bo', CauHinh.doBoGoc + 'px');
                document.documentElement.style.setProperty('--do-bo-lon', (CauHinh.doBoGoc * 1.5) + 'px');
                document.documentElement.style.setProperty('--do-bo-nho', (CauHinh.doBoGoc * 0.5) + 'px');
            }
            if (typeof CauHinh.moAo !== 'undefined') {
                document.documentElement.style.setProperty('--alpha-nen', CauHinh.moAo ? 0.85 : 1);
            }
        } catch(e) {}
    } else {
        document.documentElement.setAttribute('data-chu-de', 'dark');
    }
}
if (window.DienTu) {
  ApDungCauHinh();
  window.DienTu.KhiKhoiTaoTienTrinh((DuLieu) => {
    document.getElementById('tien-trinh-tieu-de').textContent = DuLieu.tieuDe;
    document.getElementById('tien-trinh-thanh').style.width = '0%';
    document.getElementById('tien-trinh-phan-tram').textContent = '0%';
    let ds = document.getElementById('tien-trinh-danh-sach');
    ds.innerHTML = '';
    let danhSachApp = DuLieu.danhSachApp || [];
    TienTrinhSoApp = danhSachApp.length;
    TienTrinhHienTai = 0;
    TienTrinhAppTruoc = '';
    danhSachApp.forEach(app => {
      let hang = document.createElement('div');
      hang.className = 'TienTrinh_Muc';
      let ten = document.createElement('div');
      ten.className = 'TienTrinh_Ten';
      ten.textContent = app.name;
      ten.title = app.name;
      let tt = document.createElement('div');
      tt.className = 'TienTrinh_TrangThai';
      tt.id = 'tien-trinh-tt-' + encodeURIComponent(app.name).replace(/%/g, '_');
      tt.textContent = 'Đang xử lý...';
      hang.appendChild(ten);
      hang.appendChild(tt);
      ds.appendChild(hang);
    });
    let nutDong = document.getElementById('dong-tien-trinh');
    nutDong.disabled = false;
    nutDong.style.opacity = '1';
    nutDong.textContent = 'Hủy';
    nutDong.dataset.isCancel = 'true';
    let btnBaoLoi = document.getElementById('bao-cao-loi');
    if (btnBaoLoi) btnBaoLoi.style.display = 'none';
  });
  window.DienTu.KhiCapNhatTienTrinh((DuLieu) => {
    let tenApp = DuLieu.name;
    let phanTram = DuLieu.percent;
    let trangThai = DuLieu.status === 'downloading' ? 'Đang tải' : (DuLieu.status === 'installing' ? 'Đang cài đặt' : (DuLieu.status === 'downloading/installing' ? 'Đang xử lý' : (DuLieu.status === 'done' ? 'Hoàn tất' : 'Đang xử lý')));
    if (DuLieu.status === 'done' || DuLieu.status === 'error') {
      trangThai = DuLieu.status === 'done' ? 'Hoàn tất' : 'Lỗi';
    }
    if (tenApp !== TienTrinhAppTruoc) {
      TienTrinhAppTruoc = tenApp;
      TienTrinhHienTai++;
    }
    let idTt = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
    let ttEl = document.getElementById(idTt);
    if (ttEl) {
      ttEl.textContent = trangThai;
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
    let tongPhanTram = Math.min(100, ((Math.max(0, TienTrinhHienTai - 1) * 100 + phanTram) / (TienTrinhSoApp || 1)));
    document.getElementById('tien-trinh-thanh').style.width = tongPhanTram + '%';
    document.getElementById('tien-trinh-phan-tram').textContent = Math.round(tongPhanTram) + '%';
  });
  window.DienTu.KhiHoanTatTienTrinh((ketQua) => {
    let coLoi = false;
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
    document.getElementById('tien-trinh-thanh').style.width = '100%';
    document.getElementById('tien-trinh-phan-tram').textContent = '100%';
    let nutDong = document.getElementById('dong-tien-trinh');
    nutDong.disabled = false;
    nutDong.style.opacity = '1';
    nutDong.textContent = 'Đóng';
    nutDong.dataset.isCancel = 'false';
    let btnBaoLoi = document.getElementById('bao-cao-loi');
    if (btnBaoLoi && coLoi) {
      btnBaoLoi.style.display = 'block';
      btnBaoLoi.onclick = () => {
          let errorText = "Nex Launcher Error Report\nDate: " + new Date().toLocaleString() + "\nOS: " + navigator.userAgent + "\n\nFailed Apps:\n";
          ketQua.forEach(k => {
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
