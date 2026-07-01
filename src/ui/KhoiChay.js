// === [ UTILS ] ===
function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// === [ CORE INITIALIZATION ] ===
document.addEventListener('DOMContentLoaded', async function () {
  KhoiTaoChuDe(); KhoiTaoNgonNgu(); CapNhatBanDich(); DangKySuKien();
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
  if (window.DienTu && window.DienTu.LayPhienBan) {
    window.DienTu.LayPhienBan().then(version => {
      document.getElementById('ten-phien-ban').textContent = 'Nex Launcher v' + version;
      if (typeof Languages !== 'undefined') {
        if (Languages['VN']) Languages['VN']['about_version'] = 'Phiên bản ' + version;
        if (Languages['EN']) Languages['EN']['about_version'] = 'Version ' + version;
        CapNhatBanDich();
      }
    }).catch(e => console.error(e));
  }
  if (window.DienTu && window.DienTu.KiemTraTaiNguyen) {
    try {
      let res = await window.DienTu.KiemTraTaiNguyen();
      if ((res.totalRAM / 1073741824) < 2 || (res.freeRAM / 1073741824) < 1 || res.cpus <= 2 || res.cpuUsage > 90) {
        if (localStorage.getItem('caidat-tat-anim') !== 'false') {
          CauHinh.tatAnim = true;
          localStorage.setItem('caidat-tat-anim', 'true');
          ApDungCauHinh();
        }
      }
    } catch (e) { }
  }
  if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
    window.DienTu.ThayDoiUuTienCPU(true);
  }
  DanhSachPhanMem = await window.DienTu.LayDanhSachUngDung();
  HienThiDanhSachInstaller();
  DanhSachDaCaiDat = await window.DienTu.LayPhanMemDaCai();
  if (CauHinh.uninstallerGhiNhoDuLieu !== false) {
    for (let pm of DanhSachDaCaiDat) {
      if (!pm.installDate || pm.installDate === '-') {
        let cachedDate = await GetDateDB(pm.name);
        if (cachedDate) {
          pm.cachedDate = cachedDate;
          window.DateCache[pm.name] = cachedDate;
        }
      }
    }
  } else {
    window.IconCache = {};
    window.DateCache = {};
    window.SizeCache = {};
  }
  HienThiDanhSachUninstaller();
  if (typeof TrangHienTai !== 'undefined' && TrangHienTai === 'installer') {
    HienThiDanhSachInstaller(document.getElementById('o-tim-kiem-installer')?.value || '', false);
  }
  if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
    window.DienTu.ThayDoiUuTienCPU(false);
  }
  TienTrinhSoApp = 0; TienTrinhHienTai = 0; TienTrinhAppTruoc = '';
  if (window.DienTu.KhiTienTrinhCaiDat) {
    window.DienTu.KhiTienTrinhCaiDat((dl) => {
      if (dl.name !== TienTrinhAppTruoc) {
        TienTrinhHienTai++;
        TienTrinhAppTruoc = dl.name;
      }
      let laTai = dl.status === 'downloading';
      let phanTram = dl.percent || 0;
      let demText = dl.status === 'downloading' ? t('downloading') : (dl.status === 'installing' ? t('installing') : (dl.status === 'done' ? t('completed') : (dl.status === 'error' ? t('error_status') : t('processing'))));

      let mauChu = 'var(--chu-phu)';
      let rutGon = demText;
      if (dl.status === 'downloading') { mauChu = 'var(--mau-uoc-tinh)'; rutGon = t('downloading') + phanTram + '%'; }
      else if (dl.status === 'installing') { mauChu = 'var(--mau-canh-bao)'; rutGon = t('installing') + phanTram + '%'; }
      else if (dl.status === 'done') { mauChu = 'var(--thanh-cong)'; rutGon = t('completed'); }
      else if (dl.status === 'error') { mauChu = 'var(--nguy-hiem)'; rutGon = t('error_status'); }
      else { mauChu = 'var(--nguy-hiem)'; rutGon = phanTram + '%'; }

      CapNhatHopThoaiTienTrinh(dl.name, phanTram, rutGon, mauChu, demText, dl.status);
    });
  }
  if (window.DienTu.KhiTienTrinhGoCaiDat) {
    window.DienTu.KhiTienTrinhGoCaiDat((dl) => {
      if (dl.name !== TienTrinhAppTruoc) {
        TienTrinhHienTai++;
        TienTrinhAppTruoc = dl.name;
      }
      let phanTram = dl.percent || 0;
      let demText = dl.status === 'uninstalling' ? t('uninstalling') : (dl.status === 'done' ? t('completed') : (dl.status === 'error' ? t('error_status') : t('processing')));

      let mauChu = 'var(--chu-phu)';
      let rutGon = demText;
      if (dl.status === 'uninstalling') { mauChu = 'var(--mau-canh-bao)'; rutGon = phanTram + '%'; }
      else if (dl.status === 'done') { mauChu = 'var(--thanh-cong)'; rutGon = t('completed'); }
      else if (dl.status === 'error') { mauChu = 'var(--nguy-hiem)'; rutGon = t('error_status'); }
      else { mauChu = 'var(--nguy-hiem)'; rutGon = phanTram + '%'; }

      CapNhatHopThoaiTienTrinh(dl.name, phanTram, rutGon, mauChu, demText, dl.status);
    });
  }
});