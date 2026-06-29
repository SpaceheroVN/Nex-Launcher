// ==========================================
// === [ CONFIGURATION & STATE ] ===
// ==========================================
var NgonNguHienTai = 'VN', ChuDeHienTai = 'dark', CaiDatTrangHienTai = 0;
var TienTrinhSoApp = 0, TienTrinhHienTai = 0, TienTrinhAppTruoc = '';
function KhoiTaoNgonNgu() {
  var l = localStorage.getItem('nex_ngon_ngu');
  NgonNguHienTai = l || (navigator.language.startsWith('vi') ? 'VN' : 'EN');
}
function DatNgonNgu(m) { NgonNguHienTai = m; localStorage.setItem('nex_ngon_ngu', m); CapNhatBanDich(); }
function LayNgonNgu() { return NgonNguHienTai; }
function t(k) { return (Languages[NgonNguHienTai] && Languages[NgonNguHienTai][k]) || k; }
function CapNhatBanDich() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.getAttribute('data-i18n'), v = t(k); if (v !== k) el.textContent = v; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) { var k = el.getAttribute('data-i18n-placeholder'), v = t(k); if (v !== k) el.placeholder = v; });
  if (window.DienTu && window.DienTu.CapNhatTrayMenu) {
    window.DienTu.CapNhatTrayMenu(
      t('tray_show'),
      t('tray_installer'),
      t('tray_uninstaller'),
      t('tray_quit')
    ).catch(e => { });
  }
  if (typeof HienThiDanhSachInstaller === 'function' && typeof DanhSachPhanMem !== 'undefined' && DanhSachPhanMem && DanhSachPhanMem.length > 0) {
    HienThiDanhSachInstaller(document.getElementById('o-tim-kiem-installer')?.value || '');
  }
  if (typeof HienThiDanhSachUninstaller === 'function' && typeof DanhSachDaCaiDat !== 'undefined' && DanhSachDaCaiDat && DanhSachDaCaiDat.length > 0) {
    HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
  }
}
function KhoiTaoChuDe() { ChuDeHienTai = localStorage.getItem('nex_chu_de') || 'dark'; ApDungChuDe(ChuDeHienTai); }
let ChuDeKhiMo = '', NgonNguKhiMo = '';
function DatChuDe(c) { ChuDeHienTai = c; localStorage.setItem('nex_chu_de', c); ApDungChuDe(c); }
function LayChuDe() { return ChuDeHienTai; }
function ApDungChuDe(c) {
  var cd = c; if (c === 'system') { cd = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  document.documentElement.setAttribute('data-chu-de', cd);
}
var CacheTimKiemWinget = new Map();
window.IconCache = {};
window.SizeCache = {};
window.DateCache = {};

window.IconDB = null;
const dbReq = indexedDB.open('NexCache', 2);
dbReq.onupgradeneeded = function (e) {
  let db = e.target.result;
  if (!db.objectStoreNames.contains('icons')) {
    db.createObjectStore('icons');
  }
  if (!db.objectStoreNames.contains('dates')) {
    db.createObjectStore('dates');
  }
};
dbReq.onsuccess = function (e) { window.IconDB = e.target.result; };

// ==========================================
// === [ CACHE & STORAGE (IndexedDB) ] ===
// ==========================================
function SaveIconDB(name, b64) {
  if (CauHinh.uninstallerGhiNhoDuLieu === false) return;
  if (!window.IconDB || !b64) return;
  try { window.IconDB.transaction('icons', 'readwrite').objectStore('icons').put(b64, name); } catch (e) { }
}
function GetIconDB(name) {
  return new Promise(function (res) {
    if (CauHinh.uninstallerGhiNhoDuLieu === false) return res(null);
    if (!window.IconDB) return res(null);
    try {
      const req = window.IconDB.transaction('icons', 'readonly').objectStore('icons').get(name);
      req.onsuccess = function () { res(req.result || null); };
      req.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
function SaveDateDB(name, dateStr) {
  if (CauHinh.uninstallerGhiNhoDuLieu === false) return;
  if (!window.IconDB || !dateStr) return;
  try { window.IconDB.transaction('dates', 'readwrite').objectStore('dates').put(dateStr, name); } catch (e) { }
}
function GetDateDB(name) {
  return new Promise(function (res) {
    if (CauHinh.uninstallerGhiNhoDuLieu === false) return res(null);
    if (!window.IconDB) return res(null);
    try {
      const req = window.IconDB.transaction('dates', 'readonly').objectStore('dates').get(name);
      req.onsuccess = function () { res(req.result || null); };
      req.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
var _renderVersion = 0;
// ==========================================
// === [ DATA FETCHING & RENDERING ] ===
// ==========================================
function renderDanhSachChunk(ds, ct, taoHang) {
  var CHUNK = 25, idx = 0, ver = ++_renderVersion;
  function doChunk() {
    if (ver !== _renderVersion) return;
    var frag = document.createDocumentFragment();
    var end = Math.min(idx + CHUNK, ds.length);
    for (; idx < end; idx++) frag.appendChild(taoHang(ds[idx]));
    ct.appendChild(frag);
    if (idx < ds.length) requestAnimationFrame(doChunk);
  }
  requestAnimationFrame(doChunk);
}
window.IconFetchQueue = [];
window.IconFetchActive = 0;
window.IconFetchDeepActive = 0;

window.PushIconQueue = function (name, iconId, priority, isDeep) {
  let idx = window.IconFetchQueue.findIndex(i => i.name === name);
  if (idx !== -1) {
    if (priority < window.IconFetchQueue[idx].priority) {
      window.IconFetchQueue[idx].priority = priority;
      if (isDeep) window.IconFetchQueue[idx].isDeep = true;
      window.IconFetchQueue.sort((a, b) => a.priority - b.priority);
    }
    return;
  }
  window.IconFetchQueue.push({ name, iconId, priority, isDeep: isDeep || false });
  window.IconFetchQueue.sort((a, b) => a.priority - b.priority);
  IconFetchDrain();
};
window.InfoFetchQueue = [];
window.InfoFetchActive = 0;

function InfoFetchDrain() {
  while (window.InfoFetchActive < 2 && window.InfoFetchQueue.length > 0) {
    var item = window.InfoFetchQueue.shift();
    window.InfoFetchActive++;
    (function (it) {
      window.DienTu.LayThongTinThem(it.appName, it.installLocation, it.installDate || null)
        .then(function (info) {
          window.InfoFetchActive--;
          if (info) {
            var pmObj = DanhSachDaCaiDat.find(p => p.name === it.appName);
            if (info.size) { if (pmObj) pmObj.cachedSize = info.size; window.SizeCache[it.appName] = info.size; }
            if (info.date) {
              if (pmObj) pmObj.cachedDate = info.date;
              window.DateCache[it.appName] = info.date;
              SaveDateDB(it.appName, info.date);
            }
            var el = document.querySelector(`[data-app-name="${CSS.escape(it.appName)}"]`);
            if (el) CapNhatThongTinApp(el, it.appName, info);
          }
          InfoFetchDrain();
        })
        .catch(function () {
          window.InfoFetchActive--;
          InfoFetchDrain();
        });
    })(item);
  }
}

function CapNhatThongTinApp(el, appName, info) {
  var format = t('date_format') || 'DD/MM/YYYY';
  if (info.date && el.dataset.needDate === 'true') {
    var dStr = info.date;
    var y = dStr.substring(0, 4), m = dStr.substring(4, 6), day = dStr.substring(6, 8);
    var fDate = format.replace('YYYY', y).replace('MM', m).replace('DD', day);
    var ngayEl = el.querySelector('.HangUngDung_Ngay');
    if (ngayEl) { ngayEl.textContent = fDate; ngayEl.classList.add('ChuUocTinh'); ngayEl.title = t('estimated'); }
  }
  if (info.size && el.dataset.needSize === 'true') {
    var bytes = parseInt(info.size, 10);
    var displaySize = '-';
    if (!isNaN(bytes) && bytes > 0) {
      if (bytes < 1048576) displaySize = (bytes / 1024).toFixed(1) + ' KB';
      else if (bytes < 1073741824) displaySize = (bytes / 1048576).toFixed(1) + ' MB';
      else displaySize = (bytes / 1073741824).toFixed(1) + ' GB';
    } else if (info.size !== '0' && isNaN(bytes)) {
      displaySize = info.size;
    }
    var sizeEl = el.querySelector('.HangUngDung_DungLuong');
    if (sizeEl) { sizeEl.textContent = displaySize; sizeEl.classList.add('ChuUocTinh'); sizeEl.title = t('estimated'); }
  }
}

async function IconFetchDrain() {
  while (window.IconFetchQueue.length > 0) {
    let nextIdx = -1;
    if (window.IconFetchActive < 5) {
      nextIdx = window.IconFetchQueue.findIndex(i => !i.isDeep);
    }
    if (nextIdx === -1 && window.IconFetchDeepActive < 1) {
      nextIdx = window.IconFetchQueue.findIndex(i => i.isDeep);
    }

    if (nextIdx === -1) break;
    var item = window.IconFetchQueue.splice(nextIdx, 1)[0];

    if (window.IconCache[item.name]) {
      var img = document.getElementById(item.iconId);
      if (img && img.src.includes('what_app')) img.src = window.IconCache[item.name];
      var spin = document.getElementById(item.iconId + '-spinner');
      if (spin) spin.style.display = 'none';
      continue;
    }

    var dbIcon = await GetIconDB(item.name);
    if (dbIcon) {
      window.IconCache[item.name] = dbIcon;
      var img = document.getElementById(item.iconId);
      if (img && img.src.includes('what_app')) img.src = dbIcon;
      var spin = document.getElementById(item.iconId + '-spinner');
      if (spin) spin.style.display = 'none';
      continue;
    }

    window.IconFetchActive++;
    if (item.isDeep) window.IconFetchDeepActive++;

    (function (it) {
      window.DienTu.LayIconApp(it.name, it.isDeep).then(function (b64) {
        window.IconFetchActive--;
        if (it.isDeep) window.IconFetchDeepActive--;

        var img = document.getElementById(it.iconId);
        var spin = document.getElementById(it.iconId + '-spinner');

        if (b64) {
          window.IconCache[it.name] = b64;
          SaveIconDB(it.name, b64);
          if (img) img.src = b64;
          if (spin) spin.style.display = 'none';
        } else {
          // Quick scan failed, schedule deep scan
          if (!it.isDeep) {
            window.PushIconQueue(it.name, it.iconId, 2, true); // priority 2, isDeep true
          } else {
            if (img) img.src = 'TaiNguyen/BieuTuong/what_app.svg';
            if (spin) spin.style.display = 'none';
          }
        }
        IconFetchDrain();
      }).catch(function () {
        window.IconFetchActive--;
        if (it.isDeep) window.IconFetchDeepActive--;

        if (!it.isDeep) {
          window.PushIconQueue(it.name, it.iconId, 2, true);
        } else {
          var img = document.getElementById(it.iconId);
          if (img) img.src = 'TaiNguyen/BieuTuong/what_app.svg';
          var spin = document.getElementById(it.iconId + '-spinner');
          if (spin) spin.style.display = 'none';
        }
        IconFetchDrain();
      });
    })(item);
  }
}
(function () {
  var s = document.createElement('style');
  s.textContent = '.TieuDeCot_Cot.bi-khoa { opacity: 0.4; cursor: not-allowed !important; pointer-events: none; } ' +
    '.TieuDeCot_Cot.tang, .TieuDeCot_Cot.giam { text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 2px; } ' +
    '.icon-spinner { animation: icon-rotate 2s linear infinite; transform-origin: 50% 50%; display: flex; align-items: center; justify-content: center; } ' +
    '.icon-path { stroke: var(--mau-nhan, #007BFF); stroke-dasharray: 1, 200; stroke-dashoffset: 0; animation: icon-dash 1.5s ease-in-out infinite; stroke-linecap: round; } ' +
    '@keyframes icon-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } ' +
    '@keyframes icon-dash { 0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; } 100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; } }';
  document.head.appendChild(s);
})();
var DanhSachBatBuoc = [
  { "category": ".NET", "name": ".NET 8.0 (x64)", "source": { "type": "Winget", "value": "Microsoft.DotNet.DesktopRuntime.8" }, "type": "app", "khongSuaXoa": true },
  { "category": ".NET", "name": ".NET 8.0 (x86)", "source": { "silent_args": "--architecture x86", "type": "Winget", "value": "Microsoft.DotNet.DesktopRuntime.8" }, "type": "app", "khongSuaXoa": true },
  { "category": "VC++ Redistributables", "name": "All Visual C++ 2005-2022 Redistributable", "source": { "type": "Winget", "value": "abbodi1406.vcredist" }, "type": "app", "khongSuaXoa": true }
];
var DanhSachPhanMem = [], DanhSachDaCaiDat = [], TrangHienTai = 'installer', BoLocHienTai = 'rec', CotSapXep = 'name', HuongSapXep = true;
// ==========================================
// === [ CORE INITIALIZATION ] ===
// ==========================================
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
    // Clear in-memory caches if disabled
    window.IconCache = {};
    window.DateCache = {};
    window.SizeCache = {};
  }
  HienThiDanhSachUninstaller();
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
      if (dl.status === 'downloading') { mauChu = 'var(--mau-uoc-tinh)'; rutGon = phanTram + '%'; }
      else if (dl.status === 'installing') { mauChu = '#cca000'; rutGon = phanTram + '%'; }
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
      if (dl.status === 'uninstalling') { mauChu = '#cca000'; rutGon = phanTram + '%'; }
      else if (dl.status === 'done') { mauChu = 'var(--thanh-cong)'; rutGon = t('completed'); }
      else if (dl.status === 'error') { mauChu = 'var(--nguy-hiem)'; rutGon = t('error_status'); }
      else { mauChu = 'var(--nguy-hiem)'; rutGon = phanTram + '%'; }

      CapNhatHopThoaiTienTrinh(dl.name, phanTram, rutGon, mauChu, demText, dl.status);
    });
  }
});
// ==========================================
// === [ EVENT LISTENERS & INTERACTION ] ===
// ==========================================
function DangKySuKien() {
  document.getElementById('nut-thu-nho')?.addEventListener('click', function () { window.DienTu?.ThuNho(); });
  document.getElementById('nut-phong-to')?.addEventListener('click', function () { window.DienTu?.PhongTo(); });
  document.getElementById('nut-dong')?.addEventListener('click', function () {
    if (localStorage.getItem('caidat-thu-nho-khay') !== 'false') {
      window.DienTu?.AnCuaSo();
    } else {
      window.DienTu?.DongCuaSo();
    }
  });
  document.getElementById('dong-tien-trinh')?.addEventListener('click', DongHopThoaiTienTrinh);
  async function KiemTraPhongTo() {
    if (window.DienTu && window.DienTu.LayTrangThaiCuaSo) {
      try {
        var dl = await window.DienTu.LayTrangThaiCuaSo();
        document.body.classList.toggle('da-phong-to', dl.DaPhongTo);
        if (typeof CapNhatBoTron === 'function') CapNhatBoTron(dl.DaPhongTo);
        var btnPhongTo = document.getElementById('nut-phong-to');
        if (btnPhongTo) {
          btnPhongTo.title = dl.DaPhongTo ? (typeof t === 'function' ? t('restore_btn') || 'Thu nhỏ lại' : 'Thu nhỏ lại') : (typeof t === 'function' ? t('maximize_btn') || 'Phóng to' : 'Phóng to');
        }
      } catch (e) { console.error(e); }
    }
  }
  window.addEventListener('resize', KiemTraPhongTo);
  setTimeout(KiemTraPhongTo, 200);
  if (window.DienTu?.KhiChuyenTrang) window.DienTu.KhiChuyenTrang(function (trang) { ChuyenTrang(trang); });
  var iconRot = 0;
  document.getElementById('nut-thu-gon-menu')?.addEventListener('click', function () {
    var tb = document.getElementById('thanh-ben');
    if (!tb) return;
    tb.classList.toggle('thu-gon');
    var icon = document.getElementById('icon-thu-gon');
    if (icon) {
      iconRot -= 180;
      icon.style.transform = 'rotate(' + iconRot + 'deg)';
    }
  });
  var tbInit = document.getElementById('thanh-ben');
  var iconInit = document.getElementById('icon-thu-gon');
  if (tbInit && iconInit) {
    if (tbInit.classList.contains('thu-gon')) {
      iconRot = -180;
      iconInit.style.transform = 'rotate(' + iconRot + 'deg)';
    }
  }
  var NutMenu = document.getElementById('nut-menu-chinh'), MenuDD = document.getElementById('menu-dropdown');
  if (NutMenu && MenuDD) {
    NutMenu.addEventListener('click', function (e) { e.stopPropagation(); MenuDD.classList.toggle('an'); });
    document.addEventListener('click', function () { MenuDD.classList.add('an'); });
  }
  document.getElementById('menu-cai-dat')?.addEventListener('click', function () { MenuDD.classList.add('an'); MoHopThoaiCaiDat(); });
  document.getElementById('menu-gioi-thieu')?.addEventListener('click', function () { MenuDD.classList.add('an'); BatTatHopThoai('hop-thoai-gioi-thieu', true); });
  document.getElementById('menu-cap-nhat')?.addEventListener('click', function () { MenuDD.classList.add('an'); KiemTraCapNhat(false); });
  document.getElementById('nut-cap-nhat-nhanh')?.addEventListener('click', function () { KiemTraCapNhat(false); });
  document.getElementById('dong-gioi-thieu')?.addEventListener('click', function () { BatTatHopThoai('hop-thoai-gioi-thieu', false); });
  document.querySelector('.HopThoai_LienKet')?.addEventListener('click', function (e) {
    e.preventDefault();
    if (window.DienTu && window.DienTu.MoLienKet) window.DienTu.MoLienKet(this.href);
  });
  document.getElementById('dong-cai-dat')?.addEventListener('click', function () { BatTatHopThoai('hop-thoai-cai-dat', false); });
  document.getElementById('caidat-huy')?.addEventListener('click', function () { BatTatHopThoai('hop-thoai-cai-dat', false); });
  document.getElementById('lop-phu-modal')?.addEventListener('click', function () {
    document.querySelectorAll('.HopThoai:not(.an)').forEach(function (h) { h.classList.add('an'); });
    document.getElementById('lop-phu-modal')?.classList.add('an');
  });
  document.getElementById('nav-installer')?.addEventListener('click', function () { ChuyenTrang('installer'); });
  document.getElementById('nav-uninstaller')?.addEventListener('click', function () { ChuyenTrang('uninstaller'); });
  document.getElementById('nav-tien-ich')?.addEventListener('click', function () { ChuyenTrang('tien-ich'); });
  document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function (n) {
    n.addEventListener('click', function () {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'installer') return;
      BoLocHienTai = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function (m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); HienThiDanhSachInstaller();
    });
  });
  document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function (n) {
    n.addEventListener('click', function () {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'uninstaller') return;
      var bl = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function (m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); LocDanhSachUninstaller(bl);
    });
  });
  document.querySelectorAll('#ds-tien-ich .ThanhBen_MucCon').forEach(function (n) {
    n.addEventListener('click', function () {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'tien-ich') return;
      document.querySelectorAll('#ds-tien-ich .ThanhBen_MucCon').forEach(function (m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon');
      let boLoc = n.getAttribute('data-bo-loc');
      if (document.getElementById('tab-du-lieu')) {
        document.getElementById('tab-du-lieu').style.display = (boLoc === 'du-lieu') ? 'flex' : 'none';
      }
      if (document.getElementById('tab-khoa-chuot')) {
        document.getElementById('tab-khoa-chuot').style.display = (boLoc === 'khoa-chuot') ? 'block' : 'none';
      }
    });
  });
  document.getElementById('o-tim-kiem-installer')?.addEventListener('input', function (e) { HienThiDanhSachInstaller(e.target.value); });
  document.getElementById('o-tim-kiem-uninstaller')?.addEventListener('input', function (e) { HienThiDanhSachUninstaller(e.target.value); });
  document.getElementById('chon-tat-ca-installer')?.addEventListener('change', function (e) {
    document.querySelectorAll('#danh-sach-installer .OChon').forEach(function (cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
    CapNhatNutDongGoi();
  });
  document.getElementById('chon-tat-ca-uninstaller')?.addEventListener('change', function (e) {
    document.querySelectorAll('#danh-sach-uninstaller .OChon').forEach(function (cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
    CapNhatSoLuongDaChon();
  });
  document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function (c) {
    c.addEventListener('click', function () {
      if (document.getElementById('chon-tat-ca-installer')) document.getElementById('chon-tat-ca-installer').checked = false;
      if (this.classList.contains('bi-khoa')) return;
      var tr = c.getAttribute('data-sap-xep');
      if (CotSapXep === tr) HuongSapXep = !HuongSapXep; else { CotSapXep = tr; HuongSapXep = true; }
      document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function (x) { x.classList.remove('tang', 'giam'); });
      c.classList.add(HuongSapXep ? 'tang' : 'giam');
      if (TrangHienTai === 'installer') {
        HienThiDanhSachInstaller();
      } else if (TrangHienTai === 'uninstaller') {
        var tabActive = document.querySelector('#ds-uninstaller .ThanhBen_MucCon.dang-chon');
        var blActive = tabActive ? tabActive.getAttribute('data-bo-loc') : 'all';
        if (blActive === 'all') HienThiDanhSachUninstaller();
        else LocDanhSachUninstaller(blActive);
      }
    });
  });
  var DangXuLyCaiDat = false;
  document.getElementById('nut-dong-goi')?.addEventListener('click', function () {
    let msg = t('feature_dev');
    HienThongBao(msg, 'canh-bao');
  });
  document.getElementById('nut-cai-dat')?.addEventListener('click', async function () {
    if (DangXuLyCaiDat) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    var danhSachChon = [];
    if (BoLocHienTai === 'updates') {
      dc.forEach(function (cb) {
        danhSachChon.push({ id: cb.getAttribute('data-id'), name: cb.getAttribute('data-ten') });
      });
    } else {
      dc.forEach(function (cb) {
        var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
        var pm = DanhSachPhanMem.find(p => p.name === ten) || DanhSachBatBuoc.find(p => p.name === ten);
        if (pm) danhSachChon.push(pm);
      });
    }
    if (danhSachChon.length === 0) return;
    let expandedDanhSach = [];
    for (let p of danhSachChon) {
      if (p.name.includes("All Visual C++") && p.name.includes("Redistributable")) {
        expandedDanhSach.push(
          { name: "Visual C++ 2005_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2005.x86", silent_args: "" } },
          { name: "Visual C++ 2005_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2005.x64", silent_args: "" } },
          { name: "Visual C++ 2008_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2008.x86", silent_args: "" } },
          { name: "Visual C++ 2008_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2008.x64", silent_args: "" } },
          { name: "Visual C++ 2010_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2010.x86", silent_args: "" } },
          { name: "Visual C++ 2010_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2010.x64", silent_args: "" } },
          { name: "Visual C++ 2012_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2012.x86", silent_args: "", post_install_cmd: "Get-ItemProperty 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Visual C\\+\\+ 2012' } | Remove-ItemProperty -Name SystemComponent -ErrorAction SilentlyContinue" } },
          { name: "Visual C++ 2012_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2012.x64", silent_args: "", post_install_cmd: "Get-ItemProperty 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Visual C\\+\\+ 2012' } | Remove-ItemProperty -Name SystemComponent -ErrorAction SilentlyContinue" } },
          { name: "Visual C++ 2013_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2013.x86", silent_args: "", post_install_cmd: "Get-ItemProperty 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Visual C\\+\\+ 2013' } | Remove-ItemProperty -Name SystemComponent -ErrorAction SilentlyContinue" } },
          { name: "Visual C++ 2013_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2013.x64", silent_args: "", post_install_cmd: "Get-ItemProperty 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Visual C\\+\\+ 2013' } | Remove-ItemProperty -Name SystemComponent -ErrorAction SilentlyContinue" } },
          { name: "Visual C++ 2015-2022_x86", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2015+.x86", silent_args: "" } },
          { name: "Visual C++ 2015-2022_x64", type: "app", source: { type: "Winget", value: "Microsoft.VCRedist.2015+.x64", silent_args: "" } }
        );
      } else {
        expandedDanhSach.push(p);
      }
    }
    danhSachChon = expandedDanhSach;
    let isCfm = true;
    if (CauHinh.installerHoiXacNhan !== false) {
      let cfmMsg = t('confirm_install_apps') ? t('confirm_install_apps').replace('{0}', danhSachChon.length) : "Bạn có chắc chắn muốn bắt đầu cài đặt " + danhSachChon.length + " phần mềm đã chọn không?";
      isCfm = await HienHopThoaiXacNhanCustom(cfmMsg, t('install_btn') || 'Cài đặt', danhSachChon);
    }
    if (!isCfm) return;
    if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
      window.DienTu.ThayDoiUuTienCPU(true);
    }
    DangXuLyCaiDat = true;
    TienTrinhSoApp = danhSachChon.length;
    TienTrinhHienTai = 0;
    TienTrinhAppTruoc = '';
    if (CauHinh.chungHienTienTrinh) {
      MoHopThoaiTienTrinh(t('installing') + '...', danhSachChon);
    }
    try {
      var ketQua = await window.DienTu.TienHanhCaiDat(danhSachChon, {
        showProgress: CauHinh.chungHienTienTrinh
      });
      if (ketQua) {
        var thanhCong = ketQua.filter(k => k.success).length;
        if (CauHinh.chungHienThongBao) {
          HienThongBao(t('finish_installing') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
        }
        if (thanhCong > 0) window.YeuCauLamMoiUninstaller = true;
      }
    } finally {
      HoanTatHopThoaiTienTrinh(ketQua);
      DangXuLyCaiDat = false;
      if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
        window.DienTu.ThayDoiUuTienCPU(false);
      }
    }
  });
  var DangLamMoi = false;
  document.getElementById('nut-lam-moi')?.addEventListener('click', async function () {
    if (DangLamMoi) { HienThongBao(t('slow_down'), 'canh-bao'); return; }
    DangLamMoi = true;
    var btn = this; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none';
    HienThongBao(t('refreshing_list'), 'thong-tin');
    let dsMoi = await window.DienTu.LayPhanMemDaCai();
    let daThayDoi = false;
    let tenCu = new Set(DanhSachDaCaiDat.map(p => p.name));
    let tenMoi = new Set(dsMoi.map(p => p.name));
    let xoa = DanhSachDaCaiDat.filter(p => !tenMoi.has(p.name));
    let them = dsMoi.filter(p => !tenCu.has(p.name));
    if (xoa.length > 0 || them.length > 0) {
      daThayDoi = true;
      DanhSachDaCaiDat = dsMoi;
      HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
      HienThongBao(t('list_refreshed'), 'thanh-cong');
    } else {
      HienThongBao(t('no_changes'), 'thong-tin');
    }
    setTimeout(() => { DangLamMoi = false; btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }, 2000);
  });
  var DangXuLyGoCaiDat = false;
  document.getElementById('nut-go-cai-dat')?.addEventListener('click', async function () {
    if (DangXuLyGoCaiDat) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    var danhSachChon = [];
    dc.forEach(function (cb) {
      var ten = cb.dataset.ten;
      var pm = DanhSachDaCaiDat.find(p => p.name === ten);
      if (pm) danhSachChon.push(pm);
    });
    let goCaiDatOptions = {
      silent: CauHinh.chungDaLuong,
      showProgress: CauHinh.chungHienTienTrinh,
      taoDiemKhoiPhuc: false,
      tenDiemKhoiPhuc: null
    };

    if (CauHinh.uninstallerHoiXacNhan) {
      let xacNhan = await HienThiXacNhanGoCaiDat(danhSachChon);
      if (!xacNhan) {
        DangXuLyGoCaiDat = false;
        return;
      }
      let chkRestore = document.getElementById('chk-tao-diem-khoi-phuc');
      if (chkRestore && chkRestore.checked) {
        goCaiDatOptions.taoDiemKhoiPhuc = true;
        let dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        let n = 1;
        let savedDate = localStorage.getItem('restore_point_date');
        if (savedDate === dateStr) {
          n = parseInt(localStorage.getItem('restore_point_n') || '0', 10) + 1;
        }
        localStorage.setItem('restore_point_date', dateStr);
        localStorage.setItem('restore_point_n', n);
        goCaiDatOptions.tenDiemKhoiPhuc = `Nex Launcher - ${dateStr} : ${n}`;
      }
      let chkCleanup = document.getElementById('chk-don-tep-thua');
      if (chkCleanup && chkCleanup.checked) {
        goCaiDatOptions.loaiBoFileThua = true;
      }
    }

    if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
      window.DienTu.ThayDoiUuTienCPU(true);
    }
    DangXuLyGoCaiDat = true;
    TienTrinhSoApp = danhSachChon.length;
    TienTrinhHienTai = 0;
    TienTrinhAppTruoc = '';
    localStorage.setItem('uninstall_opts', JSON.stringify({
      taoDiemLuu: goCaiDatOptions.taoDiemKhoiPhuc || false,
      xoaTanDu: goCaiDatOptions.loaiBoFileThua || false,
      tenDiemLuu: goCaiDatOptions.tenDiemKhoiPhuc || null
    }));
    if (CauHinh.chungHienTienTrinh) {
      MoHopThoaiTienTrinh(t('uninstalling'), danhSachChon);
    }
    if (goCaiDatOptions.taoDiemKhoiPhuc && window.DienTu && window.DienTu.TaoDiemKhoiPhuc) {
      window.CurrentGlobalStage = 'rs';

      let newRpContainer = document.getElementById('diem-khoi-phuc-moi');
      if (newRpContainer) {
        let rpName = goCaiDatOptions.tenDiemKhoiPhuc || "Nex Launcher Restore Point";
        newRpContainer.innerHTML = `
              <div style="padding: 16px; background: var(--nen-tang2); border: 1px solid var(--vien); border-radius: var(--do-bo); display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                      <span style="font-weight: 600; font-size: 1.05rem; color: var(--chu-chinh);">${rpName}</span>
                      <span style="font-size: 0.85rem; color: var(--chu-phu);">Đang tiến hành tạo điểm khôi phục...</span>
                  </div>
                  <button id="btn-skip-rs" class="Nut Nut--Huy" style="padding: 6px 12px; font-size: 0.9rem;">Bỏ qua</button>
              </div>
          `;
        document.getElementById('btn-skip-rs').addEventListener('click', () => {
          if (window.ResolveSkipRS) window.ResolveSkipRS();
        });
      }

      let rsPromise = window.DienTu.TaoDiemKhoiPhuc(goCaiDatOptions.tenDiemKhoiPhuc || "Nex Launcher Restore Point");
      TaiDanhSachDiemKhoiPhucCu(); // Fetch old ones in background
      await Promise.race([rsPromise, new Promise(r => window.ResolveSkipRS = r)]);
    }
    window.CurrentGlobalStage = 'un';

    try {
      var ketQua = await window.DienTu.TienHanhGoCaiDat(danhSachChon, goCaiDatOptions);
      if (ketQua) {
        var thanhCong = ketQua.filter(k => k.success).length;

        let allLeftovers = [];
        if (goCaiDatOptions.loaiBoFileThua && window.DienTu && window.DienTu.QuetTanDuPhanMem) {
          let dsThanhCong = ketQua.filter(k => k.success).map(k => danhSachChon.find(d => d.name === k.name)).filter(Boolean);
          if (dsThanhCong.length > 0) {
            window.CurrentGlobalStage = 'cl';
            allLeftovers = await window.DienTu.QuetTanDuPhanMem(dsThanhCong);
          }
        }

        HoanTatHopThoaiTienTrinh(ketQua, allLeftovers.length > 0);
        if (!allLeftovers.length) {
          await new Promise(resolve => {
            let btn = document.getElementById('dong-tien-trinh');
            if (!btn) { resolve(); return; }
            let handler = () => {
              btn.removeEventListener('click', handler);
              resolve();
            };
            btn.addEventListener('click', handler);
          });
        }
        if (allLeftovers.length > 0) {
          await HienThiTanDuTrongTienTrinh(allLeftovers);
        }

        if (CauHinh.chungHienThongBao) {
          HienThongBao(t('finish_uninstalling') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
        }
        let dsMoi = await window.DienTu.LayPhanMemDaCai();
        DanhSachDaCaiDat = dsMoi;
        HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
      }
    } finally {
      DangXuLyGoCaiDat = false;
      localStorage.removeItem('uninstall_opts');
      if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
        window.DienTu.ThayDoiUuTienCPU(false);
      }
    }
  });
  window.MoHopThoaiSuaPhanMem = function (tenPm) {
    let pm = DanhSachPhanMem.find(p => p.name === tenPm);
    if (!pm) return;
    let btnLuu = document.getElementById('luu-them-app');
    if (btnLuu) {
      btnLuu.dataset.editMode = 'true';
      btnLuu.dataset.oldName = tenPm;
      let spanBtnLuu = btnLuu.querySelector('span');
      if (spanBtnLuu) spanBtnLuu.textContent = t('confirm_btn');
      let svgBtnLuu = btnLuu.querySelector('svg');
      if (svgBtnLuu) svgBtnLuu.style.display = 'none';
    }
    document.getElementById('them-app-tieu-de').textContent = t('edit_software_title');
    document.getElementById('them-app-ten').value = pm.name || "";
    document.getElementById('them-app-loai').value = pm.category || "";
    document.getElementById('them-app-id').value = pm.source?.value || "";
    if (document.getElementById('them-app-tham-so')) {
      document.getElementById('them-app-tham-so').value = pm.source?.silent_args || "";
    }
    let kieu = pm.source?.type || "Winget";
    let elKieu = document.getElementById('them-app-kieu-nguon');
    if (elKieu) {
      elKieu.dataset.value = kieu;
      elKieu.querySelector('.NhanText').textContent = kieu === 'Link' ? 'Link (.exe/.msi)' : (kieu === 'Store' ? 'MS Store' : 'Winget');
      let timBtn = document.getElementById('btn-tim-winget');
      if (timBtn) timBtn.style.display = kieu === 'Winget' ? 'flex' : 'none';
    }
    document.getElementById('hop-thoai-them-app')?.classList.remove('an');
    document.getElementById('lop-phu-modal')?.classList.remove('an');
  };
  document.getElementById('nut-them-moi')?.addEventListener('click', function () {
    if (this.dataset.isRefresh === 'true') {
      HienThiDanhSachInstaller(document.getElementById('o-tim-kiem-installer')?.value, true);
      return;
    }
    var modal = document.getElementById('hop-thoai-them-app');
    var lopPhu = document.getElementById('lop-phu-modal');
    if (modal && lopPhu) {
      document.getElementById('them-app-tieu-de').textContent = t('add_software_title');
      document.getElementById('them-app-ten').value = '';
      document.getElementById('them-app-loai').value = '';
      document.getElementById('them-app-id').value = '';
      if (document.getElementById('them-app-tham-so')) document.getElementById('them-app-tham-so').value = '';
      let btnLuu = document.getElementById('luu-them-app');
      if (btnLuu) {
        btnLuu.dataset.editMode = 'false';
        let spanBtnLuu = btnLuu.querySelector('span');
        if (spanBtnLuu) spanBtnLuu.textContent = t('add_btn');
        let svgBtnLuu = btnLuu.querySelector('svg');
        if (svgBtnLuu) svgBtnLuu.style.display = '';
      }
      modal.classList.remove('an');
      lopPhu.classList.remove('an');
    }
  });
  document.getElementById('dong-them-app')?.addEventListener('click', function () {
    document.getElementById('hop-thoai-them-app')?.classList.add('an');
    document.getElementById('lop-phu-modal')?.classList.add('an');
  });
  document.getElementById('luu-them-app')?.addEventListener('click', async function () {
    var ten = document.getElementById('them-app-ten').value.trim();
    var loai = document.getElementById('them-app-loai').value.trim();
    var id = document.getElementById('them-app-id').value.trim();
    var kieu = document.getElementById('them-app-kieu-nguon').dataset.value;
    if (!ten || !id) {
      HienThongBao(t('enter_name_id'), 'canh-bao');
      return;
    }
    var appInfo = {
      name: ten,
      type: "app",
      category: loai || "Utilities",
      source: { type: kieu, value: id, silent_args: document.getElementById('them-app-tham-so') ? document.getElementById('them-app-tham-so').value.trim() : "" }
    };
    let isEdit = this.dataset.editMode === 'true';
    let oldName = this.dataset.oldName;
    var success;
    if (isEdit && oldName) {
      success = await window.DienTu.SuaUngDungInstaller(oldName, appInfo);
    } else {
      success = await window.DienTu.ThemUngDungInstaller(appInfo);
    }
    if (success) {
      document.getElementById('hop-thoai-them-app')?.classList.add('an');
      document.getElementById('lop-phu-modal')?.classList.add('an');
      DanhSachPhanMem = await window.DienTu.LayDanhSachUngDung();
      HienThiDanhSachInstaller();
      HienThongBao(t('added_app') + ten, 'thanh-cong');
    } else {
      HienThongBao(t('error_saving'), 'canh-bao');
    }
  });
  async function ThucHienTimKiemWinget(tuKhoa, boQuaCache = false) {
    let listEl = document.getElementById('tim-winget-danh-sach');
    let statusEl = document.getElementById('tim-winget-trang-thai');
    statusEl.textContent = t('searching_winget');
    listEl.innerHTML = '';
    if (!boQuaCache && CacheTimKiemWinget.has(tuKhoa)) {
      let cachedResult = CacheTimKiemWinget.get(tuKhoa);
      CacheTimKiemWinget.delete(tuKhoa);
      CacheTimKiemWinget.set(tuKhoa, cachedResult);
      HienThiKetQuaTimKiemWinget(cachedResult);
      return;
    }
    var result = await window.DienTu.TimKiemWinget(tuKhoa);
    if (result) {
      CacheTimKiemWinget.set(tuKhoa, result);
      if (CacheTimKiemWinget.size > 20) {
        CacheTimKiemWinget.delete(CacheTimKiemWinget.keys().next().value);
      }
      HienThiKetQuaTimKiemWinget(result);
    } else {
      statusEl.textContent = t('no_results_winget');
    }
  }
  function HienThiKetQuaTimKiemWinget(ketQua) {
    let listEl = document.getElementById('tim-winget-danh-sach');
    let statusEl = document.getElementById('tim-winget-trang-thai');
    if (!ketQua || ketQua.length === 0) {
      statusEl.textContent = t('no_results_winget');
      listEl.innerHTML = '';
      return;
    }
    statusEl.textContent = t('found_results').replace('{0}', ketQua.length);
    listEl.innerHTML = '';
    ketQua.forEach(app => {
      let div = document.createElement('div');
      div.className = 'CustomSelect_Item';
      div.style.padding = '16px 20px';
      div.style.border = '1px solid var(--vien)';
      div.style.borderRadius = 'var(--do-bo)';
      div.style.cursor = 'pointer';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.gap = '6px';
      let nameEl = document.createElement('div');
      nameEl.style.fontWeight = '600';
      nameEl.style.fontSize = '1.071rem';
      nameEl.style.color = 'var(--chu-chinh)';
      nameEl.textContent = app.name;
      let idEl = document.createElement('div');
      idEl.style.fontSize = '0.929rem';
      idEl.style.color = 'var(--chu-phu)';
      idEl.textContent = app.id;
      div.appendChild(nameEl);
      div.appendChild(idEl);
      div.addEventListener('click', function () {
        document.getElementById('them-app-id').value = app.id;
        document.getElementById('them-app-ten').value = app.name || '';
        var kn = document.getElementById('them-app-kieu-nguon');
        kn.dataset.value = 'Winget';
        kn.querySelector('.NhanText').textContent = 'Winget';
        document.getElementById('btn-tim-winget').style.display = 'flex';
        document.getElementById('hop-thoai-tim-winget')?.classList.add('an');
      });
      listEl.appendChild(div);
    });
  }
  document.getElementById('btn-tim-winget')?.addEventListener('click', function () {
    var tuKhoa = document.getElementById('them-app-id').value.trim() || document.getElementById('them-app-ten').value.trim();
    if (!tuKhoa) {
      HienThongBao(t('enter_name_keyword'), 'canh-bao');
      return;
    }
    let prefix = t('search_winget_title_prefix');
    document.getElementById('tim-winget-tieu-de').textContent = prefix + tuKhoa;
    BatTatHopThoai('hop-thoai-tim-winget', true);
    document.getElementById('hop-thoai-tim-winget').dataset.tuKhoa = tuKhoa;
    ThucHienTimKiemWinget(tuKhoa, false);
  });
  document.getElementById('btn-chon-file-cai-dat')?.addEventListener('click', async function () {
    try {
      const { open } = window.__TAURI__.dialog;
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Installer',
          extensions: ['exe', 'msi']
        }]
      });
      if (selected) {
        document.getElementById('them-app-id').value = selected;
      }
    } catch (e) {
      console.error(e);
    }
  });
  document.getElementById('lam-moi-tim-winget')?.addEventListener('click', function () {
    var tuKhoa = document.getElementById('hop-thoai-tim-winget').dataset.tuKhoa;
    if (tuKhoa) {
      ThucHienTimKiemWinget(tuKhoa, true);
    }
  });
  document.getElementById('dong-tim-winget')?.addEventListener('click', function () {
    document.getElementById('hop-thoai-tim-winget')?.classList.add('an');
  });
  document.getElementById('dong-tim-winget-x')?.addEventListener('click', function () {
    document.getElementById('hop-thoai-tim-winget')?.classList.add('an');
  });
  document.getElementById('nut-xoa-chon')?.addEventListener('click', async function () {
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked:not([data-undeletable="true"])');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    var danhSachTen = [];
    dc.forEach(function (cb) {
      var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
      if (ten) danhSachTen.push(ten);
    });
    if (confirm(t('confirm_remove_apps').replace('{0}', danhSachTen.length))) {
      var success = await window.DienTu.XoaUngDungInstaller(danhSachTen);
      if (success) {
        DanhSachPhanMem = await window.DienTu.LayDanhSachUngDung();
        HienThiDanhSachInstaller();
        HienThongBao(t('successfully_removed'), 'thanh-cong');
      } else {
        HienThongBao(t('error_removing'), 'canh-bao');
      }
    }
  });
}
function ChuyenTrang(trang) {
  TrangHienTai = trang;
  document.querySelectorAll('.Trang').forEach(function (t) { t.classList.remove('dang-hien'); });
  document.getElementById('trang-' + trang)?.classList.add('dang-hien');
  var ni = document.getElementById('nav-installer'), nu = document.getElementById('nav-uninstaller'), nti = document.getElementById('nav-tien-ich');
  var di = document.getElementById('ds-installer'), du = document.getElementById('ds-uninstaller'), dti = document.getElementById('ds-tien-ich');
  ni?.classList.toggle('dang-chon', trang === 'installer'); ni?.classList.toggle('dang-mo', trang === 'installer');
  nu?.classList.toggle('dang-chon', trang === 'uninstaller'); nu?.classList.toggle('dang-mo', trang === 'uninstaller');
  nti?.classList.toggle('dang-chon', trang === 'tien-ich'); nti?.classList.toggle('dang-chon', trang === 'tien-ich'); nti?.classList.toggle('dang-mo', trang === 'tien-ich');
  di?.classList.toggle('dang-mo', trang === 'installer'); du?.classList.toggle('dang-mo', trang === 'uninstaller'); dti?.classList.toggle('dang-mo', trang === 'tien-ich');
  if (trang === 'uninstaller') {
    var m = du?.querySelector('.ThanhBen_MucCon');
    if (m && !du.querySelector('.dang-chon')) m.classList.add('dang-chon');
    if (typeof YeuCauLamMoiUninstaller !== 'undefined' && YeuCauLamMoiUninstaller) {
      YeuCauLamMoiUninstaller = false;
      if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) window.DienTu.ThayDoiUuTienCPU(true);
      window.DienTu.LayPhanMemDaCai().then(dsMoi => {
        DanhSachDaCaiDat = dsMoi;
        HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
      }).finally(() => {
        if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) window.DienTu.ThayDoiUuTienCPU(false);
      });
    }
  }
  if (trang === 'tien-ich') { var mt = dti?.querySelector('.ThanhBen_MucCon'); if (mt && !dti.querySelector('.dang-chon')) mt.classList.add('dang-chon'); }
}
let CacheCapNhat = null;
let TrangThaiQuetCapNhat = false;
function HienThiDanhSachInstaller(TuKhoa, isRefresh) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-installer'); if (!ct) return; ct.innerHTML = '';
  var ds = DanhSachPhanMem.slice().filter(p => !p.delete);
  let nutThemMoi = document.getElementById('nut-them-moi');
  if (nutThemMoi) {
    let span = nutThemMoi.querySelector('span');
    let svg = nutThemMoi.querySelector('svg');
    if (BoLocHienTai === 'updates') {
      if (span) span.textContent = t('refresh_btn');
      if (svg) svg.innerHTML = '<path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>';
      nutThemMoi.dataset.isRefresh = 'true';
    } else {
      if (span) span.textContent = t('add_btn');
      if (svg) svg.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
      nutThemMoi.dataset.isRefresh = 'false';
    }
  }
  if (BoLocHienTai === 'apps') ds = ds.filter(function (p) { return p.type === 'app'; });
  else if (BoLocHienTai === 'games') ds = ds.filter(function (p) { return p.type === 'game'; });
  else if (BoLocHienTai === 'rec') {
    let danhSachDeXuat = ds.filter(function (p) {
      return p.recommended === true && p.category !== '.NET' && p.category !== 'VC++ Redistributables';
    });
    ds = DanhSachBatBuoc.concat(danhSachDeXuat);
  }
  const cotPhienBan = document.getElementById('cot-phien-ban');
  const lblCategory = document.getElementById('lbl-header-category');
  if (BoLocHienTai === 'updates') {
    let nutCaiDatSpan = document.getElementById('nut-cai-dat')?.querySelector('span');
    if (nutCaiDatSpan) nutCaiDatSpan.textContent = t('btn_update');
    if (cotPhienBan) cotPhienBan.style.display = 'flex';
    if (lblCategory) lblCategory.textContent = 'ID';
    if (isRefresh) {
      CacheCapNhat = null;
    }
    if (CacheCapNhat !== null) {
      if (CacheCapNhat.length === 0) {
        ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('software_up_to_date') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_updates_found') + '</div></div>';
        CapNhatNutDongGoi(); return;
      }
      ct.innerHTML = '';
      CacheCapNhat.forEach(pm => {
        ct.appendChild(TaoHangCapNhat(pm));
      });
      CapNhatNutDongGoi();
      return;
    }
    if (TrangThaiQuetCapNhat) {
      ct.innerHTML = '<div class="KhongCoKetQua"><div class="KhongCoKetQua_MoTa">' + t('scanning_updates') + '</div></div>';
      return;
    }
    ct.innerHTML = '<div class="KhongCoKetQua"><div class="KhongCoKetQua_MoTa">' + t('scanning_updates') + '</div></div>';
    if (window.DienTu && window.DienTu.KiemTraCapNhat) {
      TrangThaiQuetCapNhat = true;
      window.DienTu.KiemTraCapNhat().then(results => {
        TrangThaiQuetCapNhat = false;
        if (!results) results = [];
        CacheCapNhat = results;
        if (BoLocHienTai !== 'updates') return;
        if (results.length === 0) {
          ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('software_up_to_date') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_updates_found') + '</div></div>';
          CapNhatNutDongGoi(); return;
        }
        ct.innerHTML = '';
        results.forEach(pm => {
          ct.appendChild(TaoHangCapNhat(pm));
        });
        CapNhatNutDongGoi();
      }).catch(err => {
        TrangThaiQuetCapNhat = false;
        if (BoLocHienTai !== 'updates') return;
        ct.innerHTML = '<div class="KhongCoKetQua"><div class="KhongCoKetQua_TieuDe">' + t('software_up_to_date') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_updates_found') + '</div></div>';
        CapNhatNutDongGoi();
      });
    }
    return;
  }
  if (BoLocHienTai !== 'updates') {
    const cotPhienBan = document.getElementById('cot-phien-ban');
    const lblCategory = document.getElementById('lbl-header-category');
    if (cotPhienBan) cotPhienBan.style.display = 'none';
    if (lblCategory) lblCategory.textContent = t('header_category') || 'Thể loại';
  }
  let nutCaiDatSpan = document.getElementById('nut-cai-dat')?.querySelector('span');
  if (nutCaiDatSpan) nutCaiDatSpan.textContent = t('install_btn');
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function (p) { return p.name.toLowerCase().includes(tk) || p.category.toLowerCase().includes(tk); }); }
  ds.sort(function (a, b) { var gA, gB; switch (CotSapXep) { case 'category': gA = a.category; gB = b.category; break; case 'source': gA = a.source.type; gB = b.source.type; break; default: gA = a.name; gB = b.name; } return (HuongSapXep ? 1 : -1) * gA.localeCompare(gB, undefined, { numeric: true }); });
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_results') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_results_desc') + '</div></div>'; CapNhatNutDongGoi(); return; }
  ds.forEach(function (pm) { ct.appendChild(TaoHangInstaller(pm)); });
  CapNhatNutDongGoi();
}
function TaoHangInstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  if (pm.source && pm.source.type) {
    let catName = pm.category;
    if (catName === 'Web Browsers') catName = t('cat_web_browsers') || 'Trình duyệt web';
    else if (catName === 'Developer Tools') catName = t('cat_dev_tools') || 'Công cụ lập trình';
    else if (catName === 'Media') catName = t('cat_media') || 'Đa phương tiện';
    else if (catName === 'Games') catName = t('cat_games') || 'Trò chơi';
    else if (catName === 'Utilities') catName = t('cat_utilities') || 'Tiện ích';
    else if (catName === 'Messaging') catName = t('cat_messaging') || 'Nhắn tin';
    else if (catName === 'Compression') catName = t('cat_compression') || 'Nén dữ liệu';

    let editBtn = pm.khongSuaXoa === true ? '' : '<button class="NutSuaNho" title="' + t('edit_btn') + '" onclick="event.stopPropagation(); window.MoHopThoaiSuaPhanMem(\'' + pm.name.replace(/'/g, "\\'") + '\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>';
    d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name + '" ' + (pm.khongSuaXoa === true ? 'data-undeletable="true"' : '') + '></div><div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_Loai"><span>' + catName + '</span></div><div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--' + pm.source.type.toLowerCase() + '">' + pm.source.type + '</span>' + editBtn + '</div>';
  }
  d.addEventListener('click', function (e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatNutDongGoi(); } });
  d.querySelector('.OChon')?.addEventListener('change', function () { d.classList.toggle('da-chon', this.checked); CapNhatNutDongGoi(); });
  return d;
}
function TaoHangCapNhat(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name + '" data-id="' + pm.id + '"></div>'
    + '<div class="HangUngDung_Ten">' + pm.name + '</div>'
    + '<div class="HangUngDung_Loai"><span style="font-size:0.8em;color:var(--chu-phu);">' + pm.id + '</span></div>'
    + '<div class="HangUngDung_NhaPhatHanh">' + (pm.current && pm.available ? '<span style="display:inline-block; font-size:0.786rem; font-weight:600; padding:3px 8px; border-radius:var(--do-bo-lon); background-color:var(--nen-tang3); color:var(--chu-phu);">' + pm.current + ' &rarr; <span style="color:var(--thanh-cong); font-weight:700;">' + pm.available + '</span></span>' : '') + '</div>'
    + '<div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--winget">Winget</span></div>';
  d.addEventListener('click', function (e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatNutDongGoi(); } });
  d.querySelector('.OChon')?.addEventListener('change', function () { d.classList.toggle('da-chon', this.checked); CapNhatNutDongGoi(); });
  return d;
}
function CapNhatNutDongGoi() {
  const checkedCount = document.querySelectorAll('#danh-sach-installer .OChon:checked').length;
  const nutDongGoi = document.getElementById('nut-dong-goi');
  if (nutDongGoi) {
    nutDongGoi.style.display = checkedCount >= 2 ? '' : 'none';
  }
  const nutCaiDat = document.getElementById('nut-cai-dat');
  if (nutCaiDat) {
    if (checkedCount > 0) {
      nutCaiDat.disabled = false;
      nutCaiDat.style.opacity = '1';
      nutCaiDat.style.cursor = 'pointer';
    } else {
      nutCaiDat.disabled = true;
      nutCaiDat.style.opacity = '0.5';
      nutCaiDat.style.cursor = 'not-allowed';
    }
  }
  const nutXoaChon = document.getElementById('nut-xoa-chon');
  if (nutXoaChon) {
    if (BoLocHienTai === 'updates') {
      nutXoaChon.style.display = 'none';
    } else {
      nutXoaChon.style.display = '';
      if (checkedCount > 0) {
        nutXoaChon.disabled = false;
        nutXoaChon.style.opacity = '1';
        nutXoaChon.style.cursor = 'pointer';
      } else {
        nutXoaChon.disabled = true;
        nutXoaChon.style.opacity = '0.5';
        nutXoaChon.style.cursor = 'not-allowed';
      }
    }
  }
}
function HienThiDanhSachUninstaller(TuKhoa) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return;
  document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function (c) {
    c.classList.remove('bi-khoa', 'tang', 'giam');
  });
  document.querySelectorAll('.TieuDeCot_Cot[data-sap-xep="' + CotSapXep + '"]').forEach(function (c) {
    c.classList.add(HuongSapXep ? 'tang' : 'giam');
  });
  var ds = DanhSachDaCaiDat.slice();
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function (p) { return p.name.toLowerCase().includes(tk) || p.publisher.toLowerCase().includes(tk); }); }
  ds.sort(function (a, b) {
    var mul = HuongSapXep ? 1 : -1;
    switch (CotSapXep) {
      case 'size': {
        let sA = a.cachedSize || a.size || 0;
        let sB = b.cachedSize || b.size || 0;
        return mul * (sA - sB);
      }
      case 'date': {
        let dA = String(a.cachedDate || a.installDate || '').replace(/\D/g, '');
        let dB = String(b.cachedDate || b.installDate || '').replace(/\D/g, '');
        return mul * dA.localeCompare(dB);
      }
      case 'publisher':
        return mul * (a.publisher || '').localeCompare(b.publisher || '');
      default:
        return mul * (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
    }
  });
  _renderVersion++;
  ct.innerHTML = '';
  CapNhatSoLuongDaChon();
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  window.IconFetchQueue = [];
  renderDanhSachChunk(ds, ct, TaoHangUninstaller);
}
function TaoHangUninstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  var idIcon = 'icon-' + Math.random().toString(36).substring(2, 9);
  var formattedDate = pm.installDate || '-';
  var dStr = String(formattedDate).replace(/\D/g, '');
  if (dStr.length === 8) {
    var year = parseInt(dStr.substring(0, 4), 10);
    var month = parseInt(dStr.substring(4, 6), 10);
    var day = parseInt(dStr.substring(6, 8), 10);
    if (year >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      var format = t('date_format') || 'DD/MM/YYYY';
      formattedDate = format
        .replace('YYYY', year)
        .replace('MM', String(month).padStart(2, '0'))
        .replace('DD', String(day).padStart(2, '0'));
    } else {
      formattedDate = '-';
    }
  } else {
    formattedDate = '-';
  }
  var displaySize = '-';
  if (pm.size) {
    let bytes = pm.size;
    if (bytes < 1024 * 1024) displaySize = (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else if (bytes < 1024 * 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    else displaySize = (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
  }
  d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name.replace(/"/g, '&quot;') + '"></div>' +
    '<div class="HangUngDung_Icon" style="position: relative; display: flex; align-items: center; justify-content: center;">' +
    '<img id="' + idIcon + '" src="TaiNguyen/BieuTuong/what_app.svg" alt="icon" style="width: 100%; height: 100%;">' +
    '<div id="' + idIcon + '-spinner" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: transparent; backdrop-filter: blur(2px); border-radius: inherit; pointer-events: none;">' +
    '<svg width="24" height="24" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:#FF8F00;stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="9" /></svg>' +
    '</div>' +
    '</div>' +
    '<div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_NhaPhatHanh">' + (pm.publisher || '-') + '</div><div class="HangUngDung_Ngay">' + formattedDate + '</div><div class="HangUngDung_DungLuong">' + displaySize + '</div>';
  d.addEventListener('click', function (e) {
    if (e.target.type === 'checkbox') return;
    var cb = d.querySelector('.OChon');
    if (cb) {
      cb.checked = !cb.checked;
      d.classList.toggle('da-chon', cb.checked);
      CapNhatSoLuongDaChon();
      if (cb.checked && pm.name && idIcon && !window.IconCache[pm.name]) {
        window.PushIconQueue(pm.name, idIcon, -1, true);
      }
    }
  });
  d.querySelector('.OChon')?.addEventListener('change', function () {
    d.classList.toggle('da-chon', this.checked);
    CapNhatSoLuongDaChon();
    if (this.checked && pm.name && idIcon && !window.IconCache[pm.name]) {
      window.PushIconQueue(pm.name, idIcon, -1, true);
    }
  });
  d.addEventListener('mouseenter', function () {
    if (pm.name && idIcon && !window.IconCache[pm.name]) {
      // Hovering triggers deep scan with high priority if not cached
      window.PushIconQueue(pm.name, idIcon, 0, true);
    }
  });
  if (!window.ObserverIcon) {
    window.ObserverIcon = new IntersectionObserver(async (entries, obs) => {
      var sorted = [...entries].filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      for (let entry of sorted) {
        if (entry.isIntersecting) {
          let el = entry.target;
          obs.unobserve(el);
          let appName = el.dataset.appName;
          let iconId = el.dataset.iconId;
          if (appName && window.DienTu) {
            let pmObj = DanhSachDaCaiDat.find(p => p.name === appName);
            let iconPrio = 1;
            if (pmObj && pmObj.displayIcon && pmObj.displayIcon.toLowerCase().includes('.ico')) {
              iconPrio = 0; // Lighter processing
            } else if (!pmObj || !pmObj.displayIcon) {
              iconPrio = 2; // Heavy/Likely to fail
            }
            window.PushIconQueue(appName, iconId, iconPrio, false);

            let needFetch = (el.dataset.needDate === 'true' && !window.DateCache[appName])
              || (el.dataset.needSize === 'true' && !window.SizeCache[appName]);

            if (window.SizeCache[appName] && el.dataset.needSize === 'true') {
              let pmObj = DanhSachDaCaiDat.find(p => p.name === appName);
              if (pmObj) pmObj.cachedSize = window.SizeCache[appName];
              let sizeEl = el.querySelector('.HangUngDung_DungLuong');
              if (sizeEl) {
                let bytes = parseInt(window.SizeCache[appName], 10);
                let displaySize = '-';
                if (!isNaN(bytes) && bytes > 0) {
                  if (bytes < 1024 * 1024) displaySize = (bytes / 1024).toFixed(1) + ' KB';
                  else if (bytes < 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                  else if (bytes < 1024 * 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
                  else displaySize = (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
                } else if (window.SizeCache[appName] !== '0' && isNaN(bytes)) {
                  displaySize = window.SizeCache[appName];
                }
                sizeEl.textContent = displaySize;
                sizeEl.classList.add('ChuUocTinh'); sizeEl.title = t('estimated');
              }
            }
            if (window.DateCache[appName] && el.dataset.needDate === 'true') {
              let pmObj = DanhSachDaCaiDat.find(p => p.name === appName);
              if (pmObj) pmObj.cachedDate = window.DateCache[appName];
              let ngayEl = el.querySelector('.HangUngDung_Ngay');
              if (ngayEl) {
                let dStr = window.DateCache[appName];
                let format = t('date_format') || 'DD/MM/YYYY';
                let y = dStr.substring(0, 4), m = dStr.substring(4, 6), day = dStr.substring(6, 8);
                let fDate = format.replace('YYYY', y).replace('MM', m).replace('DD', day);
                ngayEl.textContent = fDate; ngayEl.classList.add('ChuUocTinh'); ngayEl.title = t('estimated');
              }
            }

            if (needFetch && window.DienTu.LayThongTinThem) {
              window.InfoFetchQueue.push({
                appName: appName,
                installLocation: el.dataset.installLocation,
                installDate: el.dataset.installDate || null,
                needDate: el.dataset.needDate === 'true',
                needSize: el.dataset.needSize === 'true'
              });
              InfoFetchDrain();
            }
          }
        }
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
  }
  d.dataset.appName = pm.name;
  d.dataset.iconId = idIcon;
  if (pm.installLocation) d.dataset.installLocation = pm.installLocation;
  if (pm.installDate) d.dataset.installDate = pm.installDate;
  var dateNeedFetch = !pm.installDate || pm.installDate === '-';
  if (!dateNeedFetch && pm.installDate && pm.installDate.length === 8) {
    var _y = parseInt(pm.installDate.substring(0, 4), 10);
    var _m = parseInt(pm.installDate.substring(4, 6), 10);
    var _d = parseInt(pm.installDate.substring(6, 8), 10);
    if (!(_y >= 2000 && _m >= 1 && _m <= 12 && _d >= 1 && _d <= 31)) dateNeedFetch = true;
  }
  if (dateNeedFetch) d.dataset.needDate = 'true';
  if (!pm.size || pm.size === 0) d.dataset.needSize = 'true';
  window.ObserverIcon.observe(d);
  return d;
}
function LocDanhSachUninstaller(bl) {
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return;
  var ds = DanhSachDaCaiDat.slice();
  switch (bl) {
    case 'system':
      ds = ds.filter(function (p) {
        if (!p.publisher) return false;
        let pub = p.publisher.toLowerCase();
        let name = (p.name || '').toLowerCase();
        let isSysPub = pub.includes('microsoft') || pub.includes('intel') || pub.includes('amd') || pub.includes('nvidia') || pub.includes('realtek');
        let isUserApp = name.includes('edge') || name.includes('visual studio') || name.includes('geforce now') || name.includes('onedrive') || name.includes('skype') || name.includes('teams') || name.includes('discord');
        if (isSysPub && !isUserApp) return true;
        if (name.includes('redistributable') || name.includes('c++') || name.includes('runtime') || name.includes('framework') || name.includes('sdk')) return true;
        return false;
      });
      break;
    case 'external':
      ds = ds.filter(function (p) {
        if (!p.publisher) return true;
        let pub = p.publisher.toLowerCase();
        let name = (p.name || '').toLowerCase();
        let isSysPub = pub.includes('microsoft') || pub.includes('intel') || pub.includes('amd') || pub.includes('nvidia') || pub.includes('realtek');
        let isUserApp = name.includes('edge') || name.includes('visual studio') || name.includes('geforce now') || name.includes('onedrive') || name.includes('skype') || name.includes('teams') || name.includes('discord');
        if (isSysPub && !isUserApp) return false;
        if (name.includes('redistributable') || name.includes('c++') || name.includes('runtime') || name.includes('framework') || name.includes('sdk')) return false;
        return true;
      });
      break;
    case 'large':
      ds = ds.filter(function (p) {
        let sz = p.cachedSize || p.size || 0;
        if (!sz) return false;
        let pub = (p.publisher || '').toLowerCase();
        let name = (p.name || '').toLowerCase();
        let isSysPub = pub.includes('microsoft') || pub.includes('intel') || pub.includes('amd') || pub.includes('nvidia') || pub.includes('realtek');
        let isUserApp = name.includes('edge') || name.includes('visual studio') || name.includes('geforce now') || name.includes('onedrive') || name.includes('skype') || name.includes('teams') || name.includes('discord');
        let isSystem = (isSysPub && !isUserApp) || (name.includes('redistributable') || name.includes('c++') || name.includes('runtime') || name.includes('framework') || name.includes('sdk'));
        if (isSystem) return false;
        return sz > 500 * 1024 * 1024;
      });
      break;
    case 'recent':
      var g = new Date();
      g.setMonth(g.getMonth() - 3);
      ds = ds.filter(function (p) {
        var dateStr = p.cachedDate || p.installDate;
        if (!dateStr) return false;
        var dStr = String(dateStr).replace(/\D/g, '');
        if (dStr.length === 8) {
          var y = parseInt(dStr.substring(0, 4), 10);
          var m = parseInt(dStr.substring(4, 6), 10) - 1;
          var d = parseInt(dStr.substring(6, 8), 10);
          if (m < 0 || m > 11) return false;
          return new Date(y, m, d) >= g;
        }
        return false;
      });
      break;
  }
  var cotSort, huongMacDinh;
  if (bl === 'large' || bl === 'recent') {
    cotSort = 'size';
    huongMacDinh = (CotSapXep === 'size') ? HuongSapXep : false;
    ds.sort((a, b) => {
      let sA = a.cachedSize || a.size || 0;
      let sB = b.cachedSize || b.size || 0;
      return huongMacDinh ? (sA - sB) : (sB - sA);
    });
  } else if (bl === 'recent') {
    cotSort = 'date';
    huongMacDinh = (CotSapXep === 'date') ? HuongSapXep : false;
    ds.sort((a, b) => {
      let dA = String(a.cachedDate || a.installDate || '').replace(/\D/g, '');
      let dB = String(b.cachedDate || b.installDate || '').replace(/\D/g, '');
      return huongMacDinh ? dA.localeCompare(dB) : dB.localeCompare(dA);
    });
  } else {
    var mul = HuongSapXep ? 1 : -1;
    ds.sort(function (a, b) {
      switch (CotSapXep) {
        case 'size': {
          let sA = a.cachedSize || a.size || 0;
          let sB = b.cachedSize || b.size || 0;
          return mul * (sA - sB);
        }
        case 'date': {
          let dA = String(a.cachedDate || a.installDate || '').replace(/\D/g, '');
          let dB = String(b.cachedDate || b.installDate || '').replace(/\D/g, '');
          return mul * dA.localeCompare(dB);
        }
        case 'publisher':
          return mul * (a.publisher || '').localeCompare(b.publisher || '');
        default:
          return mul * (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
      }
    });
  }
  document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function (c) {
    c.classList.remove('tang', 'giam', 'bi-khoa');
  });
  if (bl === 'large' || bl === 'recent') {
    var colLock = bl === 'large' ? 'size' : 'date';
    document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function (c) {
      if (c.getAttribute('data-sap-xep') !== colLock) c.classList.add('bi-khoa');
      else c.classList.add(huongMacDinh ? 'tang' : 'giam');
    });
  } else {
    document.querySelectorAll('.TieuDeCot_Cot[data-sap-xep="' + CotSapXep + '"]').forEach(function (c) {
      c.classList.add(HuongSapXep ? 'tang' : 'giam');
    });
  }
  _renderVersion++;
  ct.innerHTML = '';
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  window.IconFetchQueue = [];
  renderDanhSachChunk(ds, ct, TaoHangUninstaller);
}
function CapNhatSoLuongDaChon() {
  var sl = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked').length;
  var n = document.getElementById('so-luong-da-chon');
  if (n) n.textContent = t('status_selected').replace('{0}', sl);
  const nutGoCaiDat = document.getElementById('nut-go-cai-dat');
  if (nutGoCaiDat) {
    if (sl > 0) {
      nutGoCaiDat.disabled = false;
      nutGoCaiDat.style.opacity = '1';
      nutGoCaiDat.style.cursor = 'pointer';
    } else {
      nutGoCaiDat.disabled = true;
      nutGoCaiDat.style.opacity = '0.5';
      nutGoCaiDat.style.cursor = 'not-allowed';
    }
  }
}
// ==========================================
// === [ UI COMPONENTS & DIALOGS ] ===
// ==========================================
function BatTatHopThoai(id, ht) {
  var h = document.getElementById(id), lp = document.getElementById('lop-phu-modal');
  if (ht) { h?.classList.remove('an'); lp?.classList.remove('an'); }
  else {
    if (id === 'hop-thoai-cai-dat' && ChuDeKhiMo) {
      if (LayChuDe() !== ChuDeKhiMo) DatChuDe(ChuDeKhiMo);
      if (LayNgonNgu() !== NgonNguKhiMo) DatNgonNgu(NgonNguKhiMo);
    }
    h?.classList.add('an');
    if (!document.querySelectorAll('.HopThoai:not(.an)').length) lp?.classList.add('an');
  }
}
function HienHopThoaiXacNhanCustom(noiDung, btnOkText, danhSachApp) {
  return new Promise((resolve) => {
    let fullHtml = noiDung;
    if (danhSachApp && danhSachApp.length > 0) {
      let listHtml = '<div style="margin: 20px auto 0; width: 450px; max-width: 100%; box-sizing: border-box; max-height: 140px; overflow-y: auto; background: var(--nen-nhap); padding: 16px; border-radius: var(--do-bo-nho); text-align: left; border: 1px solid var(--vien); font-size: 1.05rem; line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">';
      danhSachApp.forEach(app => {
        let appName = typeof app === 'string' ? app : app.name;
        listHtml += `<div style="display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0;"><div style="width: 5px; height: 5px; border-radius: 50%; background: var(--chu-phu); flex-shrink: 0;"></div><div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--chu); flex: 1; min-width: 0;">${appName}</div></div>`;
      });
      listHtml += '</div>';
      fullHtml += listHtml;
    }
    document.getElementById('xac-nhan-noi-dung').innerHTML = fullHtml;
    BatTatHopThoai('hop-thoai-xac-nhan', true);
    const dongBtn = document.getElementById('xacnhan-dong-btn');
    const huyBtn = document.getElementById('xacnhan-huy-btn');
    const okBtn = document.getElementById('xacnhan-ok-btn');
    if (btnOkText) okBtn.textContent = btnOkText;
    else okBtn.textContent = 'OK';
    const lopPhu = document.getElementById('lop-phu-modal');
    let resolved = false;
    function dong(kq) {
      if (resolved) return;
      resolved = true;
      BatTatHopThoai('hop-thoai-xac-nhan', false);
      dongBtn.removeEventListener('click', btnDong);
      huyBtn.removeEventListener('click', btnDong);
      okBtn.removeEventListener('click', btnOk);
      if (lopPhu) lopPhu.removeEventListener('click', btnDong);
      resolve(kq);
    }
    const btnDong = () => dong(false);
    const btnOk = () => dong(true);
    dongBtn.addEventListener('click', btnDong);
    huyBtn.addEventListener('click', btnDong);
    okBtn.addEventListener('click', btnOk);
    if (lopPhu) lopPhu.addEventListener('click', btnDong);
  });
}
var CaiDatCacTab = ['settings_ui', 'settings_general', 'settings_installer', 'settings_uninstaller', 'settings_utilities'];
function HienHopThoaiTroGiup(tieuDe, noiDung) {
  document.getElementById('tro-giup-tieu-de').textContent = tieuDe;
  document.getElementById('tro-giup-noi-dung').innerHTML = noiDung;
  BatTatHopThoai('hop-thoai-tro-giup', true);
}
function MoHopThoaiCaiDat() {
  ChuDeKhiMo = LayChuDe();
  NgonNguKhiMo = LayNgonNgu();
  var menu = document.getElementById('caidat-menu');
  var nd = document.getElementById('noi-dung-cai-dat');
  menu.innerHTML = '';
  nd.innerHTML = '';
  var ChuDeHT = LayChuDe(), NgonNguHT = LayNgonNgu();
  CaiDatCacTab.forEach(function (tab, i) {
    var btn = document.createElement('button');
    btn.className = 'CaiDat_MucMenu' + (i === 0 ? ' dang-chon' : '');
    btn.textContent = t(tab);
    btn.setAttribute('data-target', 'cai-dat-section-' + i);
    btn.addEventListener('click', function () {
      var target = document.getElementById('cai-dat-section-' + i);
      if (target) {
        var start = nd.scrollTop;
        var to = target.offsetTop - nd.offsetTop;
        var change = to - start;
        var currentTime = 0, duration = 350;
        function animateScroll() {
          currentTime += 16;
          var t = currentTime / (duration / 2);
          var val = t < 1 ? change / 2 * t * t + start : -change / 2 * (--t * (t - 2) - 1) + start;
          nd.scrollTop = val;
          if (currentTime < duration) requestAnimationFrame(animateScroll);
          else nd.scrollTop = to;
        }
        requestAnimationFrame(animateScroll);
      }
    });
    menu.appendChild(btn);
    var sec = document.createElement('div');
    sec.id = 'cai-dat-section-' + i;
    sec.className = 'CaiDat_Phan';
    var helpText = '';
    if (i === 0) helpText = t('help_text_ui');
    if (i === 1) helpText = t('help_text_general');
    if (i === 2) helpText = t('help_text_installer');
    if (i === 3) helpText = t('help_text_uninstaller');
    if (i === 4) helpText = t('help_text_utilities');
    var helpSvg = '<svg width="18" height="18" viewBox="-2 -2 104 104" fill="none" style="opacity:0.6; cursor:pointer; margin-left:8px;" title="' + t(tab) + ' (' + t('settings_help') + ')" onclick="HienHopThoaiTroGiup(\'' + t(tab) + '\', decodeURIComponent(\'' + encodeURIComponent(helpText).replace(/'/g, "%27") + '\'))"><circle cx="50" cy="50" r="50" stroke="currentColor" stroke-width="8"></circle><g transform="matrix(0.7,0,0,0.7,15,15)"><path d="M47.633 2.5c-2.126.242-4.603.367-7.017.829-5.655 1.08-10.71 3.485-14.87 7.529a10.294 10.294 0 0 0-.55 14.227c2.948 3.352 7.325 3.341 11.986-.031.32-.233.647-.458.962-.697 3.48-2.64 7.466-3.674 11.727-3.249 3.515.352 6.526 1.861 7.782 5.494 1.213 3.506-.484 6.153-2.95 8.393-1.237 1.125-2.663 2.046-4.011 3.049-8.1 6.019-11.618 15.485-9.127 24.568 1.185 4.322 3.199 6.59 5.846 6.586 2.59-.003 4.563-2.035 5.716-6.333 1.198-4.461 3.49-8.197 7.013-11.104 2.819-2.325 5.902-4.325 8.742-6.623 8.88-7.187 11.038-18.305 5.399-28.203C68.49 6.772 59.069 3.132 47.633 2.5zM49.12 76.368c-6.542.01-10.696 4.033-10.682 10.346.014 6.241 4.46 10.807 10.502 10.786 6.34-.022 10.896-4.534 10.865-10.76-.03-6.339-4.197-10.383-10.685-10.372z" fill="currentColor"></path></g></svg>';
    sec.innerHTML = '<div class="CaiDat_TieuDePhan" style="display:flex; align-items:center;">' + t(tab) + helpSvg + '</div>' + LayHTMLCaiDatTrang(i, ChuDeHT, NgonNguHT);
    nd.appendChild(sec);
  });
  nd.addEventListener('scroll', function () {
    var fromTop = nd.scrollTop + 60;
    var secs = nd.querySelectorAll('.CaiDat_Phan');
    var current = secs[0].id;
    secs.forEach(function (sec) {
      if ((sec.offsetTop - nd.offsetTop) <= fromTop) current = sec.id;
    });
    menu.querySelectorAll('.CaiDat_MucMenu').forEach(function (m) {
      m.classList.toggle('dang-chon', m.getAttribute('data-target') === current);
    });
  });
  nd.querySelectorAll('.ChonChuDe_Nut').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cd = btn.getAttribute('data-chu-de');
      if (btn.classList.contains('dang-chon')) { DatChuDe('system'); nd.querySelectorAll('.ChonChuDe_Nut').forEach(function (b) { b.classList.remove('dang-chon'); }); HienThongBao(t('system_label'), 'thong-tin'); return; }
      nd.querySelectorAll('.ChonChuDe_Nut').forEach(function (b) { b.classList.remove('dang-chon'); });
      btn.classList.add('dang-chon'); DatChuDe(cd);
    });
  });
  document.querySelectorAll('.CaiDat_Dropdown').forEach(function (wrap) {
    wrap.addEventListener('click', function (e) {
      if (e.target.classList.contains('CaiDat_Dropdown_Muc')) {
        let val = e.target.getAttribute('data-value');
        wrap.setAttribute('data-value', val);
        let textSpan = wrap.querySelector('span');
        if (textSpan) textSpan.innerText = e.target.innerText;
        if (wrap.id === 'cd-ngon-ngu-wrap' && val !== NgonNguHT) {
          DatNgonNgu(val);
          MoHopThoaiCaiDat();
        }
      }
      wrap.classList.toggle('mo');
    });
    wrap.addEventListener('blur', function () {
      wrap.classList.remove('mo');
    });
  });
  document.getElementById('caidat-co-chu')?.addEventListener('input', function () { document.getElementById('caidat-co-chu-gt').textContent = this.value + ' px'; });
  document.getElementById('caidat-trong-suot')?.addEventListener('input', function () { document.getElementById('caidat-trong-suot-gt').textContent = this.value + '%'; });

  let btnCapNhatBasic = document.getElementById('btn-cap-nhat-basic');
  if (btnCapNhatBasic) {
    btnCapNhatBasic.onclick = async function () {
      if (!window.DienTu || !window.DienTu.KiemTraCapNhatBasic) return;
      try {
        btnCapNhatBasic.disabled = true;
        btnCapNhatBasic.innerText = t("checking_data");
        let res = await window.DienTu.KiemTraCapNhatBasic();
        if (res.status === 'same') {
          HienThongBao('Dữ liệu hiện tại đã là mới nhất, không có thay đổi.', 'thong-tin');
        } else if (res.status === 'different') {
          let xacNhan = await HienHopThoaiXacNhanCustom('Có bản cập nhật dữ liệu Basic mới. Bạn có chắc chắn muốn thay thế toàn bộ dữ liệu hiện tại bằng bản cập nhật mới nhất từ Github không? Mọi chỉnh sửa cá nhân trước đó sẽ bị xóa sạch và không thể hoàn tác.');
          if (xacNhan) {
            btnCapNhatBasic.innerText = t("updating_data");
            let success = await window.DienTu.ThucHienCapNhatBasic();
            if (success) {
              HienThongBao(t("data_update_success"), 'thanh-cong');
              if (typeof TaiDanhSachApp === 'function') TaiDanhSachApp(true);
            } else {
              HienThongBao(t("data_update_error"), 'loi');
            }
          }
        } else {
          HienThongBao('Lỗi kiểm tra dữ liệu từ Github hoặc định dạng không hợp lệ.', 'loi');
        }
      } catch (e) {
        HienThongBao(t("connection_error"), 'loi');
      } finally {
        btnCapNhatBasic.disabled = false;
        btnCapNhatBasic.innerText = t("update_data_github");
      }
    };
  }
  var BtnLuu = document.getElementById('caidat-luu'); if (BtnLuu) BtnLuu.onclick = LuuCaiDat;
  var BtnDatLai = document.getElementById('caidat-dat-lai'); if (BtnDatLai) BtnDatLai.onclick = DatLaiCaiDat;
  BatTatHopThoai('hop-thoai-cai-dat', true);
}
let CauHinh = {
  boTron: localStorage.getItem('caidat-bo-tron') !== 'false',
  tatAnim: localStorage.getItem('caidat-tat-anim') === 'true',
  coChu: localStorage.getItem('caidat-co-chu') || 14,
  trongSuot: localStorage.getItem('caidat-trong-suot') || 0,
  chungDaLuong: localStorage.getItem('caidat-chung-da-luong') !== 'false',
  chungHienTienTrinh: localStorage.getItem('caidat-chung-hien-tien-trinh') !== 'false',
  chungHienThongBao: localStorage.getItem('caidat-chung-hien-thong-bao') !== 'false',
  chungHienThongBao: localStorage.getItem('caidat-chung-hien-thong-bao') !== 'false',
  installerTaiDaLuong: localStorage.getItem('caidat-installer-tai-da-luong') !== 'false',
  installerTuDongChon: localStorage.getItem('caidat-installer-tu-dong-chon') === 'true',
  installerHienTienTrinh: localStorage.getItem('caidat-installer-hien-tien-trinh') !== 'false',
  installerHienThongBao: localStorage.getItem('caidat-installer-hien-thong-bao') !== 'false',
  installerHoiXacNhan: localStorage.getItem('caidat-installer-hoi-xac-nhan') !== 'false',
  uninstallerGoNgam: localStorage.getItem('caidat-uninstaller-go-ngam') !== 'false',
  uninstallerHoiXacNhan: localStorage.getItem('caidat-uninstaller-hoi-xac-nhan') !== 'false',
  uninstallerHienTienTrinh: localStorage.getItem('caidat-uninstaller-hien-tien-trinh') !== 'false',
  uninstallerHienThongBao: localStorage.getItem('caidat-uninstaller-hien-thong-bao') === 'true',
  uninstallerGhiNhoDuLieu: localStorage.getItem('caidat-uninstaller-ghi-nho-du-lieu') !== 'false'
};
function CapNhatBoTron(isMaximized = document.body.classList.contains('da-phong-to')) {
  if (isMaximized) {
    document.documentElement.style.setProperty('--do-bo', '0px');
    document.documentElement.style.setProperty('--do-bo-nho', '0px');
    document.documentElement.style.setProperty('--do-bo-lon', '0px');
  } else {
    document.documentElement.style.setProperty('--do-bo', CauHinh.boTron ? '8px' : '0px');
    document.documentElement.style.setProperty('--do-bo-nho', CauHinh.boTron ? '4px' : '0px');
    document.documentElement.style.setProperty('--do-bo-lon', CauHinh.boTron ? '12px' : '0px');
  }
}
function ApDungCauHinh() {
  CapNhatBoTron();
  document.documentElement.style.setProperty('--chuyen-dong', CauHinh.tatAnim ? '0s' : '0.2s cubic-bezier(0.4, 0, 0.2, 1)');
  document.documentElement.style.setProperty('--chuyen-dong-nhanh', CauHinh.tatAnim ? '0s' : '0.15s cubic-bezier(0.4, 0, 0.2, 1)');
  document.documentElement.style.setProperty('--chuyen-dong-cham', CauHinh.tatAnim ? '0s' : '0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  if (CauHinh.tatAnim) document.documentElement.classList.add('tat-hieu-ung');
  else document.documentElement.classList.remove('tat-hieu-ung');
  document.documentElement.style.fontSize = CauHinh.coChu + 'px';
  document.body.style.opacity = '';
  document.documentElement.style.setProperty('--alpha-nen', 1 - (CauHinh.trongSuot / 100));
  if (window.DienTu && window.DienTu.DatLuonTrenCung) {
    let aot = localStorage.getItem('caidat-luon-tren') === 'true';
    window.DienTu.DatLuonTrenCung(aot);
  }
}
ApDungCauHinh();
function LayHTMLCaiDatTrang(i, ChuDeHT, NgonNguHT) {
  if (i === 0) {
    var isSysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var txtLight = t('theme_light');
    var txtDark = t('theme_dark');
    var txtSys = t('theme_system');
    if (isSysDark) txtDark += ' / ' + txtSys; else txtLight += ' / ' + txtSys;
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('lang_label') + '</div></div>' +
      '<div class="CaiDat_Dropdown" id="cd-ngon-ngu-wrap" data-value="' + NgonNguHT + '" tabindex="0">' +
      '  <div class="CaiDat_Dropdown_Chon"><span id="cd-ngon-ngu-text">' + (NgonNguHT === 'VN' ? t('lang_vi') : t('lang_en')) + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>' +
      '  <div class="CaiDat_Dropdown_DanhSach">' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="EN">English</div>' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="VN">' + t('lang_vi') + '</div>' +
      '  </div>' +
      '</div></div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:flex-start; gap:12px;"><div class="MucCaiDat_Nhan">' + t('theme_label') + '</div>' +
      '<div class="ChonChuDe">' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'light' ? ' dang-chon' : '') + '" data-chu-de="light"><img src="TaiNguyen/BieuTuong/theme-light.svg" alt="Light"><span>' + txtLight + '</span></div>' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'dark' ? ' dang-chon' : '') + '" data-chu-de="dark"><img src="TaiNguyen/BieuTuong/theme-dark.svg" alt="Dark"><span>' + txtDark + '</span></div>' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'nex' ? ' dang-chon' : '') + '" data-chu-de="nex"><img src="TaiNguyen/BieuTuong/theme-nex.svg" alt="Nex"><span>' + t('theme_midnight_blue') + '</span></div>' +
      '</div></div>' +
      '<div class="MucCaiDat" style="align-items:flex-start; gap:24px;">' +
      '  <div style="flex:1; display:flex; flex-direction:column; gap:12px;">' +
      '    <div class="MucCaiDat_Nhan">' + t('font_size_label') + '</div>' +
      '    <div class="ThanhTruot"><input type="range" id="caidat-co-chu" min="9" max="24" value="' + CauHinh.coChu + '"><span class="ThanhTruot_GiaTri" id="caidat-co-chu-gt">' + CauHinh.coChu + ' px</span></div>' +
      '  </div>' +
      '  <div style="flex:1; display:flex; flex-direction:column; gap:12px;">' +
      '    <div class="MucCaiDat_Nhan">' + t('transparency_label') + '</div>' +
      '    <div class="ThanhTruot"><input type="range" id="caidat-trong-suot" min="0" max="67" value="' + CauHinh.trongSuot + '"><span class="ThanhTruot_GiaTri" id="caidat-trong-suot-gt">' + CauHinh.trongSuot + '%</span></div>' +
      '  </div>' +
      '</div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('rounded_corners') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-bo-tron" ' + (CauHinh.boTron ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" style="border-bottom:none;"><div><div class="MucCaiDat_Nhan">' + t('disable_animations') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-tat-anim" ' + (CauHinh.tatAnim ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 1) {
    let aot = localStorage.getItem('caidat-luon-tren') === 'true';
    let mtt = localStorage.getItem('caidat-thu-nho-khay') !== 'false';
    let ttDaLuong = t('multithread_desc') || 'Multi-thread processing';
    let ttDanhMuc = t('under_dev') || 'Under development';
    let ttTienTrinh = t('show_progress') || 'Show progress dialog';
    let ttAn = t('hide_incompatible') || 'Hide unsupported apps';
    let ttThongBao = t('show_complete') || 'Show completion dialog';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat_TieuDePhu">' + (t('general_system') || 'Hệ thống & Cửa sổ') + '</div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('always_on_top') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-luon-tren" ' + (aot ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('minimize_to_tray') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-thu-nho-khay" ' + (mtt ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat_TieuDePhu">' + (t('general_process') || 'Tiến trình & Thông báo') + '</div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttDaLuong + '">' + t('multithread_processing') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-da-luong" ' + (CauHinh.chungDaLuong ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttTienTrinh + '">' + t('show_progress') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-hien-tien-trinh" ' + (CauHinh.chungHienTienTrinh ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttThongBao + '">' + t('show_complete') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-hien-thong-bao" ' + (CauHinh.chungHienThongBao ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" onclick="if(document.getElementById(\'cd-chung-danh-muc\').disabled) HienThongBao(\'' + ttDanhMuc + '\', \'thong-tin\')"><div><div class="MucCaiDat_Nhan" title="' + ttDanhMuc + '">' + t('detailed_categories') + '</div></div><label class="CongTac" style="opacity:0.5"><input type="checkbox" id="cd-chung-danh-muc" disabled><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat_TieuDePhu">' + (t('general_ui') || 'Giao diện') + '</div>' +
      '</div>';
  } else if (i === 2) {
    let ttXacNhan = t('show_confirmation') || 'Show confirmation dialog';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttXacNhan + '">' + t('show_confirmation') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-installer-hoi-xac-nhan" ' + (CauHinh.installerHoiXacNhan !== false ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">Cập nhật dữ liệu cơ bản</div></div>' +
      '<button id="btn-cap-nhat-basic" class="Nut Nut--phu" style="padding: 6px 16px; font-size: 0.9em; min-height: 32px; border-radius: 8px;">Cập nhật từ Github</button>' +
      '</div></div>';
  } else if (i === 3) {
    let ttXacNhan = t('show_confirmation') || 'Show confirmation dialog';
    let ttGhiNho = t('remember_scan_data') || 'Remember scan data';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttXacNhan + '">' + t('show_confirmation') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-uninstaller-hoi-xac-nhan" ' + (CauHinh.uninstallerHoiXacNhan ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" style="border-bottom:none;"><div><div class="MucCaiDat_Nhan" title="' + ttGhiNho + '">' + t('remember_scan_data') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-uninstaller-ghi-nho-du-lieu" ' + (CauHinh.uninstallerGhiNhoDuLieu !== false ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 4) {
    let mode = localStorage.getItem('tienich-che-do') || 'thong_minh';
    let modeText = mode === 'nhanh' ? t('util_mode_quick') : (mode === 'tat_ca' ? t('util_mode_all') : t('util_mode_smart'));
    return '<div class="NhomCaiDat" style="opacity: 0.4; pointer-events: none; user-select: none;">' +
      '<div class="MucCaiDat_TieuDePhu">' + t('util_data_destruct') + '</div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:stretch; gap:12px;"><div class="MucCaiDat_Nhan">' + t('util_overwrite_passes') + '</div>' +
      '<div class="ThanhTruot">' +
      '<input type="range" id="cd-tienich-so-lan" min="1" max="7" value="' + (localStorage.getItem('tienich-so-lan') || 3) + '" oninput="document.getElementById(\'cd-tienich-so-lan-gt\').innerText=this.value+\' \'+\'' + t('util_passes') + '\'">' +
      '<span class="ThanhTruot_GiaTri" id="cd-tienich-so-lan-gt">' + (localStorage.getItem('tienich-so-lan') || 3) + ' ' + t('util_passes') + '</span>' +
      '</div></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('util_warn_drive') + '</div></div>' +
      '<label class="CongTac"><input type="checkbox" id="cd-tienich-canh-bao-odia" ' + (localStorage.getItem('tienich-canh-bao-odia') !== 'false' ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat_TieuDePhu">' + t('util_data_recover') + '</div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('util_scan_popular') + '</div><div class="MucCaiDat_MoTa">JPG, PNG, PDF, ZIP, MP4...</div></div>' +
      '<label class="CongTac"><input type="checkbox" id="cd-tienich-chi-pho-bien" ' + (localStorage.getItem('tienich-chi-pho-bien') !== 'false' ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat_TieuDePhu">' + t('util_cleanup') + '</div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('util_default_mode') + '</div></div>' +
      '<div class="CaiDat_Dropdown" id="cd-tienich-che-do-wrap" data-value="' + mode + '" tabindex="0">' +
      '  <div class="CaiDat_Dropdown_Chon"><span id="cd-tienich-che-do-text">' + modeText + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>' +
      '  <div class="CaiDat_Dropdown_DanhSach">' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="nhanh">' + t('util_mode_quick') + '</div>' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="thong_minh">' + t('util_mode_smart') + '</div>' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="tat_ca">' + t('util_mode_all') + '</div>' +
      '  </div>' +
      '</div></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('util_confirm_clean') + '</div></div>' +
      '<label class="CongTac"><input type="checkbox" id="cd-tienich-xac-nhan-don" ' + (localStorage.getItem('tienich-xac-nhan-don') !== 'false' ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  }
}
async function LuuCaiDat() {
  ChuDeKhiMo = LayChuDe();
  NgonNguKhiMo = LayNgonNgu();
  let elBoTron = document.getElementById('caidat-bo-tron');
  if (elBoTron) {
    CauHinh.boTron = elBoTron.checked;
    localStorage.setItem('caidat-bo-tron', CauHinh.boTron);
  }
  let elTrongSuot = document.getElementById('caidat-trong-suot');
  if (elTrongSuot) {
    CauHinh.trongSuot = elTrongSuot.value;
    localStorage.setItem('caidat-trong-suot', CauHinh.trongSuot);
  }
  let elTatAnim = document.getElementById('caidat-tat-anim');
  if (elTatAnim) {
    if (!elTatAnim.checked && window.DienTu && window.DienTu.KiemTraTaiNguyen) {
      try {
        let res = await window.DienTu.KiemTraTaiNguyen();
        if ((res.totalRAM / 1073741824) < 2 || (res.freeRAM / 1073741824) < 1 || res.cpus <= 2 || res.cpuUsage > 90) {
          let txt = t('weak_machine_warning');
          if (!txt || txt === 'weak_machine_warning') txt = t('weak_machine_warning');
          let xacNhan = await HienHopThoaiXacNhanCustom(txt);
          if (!xacNhan) elTatAnim.checked = true;
        }
      } catch (e) { }
    }
    CauHinh.tatAnim = elTatAnim.checked;
    localStorage.setItem('caidat-tat-anim', CauHinh.tatAnim);
  }
  let elCoChu = document.getElementById('caidat-co-chu');
  if (elCoChu) {
    CauHinh.coChu = elCoChu.value;
    localStorage.setItem('caidat-co-chu', CauHinh.coChu);
  }
  let elLuonTren = document.getElementById('caidat-luon-tren');
  if (elLuonTren) {
    localStorage.setItem('caidat-luon-tren', elLuonTren.checked);
    if (window.DienTu?.DatLuonTrenCung) window.DienTu.DatLuonTrenCung(elLuonTren.checked);
  }
  let elThuNho = document.getElementById('caidat-thu-nho-khay');
  if (elThuNho) {
    localStorage.setItem('caidat-thu-nho-khay', elThuNho.checked);
    if (window.DienTu?.DatThuNhoKhay) window.DienTu.DatThuNhoKhay(elThuNho.checked);
  }
  const idsToSave = [
    { id: 'cd-chung-da-luong', key: 'caidat-chung-da-luong', cauHinhKey: 'chungDaLuong' },
    { id: 'cd-chung-hien-tien-trinh', key: 'caidat-chung-hien-tien-trinh', cauHinhKey: 'chungHienTienTrinh' },
    { id: 'cd-chung-hien-thong-bao', key: 'caidat-chung-hien-thong-bao', cauHinhKey: 'chungHienThongBao' },
    { id: 'cd-installer-hoi-xac-nhan', key: 'caidat-installer-hoi-xac-nhan', cauHinhKey: 'installerHoiXacNhan' },
    { id: 'cd-uninstaller-hoi-xac-nhan', key: 'caidat-uninstaller-hoi-xac-nhan', cauHinhKey: 'uninstallerHoiXacNhan' },
    { id: 'cd-uninstaller-ghi-nho-du-lieu', key: 'caidat-uninstaller-ghi-nho-du-lieu', cauHinhKey: 'uninstallerGhiNhoDuLieu' }
  ];
  idsToSave.forEach(item => {
    let el = document.getElementById(item.id);
    if (el) {
      CauHinh[item.cauHinhKey] = el.checked;
      localStorage.setItem(item.key, el.checked);
    }
  });
  ['cd-tienich-canh-bao-odia', 'cd-tienich-chi-pho-bien', 'cd-tienich-xac-nhan-don']
    .forEach(id => {
      let el = document.getElementById(id);
      if (el) localStorage.setItem(id.replace('cd-', ''), el.checked);
    });
  let slEl = document.getElementById('cd-tienich-so-lan');
  if (slEl) localStorage.setItem('tienich-so-lan', slEl.value);
  let cdEl = document.getElementById('cd-tienich-che-do-wrap');
  if (cdEl) localStorage.setItem('tienich-che-do', cdEl.getAttribute('data-value'));
  ApDungCauHinh();
  HienThongBao(t('settings_saved'), 'thanh-cong');
  BatTatHopThoai('hop-thoai-cai-dat', false);
}
function DatLaiCaiDat() {
  DatChuDe('dark');
  DatNgonNgu('VN');
  localStorage.removeItem('caidat-bo-tron');
  localStorage.removeItem('caidat-tat-anim');
  localStorage.removeItem('caidat-co-chu');
  localStorage.removeItem('caidat-trong-suot');
  localStorage.removeItem('caidat-luon-tren');
  localStorage.removeItem('caidat-thu-nho-khay');
  localStorage.removeItem('caidat-thu-nho-khay');
  if (window.DienTu && window.DienTu.DatLaiDanhSachUngDung) {
    window.DienTu.DatLaiDanhSachUngDung().then(() => {
      window.DienTu.LayDanhSachUngDung().then(ds => {
        DanhSachPhanMem = ds;
        if (HienThiDanhSachInstaller) HienThiDanhSachInstaller();
      });
    });
  }
  const chungKeys = ['caidat-chung-da-luong', 'caidat-chung-hien-tien-trinh', 'caidat-chung-hien-thong-bao'];
  const oldKeys = ['caidat-installer-tai-da-luong', 'caidat-installer-tu-dong-chon', 'caidat-installer-thu-nho', 'caidat-installer-hien-tien-trinh', 'caidat-installer-hien-thong-bao', 'caidat-uninstaller-go-ngam', 'caidat-uninstaller-hoi-xac-nhan', 'caidat-uninstaller-hien-tien-trinh', 'caidat-uninstaller-hien-thong-bao', 'caidat-uninstaller-thu-nho'];
  const tienIchKeys = ['tienich-canh-bao-odia', 'tienich-chi-pho-bien', 'tienich-xac-nhan-don', 'tienich-so-lan', 'tienich-che-do'];
  chungKeys.concat(oldKeys).concat(tienIchKeys).forEach(k => localStorage.removeItem(k));
  CauHinh.boTron = true;
  CauHinh.tatAnim = false;
  CauHinh.uninstallerGhiNhoDuLieu = true;
  CauHinh.uninstallerGhiNhoNgay = true;
  CauHinh.coChu = 14;
  CauHinh.trongSuot = 0;
  CauHinh.chungDaLuong = true;
  CauHinh.chungHienTienTrinh = true;
  CauHinh.chungAnKhongHoTro = false;
  CauHinh.chungHienThongBao = true;
  CauHinh.uninstallerHoiXacNhan = true;
  if (window.DienTu?.DatLuonTrenCung) window.DienTu.DatLuonTrenCung(false);
  if (window.DienTu?.DatThuNhoKhay) window.DienTu.DatThuNhoKhay(true);
  ApDungCauHinh();
  HienThongBao(t('settings_reset'), 'thong-tin');
  MoHopThoaiCaiDat();
}
function SoSanhPhienBan(a, b) {
  var pa = a.split('.');
  var pb = b.split('.');
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  return 0;
}

async function KiemTraCapNhat(tuDong = false) {
  if (typeof tuDong !== 'boolean') tuDong = false;
  if (!tuDong) HienThongBao(t('update_checking'), 'thong-tin');
  try {
    let currentVersion = await window.DienTu.LayPhienBan();
    let response = await fetch('https://api.github.com/repos/SpaceheroVN/Nex-Launcher/releases/latest');
    if (!response.ok) throw new Error('Network error');
    let data = await response.json();
    let latestVersion = data.tag_name.replace('v', '');

    let cmp = SoSanhPhienBan(currentVersion, latestVersion);
    if (cmp >= 0) {
      if (!tuDong) HienThongBao(t('update_latest'), 'thanh-cong');
    } else {
      let cham = document.getElementById('cham-cap-nhat');
      if (cham) cham.classList.remove('an');
      let nutNhanh = document.getElementById('nut-cap-nhat-nhanh');
      if (nutNhanh) nutNhanh.classList.remove('an');

      let setupAsset = data.assets.find(a => a.name.endsWith('_x64-setup.exe') || a.name.includes('setup.exe'));
      if (!setupAsset) {
        if (!tuDong) HienThongBao(t('update_error') + ' (No installer)', 'canh-bao');
        return;
      }

      if (!tuDong) {
        if (window.DienTu && window.DienTu.HienHopThoaiXacNhan) {
          let confirmUpdate = await HienHopThoaiXacNhanCustom(t('update_found_desc').replace('{0}', data.tag_name));
          if (confirmUpdate) {
            MoHopThoaiTienTrinh(t('downloading_update'), []);
            let nutHuy = document.getElementById('dong-tien-trinh');
            if (nutHuy) {
              nutHuy.disabled = true;
              nutHuy.style.opacity = '0.5';
              nutHuy.textContent = t("loading_text_short");
            }
            let ds = document.getElementById('tien-trinh-danh-sach');
            if (ds) {
              ds.innerHTML = '<div class="TienTrinh_Muc"><div class="TienTrinh_Ten">Nex Launcher ' + latestVersion + '</div><div class="TienTrinh_TrangThai">Đang tải... 0%</div></div>';
            }
            let unlisten = await window.DienTu.KhiTienTrinhCapNhatApp((payload) => {
              let percent = Math.round(payload.percent);
              document.getElementById('tien-trinh-thanh').style.width = percent + '%';
              document.getElementById('tien-trinh-phan-tram').textContent = percent + '%';
              let mb = document.getElementById('mini-progress-bar');
              if (mb) mb.style.width = percent + '%';
              let mt = document.getElementById('mini-progress-percent');
              if (mt) mt.textContent = percent + '%';
              let muc = document.querySelector('.TienTrinh_TrangThai');
              if (muc) {
                muc.textContent = "Đang tải... " + percent + "%";
                if (percent >= 100) {
                  muc.textContent = "Hoàn tất";
                  muc.className = "TienTrinh_TrangThai thanh-cong";
                  unlisten();
                }
              }
            });
            window.DienTu.TaiVaCaiDatCapNhat(setupAsset.browser_download_url, setupAsset.name).catch((e) => {
              console.error(e);
              HienThongBao(t('update_error') + ': Lỗi khi tải xuống', 'canh-bao');
              let muc = document.querySelector('.TienTrinh_TrangThai');
              if (muc) {
                muc.textContent = "Lỗi";
                muc.className = "TienTrinh_TrangThai loi";
              }
              if (nutHuy) {
                nutHuy.disabled = false;
                nutHuy.style.opacity = '1';
                nutHuy.textContent = t('cancel_btn') || 'Đóng';
                nutHuy.dataset.isCancel = 'false';
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    if (!tuDong) HienThongBao(t('update_error'), 'canh-bao');
  }
}
function HienThongBao(nd, loai) {
  loai = loai || 'thong-tin';
  var vung = document.getElementById('vung-thong-bao'); if (!vung) return;
  let hienTai = Array.from(vung.children).filter(e => !e.classList.contains('dang-xoa'));
  while (hienTai.length >= 5) {
    var oldTb = hienTai.shift();
    oldTb.classList.add('dang-xoa');
    oldTb.style.animation = 'mooDan 0.2s forwards';
    setTimeout(function () { if (oldTb.parentNode) oldTb.remove(); }, 200);
  }
  var tb = document.createElement('div'); tb.className = 'ThongBao ThongBao--' + loai; tb.textContent = nd;
  vung.appendChild(tb); setTimeout(function () { if (tb.parentNode) tb.remove(); }, 4000);
}

function MoHopThoaiTienTrinh(tieuDe, danhSachApp) {
  var h = document.getElementById('hop-thoai-tien-trinh');
  var lp = document.getElementById('lop-phu-modal');
  var ds = document.getElementById('tien-trinh-danh-sach');
  document.getElementById('tien-trinh-tieu-de').textContent = tieuDe;
  document.getElementById('tien-trinh-thanh').style.width = '0%';
  document.getElementById('tien-trinh-thanh').style.animation = '';
  document.getElementById('tien-trinh-thanh').classList.remove('hoan-tat');
  document.getElementById('tien-trinh-phan-tram').textContent = '0%';

  let miniProgInit = document.getElementById('sidebar-mini-progress');
  if (miniProgInit) {
    miniProgInit.style.display = 'none';
    let mt = document.getElementById('mini-progress-title');
    if (mt) { mt.textContent = tieuDe; mt.style.color = 'var(--chu-chinh)'; }
    let mp = document.getElementById('mini-progress-percent');
    if (mp) { mp.textContent = '0%'; mp.style.color = 'var(--mau-nhan)'; }
    let mb = document.getElementById('mini-progress-bar');
    if (mb) { mb.style.width = '0%'; mb.style.backgroundColor = tieuDe.toLowerCase().includes('gỡ') || tieuDe.toLowerCase().includes('uninstall') ? 'var(--nguy-hiem)' : 'var(--mau-nhan)'; }
  }

  window.isProgressAnimating = false;
  window.currentProgress = 0;
  window.targetProgress = 0;
  window.FakeInstallProgress = {};
  window.AppStatuses = {};
  window.AppErrorDetails = {};
  window.AppErrorStage = null;
  window.LastStatusApp = {};

  let isUninstall = tieuDe.toLowerCase().includes('gỡ') || tieuDe.toLowerCase().includes('uninstall');
  window.danhSachAppTienTrinh = danhSachApp;
  window.phanTramTungApp = {};
  window.isUninstallMode = isUninstall;
  window.CurrentGlobalStage = null;

  var wrapper = document.getElementById('tien-trinh-wrapper');
  var dsSum = document.getElementById('tien-trinh-tong-ket-don-dep');
  if (dsSum) dsSum.style.display = 'none';
  var dsRp = document.getElementById('tien-trinh-diem-khoi-phuc');
  if (dsRp) dsRp.style.display = 'none';
  var btnNext = document.getElementById('tiep-theo-tien-trinh');
  if (btnNext) btnNext.style.display = 'none';
  if (ds) {
    ds.style.display = 'block';
    ds.innerHTML = '';
  }

  document.getElementById('tien-trinh-thanh').style.backgroundColor = isUninstall ? 'var(--nguy-hiem)' : 'var(--mau-nhan)';

  var nutDong = document.getElementById('dong-tien-trinh');
  if (nutDong) {
    nutDong.disabled = false;
    nutDong.style.opacity = '1';
    nutDong.className = 'Nut Nut--Huy';
    nutDong.textContent = t('cancel_btn');
    nutDong.dataset.isCancel = 'true';
  }
  let btnBaoLoi = document.getElementById('bao-cao-loi');
  if (btnBaoLoi) btnBaoLoi.style.display = 'none';

  let btnAn = document.getElementById('an-tien-trinh');
  if (btnAn && !btnAn.dataset.hasListener) {
    btnAn.dataset.hasListener = 'true';
    btnAn.addEventListener('click', () => {
      document.getElementById('hop-thoai-tien-trinh').classList.add('an');
      document.getElementById('lop-phu-modal').classList.add('an');
      let mini = document.getElementById('sidebar-mini-progress');
      if (mini) mini.style.display = 'flex';
    });
  }

  let miniProgClick = document.getElementById('sidebar-mini-progress');
  if (miniProgClick && !miniProgClick.dataset.hasListener) {
    miniProgClick.dataset.hasListener = 'true';
    miniProgClick.addEventListener('click', () => {
      miniProgClick.style.display = 'none';
      document.getElementById('hop-thoai-tien-trinh').classList.remove('an');
      document.getElementById('lop-phu-modal').classList.remove('an');
    });
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
      stagesData.forEach((st) => {
        let item = document.createElement('div');
        item.className = 'GlobalStage_Item';
        item.id = 'global-stage-' + st.id;
        item.style.cssText = 'flex: 1; height: 6px; border-radius: var(--do-bo-nho); background: var(--nen-tang3); transition: all 0.3s; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); position: relative;';
        let tooltip = document.createElement('div');
        tooltip.style.cssText = 'position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: var(--chu-phu); white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none;';
        tooltip.textContent = st.name;
        tooltip.className = 'stage-tooltip';
        item.appendChild(tooltip);
        item.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
        item.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
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
    return { name: name, isFile: isFileOrGop };
  });

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
<div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 16px; min-width: 0;" title="${tenApp}">${tenApp}</div>
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
  h?.classList.remove('an');
  lp?.classList.remove('an');
  ds.scrollTop = 0;
}
function CapNhatHopThoaiTienTrinh(tenApp, phanTram, trangThai, mauChu, fullStatus, rawStatus) {
  var h = document.getElementById('hop-thoai-tien-trinh');
  if (!h || h.classList.contains('an')) return;

  if (!window.phanTramTungApp) window.phanTramTungApp = {};
  if (!window.AppStatuses) window.AppStatuses = {};
  if (!window.AppErrorDetails) window.AppErrorDetails = {};
  if (!window.FakeInstallProgress) window.FakeInstallProgress = {};
  if (!window.LastStatusApp) window.LastStatusApp = {};

  if (rawStatus === 'installing') {
    if (!window.FakeInstallProgress[tenApp]) {
      let intervalId = null;
      window.FakeInstallProgress[tenApp] = { pct: phanTram || 0 };
      intervalId = setInterval(() => {
        if (!window.AppStatuses || window.AppStatuses[tenApp] !== 'installing' || !window.FakeInstallProgress[tenApp]) {
          clearInterval(intervalId);
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
          }
        }
      }, 800);
    }
    trangThai = window.FakeInstallProgress[tenApp].pct + '%';
    phanTram = window.FakeInstallProgress[tenApp].pct;
  } else {
    if (window.FakeInstallProgress && window.FakeInstallProgress[tenApp]) {
      delete window.FakeInstallProgress[tenApp];
    }
  }

  window.phanTramTungApp[tenApp] = phanTram;
  if (rawStatus === 'done' || rawStatus === 'error') {
    window.phanTramTungApp[tenApp] = 100;
  }
  window.AppStatuses[tenApp] = rawStatus;

  if (rawStatus === 'error') {
    if (!window.AppErrorDetails) window.AppErrorDetails = {};
    window.AppErrorDetails[tenApp] = fullStatus || "Lỗi không xác định";
  }

  let tongPhanTram = 0;
  if (TienTrinhSoApp > 0 && window.danhSachAppTienTrinh) {
    let tongDiem = 0;
    for (let app of window.danhSachAppTienTrinh) {
      let appName = typeof app === 'string' ? app : (app.name || app.id || 'Unknown App');
      let t_val = window.phanTramTungApp[appName] || 0;
      tongDiem += t_val;
    }
    tongPhanTram = Math.min(100, tongDiem / TienTrinhSoApp);
  }

  var idTt = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
  var ttEl = document.getElementById(idTt);
  if (ttEl) {
    let spanText = ttEl.querySelector('.status-text');
    let spanSpin = ttEl.querySelector('.spinner');
    let displayTrangThai = trangThai;
    if (displayTrangThai === t('error_status') || displayTrangThai === 'Lỗi') displayTrangThai = 'Lỗi - Bỏ qua';
    if (spanText) spanText.textContent = displayTrangThai;
    else ttEl.textContent = displayTrangThai;

    if (mauChu) ttEl.style.color = mauChu;
    ttEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
    if (fullStatus) ttEl.title = fullStatus;

    if (rawStatus === 'done' || rawStatus === 'error') {
      if (spanSpin) spanSpin.style.display = 'none';
      ttEl.className = 'TienTrinh_TrangThai ' + (rawStatus === 'done' ? 'thanh-cong' : 'loi');
      if (rawStatus === 'done') ttEl.style.color = 'var(--thanh-cong)';
    } else {
      if (spanSpin) spanSpin.style.display = 'inline-block';
    }
  }

  if (ttEl && ttEl.parentElement) {
    if (!window.LastStatusApp) window.LastStatusApp = {};
    if (window.LastStatusApp[tenApp] !== rawStatus) {
      window.LastStatusApp[tenApp] = rawStatus;
      if (rawStatus === 'installing' || rawStatus === 'downloading' || rawStatus === 'uninstalling') {
        let ds = document.getElementById('tien-trinh-danh-sach');
        if (ds) {
          let offsetTop = ttEl.parentElement.offsetTop;
          if (offsetTop > ds.scrollTop + ds.clientHeight - 50 || offsetTop < ds.scrollTop) {
            ds.scrollTo({ top: offsetTop - 50, behavior: 'smooth' });
          }
        }
      }
    }

    let threadModeEl = document.getElementById('thread-mode-' + encodeURIComponent(tenApp).replace(/%/g, '_'));
    if (threadModeEl && rawStatus === 'downloading') {
      threadModeEl.textContent = 'Đa luồng';
      threadModeEl.style.color = 'var(--mau-nhan)';
      threadModeEl.style.opacity = '1';
    }
  }

  if (window.GlobalAppList) {
    let hasDownloading = false;
    let allDoneOrError = true;
    let hasError = false;
    for (let app of window.GlobalAppList) {
      let st = window.AppStatuses[app.name] || 'waiting';
      if (st !== 'done' && st !== 'error') allDoneOrError = false;
      if (st === 'error') hasError = true;
      if (st === 'downloading' || (!app.isFile && st === 'waiting')) hasDownloading = true;
    }
    if (window.isUninstallMode) hasError = false;

    let tieuDe = document.getElementById('tien-trinh-tieu-de');
    let isProcessFinished = allDoneOrError;

    if (!window.isUninstallMode) {
      let dlStage = document.getElementById('global-stage-dl');
      let inStage = document.getElementById('global-stage-in');
      if (dlStage && inStage) {
        if (allDoneOrError) {
          if (hasError) {
            dlStage.style.background = 'var(--thanh-cong)';
            inStage.style.background = 'var(--nguy-hiem)';
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
    } else {
      let globalItems = document.querySelectorAll('.GlobalStage_Item');
      let targetStage = window.CurrentGlobalStage || 'un';

      let dsRs = document.getElementById('tien-trinh-diem-khoi-phuc');
      let dsLs = document.getElementById('tien-trinh-danh-sach');
      let dsSum = document.getElementById('tien-trinh-tong-ket-don-dep');

      if (targetStage === 'rs') {
        if (dsRs) dsRs.style.display = 'flex';
        if (dsLs) dsLs.style.display = 'none';
      } else if (targetStage === 'un') {
        if (dsRs) dsRs.style.display = 'none';
        if (dsLs && dsSum && dsSum.style.display === 'none') dsLs.style.display = 'block';
      }

      if (globalItems.length > 0) {
        let foundActive = false;
        globalItems.forEach(item => {
          if (item.id === 'global-stage-' + targetStage) {
            if (allDoneOrError && hasError) item.style.background = 'var(--nguy-hiem)';
            else if (allDoneOrError) item.style.background = 'var(--thanh-cong)';
            else item.style.background = 'var(--canh-bao)';
            foundActive = true;
          } else if (!foundActive) {
            item.style.background = 'var(--thanh-cong)';
          } else {
            item.style.background = 'var(--nen-tang3)';
          }
        });
      }
      if (tieuDe) {
        if (allDoneOrError) tieuDe.textContent = hasError ? 'Tiến trình kết thúc (Có lỗi)' : 'Hoàn tất tiến trình';
        else if (targetStage === 'rs') tieuDe.textContent = 'Đang tạo điểm khôi phục...';
        else if (targetStage === 'cl') tieuDe.textContent = 'Đang quét dữ liệu thừa...';
        else tieuDe.textContent = 'Đang tiến hành gỡ cài đặt...';
      }
    }

    if (isProcessFinished) {
      let btnHuy = document.getElementById('dong-tien-trinh');
      let btnBaoCao = document.getElementById('bao-cao-loi');
      let btnNext = document.getElementById('tiep-theo-tien-trinh');
      if (btnNext) btnNext.style.display = 'none';
      if (btnHuy) {
        btnHuy.textContent = t('close_btn') || 'Đóng';
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
    }
  }

  let isUninstall = window.isUninstallMode;
  let mauThanh = isUninstall ? 'var(--canh-bao)' : 'var(--mau-nhan)';
  if (tongPhanTram >= 100) mauThanh = 'var(--thanh-cong)';
  else if (tongPhanTram >= 75) mauThanh = 'var(--thanh-cong)';
  else if (tongPhanTram >= 50) mauThanh = 'var(--canh-bao)';
  else if (tongPhanTram >= 25) mauThanh = 'var(--mau-uoc-tinh)';
  document.getElementById('tien-trinh-thanh').style.backgroundColor = mauThanh;

  window.targetProgress = tongPhanTram;

  if (window.targetProgress === 0) {
    window.currentProgress = 0;
    document.getElementById('tien-trinh-thanh').style.width = '0%';
    let ptText = document.getElementById('tien-trinh-phan-tram');
    if (ptText) ptText.textContent = '0%';
  } else if (!window.isProgressAnimating) {
    if (typeof window.currentProgress !== 'number') {
      window.currentProgress = parseFloat(document.getElementById('tien-trinh-thanh').style.width) || 0;
    }
    window.isProgressAnimating = true;

    let animate = () => {
      let pBar = document.getElementById('tien-trinh-thanh');
      if (!pBar) { window.isProgressAnimating = false; return; }

      let diff = window.targetProgress - window.currentProgress;
      if (diff < 0) { window.targetProgress = window.currentProgress; diff = 0; }

      if (diff > 0) {
        let step = Math.max(0.5, diff * 0.1);
        if (step > diff) step = diff;
        window.currentProgress += step;
      }

      pBar.style.width = window.currentProgress + '%';
      let ptText = document.getElementById('tien-trinh-phan-tram');
      if (ptText) {
        ptText.textContent = Math.round(window.currentProgress) + '%';
        ptText.style.textShadow = '0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)';
      }
      let mb = document.getElementById('mini-progress-bar');
      if (mb) mb.style.width = window.currentProgress + '%';
      let mt = document.getElementById('mini-progress-percent');
      if (mt) mt.textContent = Math.round(window.currentProgress) + '%';

      if (window.currentProgress >= window.targetProgress) {
        window.currentProgress = window.targetProgress;
        window.isProgressAnimating = false;
      } else {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
}
function HoanTatHopThoaiTienTrinh(ketQua, hasLeftovers) {
  let coLoi = false;
  if (ketQua && Array.isArray(ketQua)) {
    ketQua.forEach(k => {
      var idTt = 'tien-trinh-tt-' + encodeURIComponent(k.name).replace(/%/g, '_');
      var ttEl = document.getElementById(idTt);
      if (ttEl) {
        ttEl.textContent = k.success ? t('completed') : t('error_status');
        ttEl.className = 'TienTrinh_TrangThai ' + (k.success ? 'thanh-cong' : 'loi');
      }
      if (!k.success) coLoi = true;
    });
  }
  let tieuDe = document.getElementById('tien-trinh-tieu-de');
  if (tieuDe) tieuDe.textContent = coLoi ? (t('error_status') ? 'Tiến trình kết thúc (Có lỗi)' : 'Hoàn tất tiến trình (Có lỗi)') : (t('completed') || 'Hoàn tất');

  let globalStages = document.getElementById('tien-trinh-global-stages');
  if (globalStages) {
    let dlStage = document.getElementById('global-stage-dl');
    let inStage = document.getElementById('global-stage-in');
    if (dlStage && inStage && !window.isUninstallMode) {
      if (coLoi) {
        dlStage.style.background = 'var(--thanh-cong)';
        inStage.style.background = 'var(--nguy-hiem)';
      } else {
        dlStage.style.background = 'var(--thanh-cong)';
        inStage.style.background = 'var(--thanh-cong)';
      }
    } else {
      Array.from(globalStages.children).forEach(child => {
        child.style.background = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)';
      });
    }
  }

  window.currentProgress = 100;
  window.targetProgress = 100;
  window.isProgressAnimating = false;
  if (window.FakeInstallProgress) {
    for (let key in window.FakeInstallProgress) delete window.FakeInstallProgress[key];
  }

  document.getElementById('tien-trinh-thanh').style.width = '100%';
  document.getElementById('tien-trinh-thanh').style.animation = 'none';
  document.getElementById('tien-trinh-thanh').classList.add('hoan-tat');
  document.getElementById('tien-trinh-thanh').style.backgroundColor = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)';
  document.getElementById('tien-trinh-phan-tram').textContent = '100%';

  let miniProgEnd = document.getElementById('sidebar-mini-progress');
  if (miniProgEnd) {
    let mt = document.getElementById('mini-progress-title');
    if (mt) { mt.textContent = coLoi ? 'Tiến trình kết thúc (Có lỗi)' : 'Hoàn tất'; mt.style.color = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
    let mp = document.getElementById('mini-progress-percent');
    if (mp) { mp.textContent = '100%'; mp.style.color = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
    let mb = document.getElementById('mini-progress-bar');
    if (mb) { mb.style.width = '100%'; mb.style.backgroundColor = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
  }

  var nutDong = document.getElementById('dong-tien-trinh');
  if (nutDong) {
    nutDong.disabled = false;
    nutDong.style.opacity = '1';
    nutDong.className = 'Nut Nut--chinh';
    if (hasLeftovers) {
      nutDong.textContent = t('next_btn');
      nutDong.dataset.isNext = 'true';
    } else {
      nutDong.textContent = t('close_btn');
      nutDong.dataset.isNext = 'false';
    }
    nutDong.dataset.isCancel = 'false';
  }
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
}
document.getElementById('dong-bao-cao-loi-x')?.addEventListener('click', () => {
  document.getElementById('hop-thoai-bao-cao-loi').classList.add('an');
  if (!document.querySelectorAll('.HopThoai:not(.an)').length) document.getElementById('lop-phu-modal').classList.add('an');
});
document.getElementById('dong-bao-cao-loi-ok')?.addEventListener('click', () => {
  document.getElementById('hop-thoai-bao-cao-loi').classList.add('an');
  if (!document.querySelectorAll('.HopThoai:not(.an)').length) document.getElementById('lop-phu-modal').classList.add('an');
});
document.getElementById('copy-bao-cao-loi')?.addEventListener('click', () => {
  let text = document.getElementById('chi-tiet-bao-cao-loi').value;
  navigator.clipboard.writeText(text).then(() => {
    let btn = document.getElementById('copy-bao-cao-loi');
    let oldText = btn.innerHTML;
    btn.innerHTML = t('copied');
    setTimeout(() => { btn.innerHTML = oldText; }, 2000);
  });
});
function HienThiXacNhanGoCaiDat(danhSachChon) {
  return new Promise((resolve) => {
    var hopThoai = document.getElementById('hop-thoai-xac-nhan-go');
    var danhSach = document.getElementById('xac-nhan-go-danh-sach');
    var cauHoi = document.getElementById('xac-nhan-go-cau-hoi');
    var lp = document.getElementById('lop-phu-modal');
    if (cauHoi) cauHoi.textContent = t('confirm_remove_apps').replace('{0}', danhSachChon.length);
    var TrangHienTai = 0;
    var SoLuongTrenTrang = 3;
    var nutPrev = document.getElementById('xac-nhan-go-prev');
    var nutNext = document.getElementById('xac-nhan-go-next');
    var renderTrang = () => {
      if (danhSach) {
        danhSach.innerHTML = '';
        var batDau = TrangHienTai * SoLuongTrenTrang;
        var ketThuc = Math.min(batDau + SoLuongTrenTrang, danhSachChon.length);
        var trangHienTaiApps = danhSachChon.slice(batDau, ketThuc);
        trangHienTaiApps.forEach(app => {
          var div = document.createElement('div');
          div.className = 'XacNhanGo_App';
          var img = document.createElement('img');
          img.className = 'XacNhanGo_Icon';
          img.src = 'TaiNguyen/BieuTuong/logo.svg';
          if (window.DienTu && window.DienTu.LayIconApp) {
            window.DienTu.LayIconApp(app.name).then(base64 => {
              if (base64) img.src = base64;
            });
          }
          var ten = document.createElement('div');
          ten.className = 'XacNhanGo_Ten';
          ten.textContent = app.name;
          ten.title = app.name;
          var size = document.createElement('div');
          size.className = 'XacNhanGo_Size';

          let formatSize = (rawSize) => {
            let bytes = parseInt(rawSize, 10);
            if (!isNaN(bytes) && bytes > 0) {
              if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
              if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
              if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
              return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
            }
            if (rawSize && rawSize !== '0' && isNaN(bytes)) return rawSize;
            return '-';
          };

          if (app.cachedSize) {
            size.textContent = formatSize(app.cachedSize);
          } else if (app.size && app.size > 0) {
            size.textContent = formatSize(app.size);
          } else if (window.DienTu && window.DienTu.LayThongTinThem) {
            window.DienTu.LayThongTinThem(app.name, app.installLocation).then(info => {
              if (info && info.size) {
                app.cachedSize = info.size;
                size.textContent = formatSize(info.size);
              } else {
                size.textContent = '-';
              }
            });
          } else {
            size.textContent = '-';
          }
          div.appendChild(img);
          div.appendChild(ten);
          div.appendChild(size);
          danhSach.appendChild(div);
        });
      }
      if (nutPrev) {
        nutPrev.disabled = TrangHienTai === 0;
        nutPrev.style.display = danhSachChon.length > SoLuongTrenTrang ? 'block' : 'none';
        nutPrev.style.visibility = TrangHienTai === 0 ? 'hidden' : 'visible';
      }
      if (nutNext) {
        nutNext.disabled = ketThuc >= danhSachChon.length;
        nutNext.style.display = danhSachChon.length > SoLuongTrenTrang ? 'block' : 'none';
        nutNext.style.visibility = ketThuc >= danhSachChon.length ? 'hidden' : 'visible';
      }
    };
    var xuliPrev = () => { if (TrangHienTai > 0) { TrangHienTai--; renderTrang(); } };
    var xuliNext = () => { if ((TrangHienTai + 1) * SoLuongTrenTrang < danhSachChon.length) { TrangHienTai++; renderTrang(); } };
    if (nutPrev) nutPrev.addEventListener('click', xuliPrev);
    if (nutNext) nutNext.addEventListener('click', xuliNext);
    renderTrang();
    var nutHuy = document.getElementById('dong-xac-nhan-go');
    var nutGo = document.getElementById('luu-xac-nhan-go');
    var xuliHuy = () => {
      hopThoai.classList.add('an');
      if (!document.querySelectorAll('.HopThoai:not(.an)').length) lp.classList.add('an');
      nutHuy?.removeEventListener('click', xuliHuy);
      nutGo?.removeEventListener('click', xuliGo);
      nutPrev?.removeEventListener('click', xuliPrev);
      nutNext?.removeEventListener('click', xuliNext);
      resolve(false);
    };
    var xuliGo = () => {
      hopThoai.classList.add('an');
      nutHuy?.removeEventListener('click', xuliHuy);
      nutGo?.removeEventListener('click', xuliGo);
      nutPrev?.removeEventListener('click', xuliPrev);
      nutNext?.removeEventListener('click', xuliNext);
      resolve(true);
    };
    nutHuy?.addEventListener('click', xuliHuy);
    nutGo?.addEventListener('click', xuliGo);
    hopThoai.classList.remove('an');
    lp.classList.remove('an');
  });
}
function DongHopThoaiTienTrinh() {
  var nutDong = document.getElementById('dong-tien-trinh');
  if (nutDong && nutDong.dataset.isCancel === 'true') {
    if (window.DienTu && window.DienTu.HuyTienTrinh) {
      window.DienTu.HuyTienTrinh();
    }
    nutDong.disabled = true;
    nutDong.style.opacity = '0.5';
    nutDong.textContent = t('canceling');
    return;
  }
  if (nutDong && nutDong.dataset.isNext === 'true') {
    return;
  }
  BatTatHopThoai('hop-thoai-tien-trinh', false);
  let mini = document.getElementById('sidebar-mini-progress');
  if (mini) mini.style.display = 'none';
}
let duongDanPhaHuy = "";
let laPhaHuyODia = false;
let mucDoNhayCam = 1;
let demXacNhan = 0;
document.addEventListener('DOMContentLoaded', () => {
  KiemTraCapNhat(true);
  const btnFile = document.getElementById('btn-chon-file');
  const btnFolder = document.getElementById('btn-chon-folder');
  const btnDrive = document.getElementById('btn-chon-drive');
  const inputPath = document.getElementById('input-duong-dan-pha-huy');
  const btnPhaHuy = document.getElementById('btn-bat-dau-pha-huy');
  const divCanhBao = document.getElementById('canh-bao-pha-huy');
  const btnXacNhan = document.getElementById('btn-xac-nhan-lan-1');
  const btnHuy = document.getElementById('btn-huy-pha-huy');
  async function ChonDuongDan(type) {
    if (!window.DienTu || !window.DienTu.ChonDuongDanPhaHuy) return;
    const res = await window.DienTu.ChonDuongDanPhaHuy(type);
    if (res) {
      duongDanPhaHuy = res;
      inputPath.value = res;
      laPhaHuyODia = (type === 'drive');
      btnPhaHuy.disabled = false;
      mucDoNhayCam = await window.DienTu.KiemTraThuMucNhayCam(res);
      demXacNhan = 0;
      divCanhBao.style.display = 'none';
    }
  }
  btnFile?.addEventListener('click', () => ChonDuongDan('file'));
  btnFolder?.addEventListener('click', () => ChonDuongDan('folder'));
  btnDrive?.addEventListener('click', () => {
    let drive = prompt(t('enter_destroy_path'));
    if (drive) {
      duongDanPhaHuy = drive;
      inputPath.value = drive;
      laPhaHuyODia = true;
      btnPhaHuy.disabled = false;
      mucDoNhayCam = 3;
      demXacNhan = 0;
      divCanhBao.style.display = 'none';
    }
  });
  btnPhaHuy?.addEventListener('click', async () => {
    if (!duongDanPhaHuy) return;
    if (mucDoNhayCam >= 2) {
      btnPhaHuy.disabled = true;
      divCanhBao.style.display = 'block';
      CapNhatUIXacNhan();
    } else {
      ThucHienPhaHuy();
    }
  });
  btnHuy?.addEventListener('click', () => {
    divCanhBao.style.display = 'none';
    btnPhaHuy.disabled = false;
    demXacNhan = 0;
  });
  btnXacNhan?.addEventListener('click', () => {
    demXacNhan++;
    if (demXacNhan >= 3) {
      divCanhBao.style.display = 'none';
      ThucHienPhaHuy();
    } else {
      CapNhatUIXacNhan();
    }
  });
  function CapNhatUIXacNhan() {
    btnXacNhan.textContent = t('destroy_anyway').replace('{0}', demXacNhan + 1);
    let fontSize = 14 + (demXacNhan * 4);
    let weight = 500 + (demXacNhan * 200);
    btnXacNhan.style.fontSize = `${fontSize}px`;
    btnXacNhan.style.fontWeight = weight;
  }
  async function ThucHienPhaHuy() {
    if (!window.DienTu || !window.DienTu.PhaHuyDuLieu) return;
    let passes = parseInt(document.getElementById('input-so-lan-ghi').value) || 3;
    HienThongBao(t('destroying_wait'), 'thong-tin');
    btnPhaHuy.disabled = true;
    try {
      const ketQua = await window.DienTu.PhaHuyDuLieu(duongDanPhaHuy, { isDrive: laPhaHuyODia, passes: passes });
      if (ketQua === true || ketQua.success) {
        HienThongBao(t('destroy_complete'), 'thanh-cong');
      } else {
        HienThongBao(t('destroy_error') + (ketQua.error || t('unknown_error')), 'loi');
      }
    } catch (e) {
      HienThongBao(t('general_error') + e.message, "loi");
    } finally {
      btnPhaHuy.disabled = false;
      demXacNhan = 0;
      divCanhBao.style.display = 'none';
    }
  }
  const btnMoDropdownQuet = document.getElementById('btn-mo-dropdown-quet');
  const dropdownCheDoQuet = document.getElementById('dropdown-che-do-quet');
  const txtCheDoQuet = document.getElementById('txt-che-do-quet');
  const dsMucQuet = document.querySelectorAll('#ds-dropdown-quet .CustomSelect_Muc');
  let cheDoQuetHienTai = 'thong-minh';
  btnMoDropdownQuet?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownCheDoQuet?.classList.toggle('dang-mo');
  });
  document.addEventListener('click', (e) => {
    if (!dropdownCheDoQuet?.contains(e.target)) {
      dropdownCheDoQuet?.classList.remove('dang-mo');
    }
  });
  dsMucQuet.forEach(muc => {
    muc.addEventListener('click', () => {
      dsMucQuet.forEach(m => m.classList.remove('dang-chon'));
      muc.classList.add('dang-chon');
      const value = muc.getAttribute('data-value');
      const title = muc.querySelector('div').textContent;
      cheDoQuetHienTai = value;
      if (txtCheDoQuet) {
        txtCheDoQuet.textContent = title;
        txtCheDoQuet.setAttribute('data-value', value);
      }
      dropdownCheDoQuet?.classList.remove('dang-mo');
    });
  });
  document.getElementById('btn-bat-dau-quet-rac')?.addEventListener('click', async function () {
    let msg = t('feature_dev');
    HienThongBao(msg, 'canh-bao');
  });
  const btnChonFolderKhoiPhuc = document.getElementById('btn-chon-folder-khoi-phuc');
  const inputThuMucKhoiPhuc = document.getElementById('input-thu-muc-khoi-phuc');
  const btnBatDauKhoiPhuc = document.getElementById('btn-bat-dau-khoi-phuc');
  const inputDuongDanKhoiPhuc = document.getElementById('input-duong-dan-khoi-phuc');
  const divTienTrinhKhoiPhuc = document.getElementById('tien-trinh-khoi-phuc');
  const txtTienTrinhKhoiPhuc = document.getElementById('txt-tien-trinh-khoi-phuc');
  const thanhTienTrinhKhoiPhuc = document.getElementById('thanh-tien-trinh-khoi-phuc');
  let thuMucLuuKhoiPhuc = "";
  btnChonFolderKhoiPhuc?.addEventListener('click', async () => {
    if (!window.DienTu || !window.DienTu.ChonDuongDanPhaHuy) return;
    const res = await window.DienTu.ChonDuongDanPhaHuy('folder');
    if (res) {
      thuMucLuuKhoiPhuc = res;
      inputThuMucKhoiPhuc.value = res;
    }
  });
  if (window.DienTu && window.DienTu.KhiTienTrinhKhoiPhuc) {
    window.DienTu.KhiTienTrinhKhoiPhuc((percent) => {
      txtTienTrinhKhoiPhuc.textContent = t('scanning_recovering').replace('{0}', percent);
      thanhTienTrinhKhoiPhuc.style.width = `${percent}%`;
      if (window.DienTu.DatTienTrinh) {
        window.DienTu.DatTienTrinh(percent, `Nex Launcher - ${t('recovering_title')}: ${percent}%`);
      }
    });
  }
  btnBatDauKhoiPhuc?.addEventListener('click', async () => {
    let drive = inputDuongDanKhoiPhuc.value.trim();
    if (!drive) {
      HienThongBao(t('enter_scan_drive'), 'canh-bao');
      return;
    }
    if (!thuMucLuuKhoiPhuc) {
      HienThongBao("Vui lĂ²ng chá»n thÆ° má»¥c lÆ°u káº¿t quáº£ khĂ´i phá»¥c", "canh-bao");
      return;
    }
    drive = drive.replace(/\\/g, "").replace(/\//g, "");
    if (drive.length === 1) drive += ":";
    if (!drive.startsWith("\\\\.\\")) {
      drive = "\\\\.\\" + drive;
    }
    btnBatDauKhoiPhuc.disabled = true;
    divTienTrinhKhoiPhuc.style.display = "block";
    txtTienTrinhKhoiPhuc.textContent = "Äang báº¯t Ä‘áº§u quĂ©t...";
    thanhTienTrinhKhoiPhuc.style.width = "0%";
    if (window.DienTu.DatTienTrinh) {
      window.DienTu.DatTienTrinh(0, t('start_recover_title'));
    }
    try {
      const ketQua = await window.DienTu.KhoiPhucDuLieu(drive, thuMucLuuKhoiPhuc);
      if (ketQua) {
        HienThongBao(t('recovery_complete'), 'thanh-cong');
        txtTienTrinhKhoiPhuc.textContent = t('completed');
        thanhTienTrinhKhoiPhuc.style.width = "100%";
      } else {
        HienThongBao(t('recovery_error_admin'), 'loi');
        divTienTrinhKhoiPhuc.style.display = "none";
      }
    } catch (e) {
      HienThongBao(t('general_error') + e.message, "loi");
      divTienTrinhKhoiPhuc.style.display = "none";
    }
  });
});

function HienThiTanDuTrongTienTrinh(leftovers) {
  return new Promise((resolve) => {
    let dsApp = document.getElementById('tien-trinh-danh-sach');
    let dsSum = document.getElementById('tien-trinh-tong-ket-don-dep');
    let regSum = document.getElementById('tong-ket-registry');
    let fileSum = document.getElementById('tong-ket-tep-tin');
    let btnDong = document.getElementById('dong-tien-trinh');
    let btnNext = document.getElementById('tiep-theo-tien-trinh');
    let tieuDe = document.getElementById('tien-trinh-tieu-de');

    if (tieuDe) tieuDe.textContent = t('cleanup_status') || 'Đang dọn dẹp tàn dư hệ thống...';
    if (dsApp) dsApp.style.display = 'none';
    if (dsSum) {
      dsSum.style.display = 'flex';
      if (regSum) regSum.innerHTML = '';
      if (fileSum) fileSum.innerHTML = '';

      let regItems = leftovers.filter(i => i.type === 'registry');
      let fileItems = leftovers.filter(i => i.type !== 'registry');

      if (regItems.length === 0 && regSum) {
        let d = document.createElement('div'); d.textContent = t('no_registry_leftovers') || 'Không tìm thấy tàn dư Registry nào.'; d.style.fontStyle = 'italic'; d.style.opacity = '0.7'; d.style.fontSize = '0.857rem'; regSum.appendChild(d);
      } else if (regSum) {
        regItems.forEach((r, i) => {
          let d = document.createElement('div');
          d.className = 'TuyChonCheckbox';
          d.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; text-align: left; padding: 4px 8px; border-radius: var(--do-bo-nho); border-bottom: 1px solid var(--vien-nhat);';
          d.innerHTML = `<input type="checkbox" class="OChon chk-tan-du" checked value="${i}" data-type="registry" style="margin-top: 0; flex-shrink: 0;"><span style="font-size: 0.857rem; color: var(--chu-chinh); word-break: break-all; font-family: monospace;">${r.path}</span>`;
          regSum.appendChild(d);
        });
      }

      if (fileItems.length === 0 && fileSum) {
        let d = document.createElement('div'); d.textContent = t('no_file_leftovers') || 'Không tìm thấy tệp tin tàn dư nào.'; d.style.fontStyle = 'italic'; d.style.opacity = '0.7'; d.style.fontSize = '0.857rem'; fileSum.appendChild(d);
      } else if (fileSum) {
        fileItems.forEach((f, i) => {
          let d = document.createElement('div');
          d.className = 'TuyChonCheckbox';
          d.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; text-align: left; padding: 4px 8px; border-radius: var(--do-bo-nho); border-bottom: 1px solid var(--vien-nhat);';
          d.innerHTML = `<input type="checkbox" class="OChon chk-tan-du" checked value="${i}" data-type="file" style="margin-top: 0; flex-shrink: 0;"><span style="font-size: 0.857rem; color: var(--chu-chinh); word-break: break-all; font-family: monospace;">${f.path}</span>`;
          fileSum.appendChild(d);
        });
      }
    }

    if (btnDong) {
      btnDong.textContent = t('close_btn');
      btnDong.className = 'Nut Nut--Huy';
      btnDong.disabled = false;
      btnDong.style.opacity = '1';
      btnDong.dataset.isNext = 'false';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = t('delete_leftovers') || 'Xóa tàn dư';
      btnNext.disabled = false;
      btnNext.className = 'Nut Nut--nguy-hiem';
    }

    let btnHuyHandler = () => {
      cleanup();
      BatTatHopThoai('hop-thoai-tien-trinh', false);
      let mini = document.getElementById('sidebar-mini-progress');
      if (mini) mini.style.display = 'none';
      resolve();
    };

    let btnNextHandler = async () => {
      if (btnNext) {
        btnNext.disabled = true;
        btnNext.textContent = t('processing');
      }
      let thanh = document.getElementById('tien-trinh-thanh');
      if (thanh) {
        thanh.style.width = '0%';
        thanh.style.animation = '';
        thanh.style.backgroundColor = 'var(--nguy-hiem)';
      }
      let pt = document.getElementById('tien-trinh-phan-tram');
      if (pt) pt.textContent = '0%';

      let selectedLeftovers = [];
      let regItems = leftovers.filter(i => i.type === 'registry');
      let fileItems = leftovers.filter(i => i.type !== 'registry');

      document.querySelectorAll('#tong-ket-registry .chk-tan-du:checked').forEach(c => {
        selectedLeftovers.push(regItems[parseInt(c.value)]);
      });
      document.querySelectorAll('#tong-ket-tep-tin .chk-tan-du:checked').forEach(c => {
        selectedLeftovers.push(fileItems[parseInt(c.value)]);
      });

      if (selectedLeftovers.length > 0 && window.DienTu && window.DienTu.XoaTanDuThucSu) {
        await window.DienTu.XoaTanDuThucSu(selectedLeftovers);
      }

      if (thanh) {
        thanh.style.width = '100%';
        thanh.style.animation = 'none';
        thanh.style.backgroundColor = 'var(--thanh-cong)';
      }
      if (pt) pt.textContent = '100%';
      if (tieuDe) tieuDe.textContent = t('completed');

      document.querySelectorAll('.chk-tan-du').forEach(c => {
        let parent = c.parentElement;
        if (c.checked) {
          let pathText = c.nextSibling ? c.nextSibling.textContent : '';
          parent.innerHTML = `<span style="font-size: 0.857rem; color: var(--chu-chinh);"><span style="color:var(--thanh-cong)">✔</span> ${t('deleted') || 'Đã xóa'}: ${pathText}</span>`;
        } else {
          parent.style.opacity = '0.5';
          c.disabled = true;
        }
      });

      if (btnNext) btnNext.style.display = 'none';
      if (btnDong) {
        btnDong.textContent = t('close_btn');
        btnDong.className = 'Nut Nut--chinh';
      }

      cleanup();

      let closeAppHandler = () => {
        if (btnDong) btnDong.removeEventListener('click', closeAppHandler);
        BatTatHopThoai('hop-thoai-tien-trinh', false);
        let mini = document.getElementById('sidebar-mini-progress');
        if (mini) mini.style.display = 'none';
        resolve();
      };
      if (btnDong) btnDong.addEventListener('click', closeAppHandler);
    };

    function cleanup() {
      if (btnDong) btnDong.removeEventListener('click', btnHuyHandler);
      if (btnNext) btnNext.removeEventListener('click', btnNextHandler);
    }

    if (btnDong) btnDong.addEventListener('click', btnHuyHandler);
    if (btnNext) btnNext.addEventListener('click', btnNextHandler);
  });
}


async function TaiDanhSachDiemKhoiPhucCu() {
  let oldContainer = document.getElementById('danh-sach-diem-khoi-phuc-cu');
  let loading = document.getElementById('diem-khoi-phuc-loading');
  if (!oldContainer || !loading) return;

  loading.style.display = 'inline-flex';
  oldContainer.innerHTML = '';

  try {
    if (window.DienTu && window.DienTu.LayDanhSachDiemKhoiPhuc) {
      let rpList = await window.DienTu.LayDanhSachDiemKhoiPhuc();
      loading.style.display = 'none';

      if (rpList && rpList.length > 0) {
        // reverse to show newest first
        rpList.reverse().forEach(rp => {
          let dateStr = "Unknown Date";
          if (rp.CreationTime) {
            if (typeof rp.CreationTime === 'string' && rp.CreationTime.includes('/Date(')) {
              let msMatch = rp.CreationTime.match(/\d+/);
              if (msMatch) dateStr = new Date(parseInt(msMatch[0])).toLocaleString();
            } else {
              dateStr = new Date(rp.CreationTime).toLocaleString();
            }
          }

          let el = document.createElement('div');
          el.style.cssText = 'padding: 12px; background: var(--nen-tang); border: 1px solid var(--vien); border-radius: var(--do-bo); display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;';
          el.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
                            <span style="font-weight: 600; font-size: 0.95rem; color: var(--chu-chinh); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${rp.Description || 'System Restore Point'}">${rp.Description || 'System Restore Point'}</span>
                            <span style="font-size: 0.8rem; color: var(--chu-phu);">${dateStr}</span>
                        </div>
                        <button class="Nut Nut--Huy btn-delete-rp" data-seq="${rp.SequenceNumber}" style="padding: 6px 10px; font-size: 0.85rem; margin-left: 12px;">Xóa</button>
                    `;
          oldContainer.appendChild(el);
        });

        document.querySelectorAll('.btn-delete-rp').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            let btnEl = e.currentTarget;
            let seq = btnEl.getAttribute('data-seq');
            btnEl.disabled = true;
            btnEl.textContent = 'Đang xóa...';
            try {
              await window.DienTu.XoaDiemKhoiPhuc(parseInt(seq));
              btnEl.closest('div').remove();
            } catch (err) {
              btnEl.disabled = false;
              btnEl.textContent = 'Lỗi';
            }
          });
        });
      } else {
        oldContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--chu-phu); font-size: 0.9rem;">Không có điểm khôi phục nào trên máy.</div>';
      }
    }
  } catch (e) {
    loading.style.display = 'none';
    oldContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--nguy-hiem); font-size: 0.9rem;">Lỗi khi tải danh sách điểm khôi phục. (Yêu cầu quyền Admin)</div>';
  }
}



// --- MOUSE LOCK UI LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
  const btnSetMonitor = document.getElementById('btn-set-lock-monitor');
  const shortcutMonitor = document.getElementById('shortcut-lock-monitor');
  
  if (btnSetMonitor) {
    btnSetMonitor.addEventListener('click', () => {
      // Mock UI change
      shortcutMonitor.value = 'Nhấn phím...';
      setTimeout(() => { shortcutMonitor.value = 'Ctrl+Alt+M'; }, 1500);
      // window.DienTu.invoke('set_mouse_lock_shortcut', { mode: 'monitor', ... })
    });
  }

  const btnSetArea = document.getElementById('btn-set-lock-area');
  const shortcutArea = document.getElementById('shortcut-lock-area');
  const btnSelectWindow = document.getElementById('btn-select-window');
  const selectedWindowName = document.getElementById('selected-window-name');

  if (btnSelectWindow) {
    btnSelectWindow.addEventListener('click', () => {
      selectedWindowName.textContent = 'Đang chọn...';
      setTimeout(() => { selectedWindowName.textContent = 'Cửa sổ: Task Manager'; }, 1500);
    });
  }

  if (btnSetArea) {
    btnSetArea.addEventListener('click', () => {
      shortcutArea.value = 'Nhấn phím...';
      setTimeout(() => { shortcutArea.value = 'Ctrl+Alt+A'; }, 1500);
    });
  }

  const btnSetPoint = document.getElementById('btn-set-lock-point');
  const shortcutPoint = document.getElementById('shortcut-lock-point');

  if (btnSetPoint) {
    btnSetPoint.addEventListener('click', () => {
      shortcutPoint.value = 'Nhấn phím...';
      setTimeout(() => { shortcutPoint.value = 'Ctrl+Alt+P'; }, 1500);
    });
  }
});


// --- UX IMPROVEMENTS: Escape to close modals & dropdowns, Focus management ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // 1. Close dropdowns
    document.querySelectorAll('.CaiDat_Dropdown.mo').forEach(el => el.classList.remove('mo'));
    
    // 2. Close modals if any is open
    const openModals = document.querySelectorAll('.HopThoai:not(.an)');
    if (openModals.length > 0) {
      // Find the one with highest z-index
      let highestModal = openModals[0];
      let maxZ = parseInt(window.getComputedStyle(highestModal).zIndex) || 0;
      
      openModals.forEach(m => {
        let z = parseInt(window.getComputedStyle(m).zIndex) || 0;
        if (z > maxZ) {
          maxZ = z;
          highestModal = m;
        }
      });
      
      // Close the modal (unless it's the progress modal which shouldn't be canceled by ESC)
      if (highestModal.id !== 'hop-thoai-tien-trinh') {
        BatTatHopThoai(highestModal.id, false);
      }
    }
  }
});

// Overwrite BatTatHopThoai to include focus management
const _originalBatTatHopThoai = window.BatTatHopThoai;
if (_originalBatTatHopThoai) {
  window.BatTatHopThoai = function(id, hien) {
    _originalBatTatHopThoai(id, hien);
    if (hien) {
      const modal = document.getElementById(id);
      if (modal) {
        // Find first focusable element
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
          setTimeout(() => focusable.focus(), 50);
        }
      }
    } else {
      // Restore focus could be added here if we tracked it
    }
  };
}
