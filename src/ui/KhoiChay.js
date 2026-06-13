// Languages duoc load tu Languages.js

var NgonNguHienTai = 'VN', ChuDeHienTai = 'dark', CaiDatTrangHienTai = 0;

function KhoiTaoNgonNgu() {
  var l = localStorage.getItem('nex_ngon_ngu');
  NgonNguHienTai = l || (navigator.language.startsWith('vi') ? 'VN' : 'EN');
}
function DatNgonNgu(m) { NgonNguHienTai = m; localStorage.setItem('nex_ngon_ngu', m); CapNhatBanDich(); }
function LayNgonNgu() { return NgonNguHienTai; }
function t(k) { return (Languages[NgonNguHienTai] && Languages[NgonNguHienTai][k]) || k; }
function CapNhatBanDich() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) { var k = el.getAttribute('data-i18n'), v = t(k); if (v !== k) el.textContent = v; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) { var k = el.getAttribute('data-i18n-placeholder'), v = t(k); if (v !== k) el.placeholder = v; });
}

function KhoiTaoChuDe() { ChuDeHienTai = localStorage.getItem('nex_chu_de') || 'dark'; ApDungChuDe(ChuDeHienTai); }
function DatChuDe(c) { ChuDeHienTai = c; localStorage.setItem('nex_chu_de', c); ApDungChuDe(c); }
function LayChuDe() { return ChuDeHienTai; }
function ApDungChuDe(c) {
  var cd = c; if (c === 'system') { cd = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  var html = document.documentElement; html.classList.add('dang-chuyen-chu-de'); html.setAttribute('data-chu-de', cd);
  setTimeout(function() { html.classList.remove('dang-chuyen-chu-de'); }, 400);
}

var DanhSachPhanMem = [], DanhSachDaCaiDat = [], TrangHienTai = 'installer', BoLocHienTai = 'all', CotSapXep = 'name', HuongSapXep = true;

document.addEventListener('DOMContentLoaded', async function() {
  KhoiTaoChuDe(); KhoiTaoNgonNgu(); CapNhatBanDich(); DangKySuKien();
  DanhSachPhanMem = await window.DienTu.LayDanhSachUngDung();
  HienThiDanhSachInstaller();
  DanhSachDaCaiDat = await window.DienTu.LayPhanMemDaCai();
  HienThiDanhSachUninstaller();

  if (window.DienTu.KhiTienTrinhCaiDat) {
      window.DienTu.KhiTienTrinhCaiDat((dl) => {
          let tb = NgonNguHienTai === 'VN' ? 'Đang cài đặt' : 'Installing';
          if (dl.status === 'downloading') tb = (NgonNguHienTai === 'VN' ? 'Đang tải ' : 'Downloading ') + dl.percent + '%';
          HienThongBao(tb + ': ' + dl.name, 'thong-tin');
      });
  }
  if (window.DienTu.KhiTienTrinhGoCaiDat) {
      window.DienTu.KhiTienTrinhGoCaiDat((dl) => {
          HienThongBao((NgonNguHienTai === 'VN' ? 'Đang gỡ ' : 'Uninstalling ') + dl.name, 'thong-tin');
      });
  }
});

function DangKySuKien() {
  document.getElementById('nut-thu-nho')?.addEventListener('click', function() { window.DienTu?.ThuNho(); });
  document.getElementById('nut-phong-to')?.addEventListener('click', function() { window.DienTu?.PhongTo(); });
  document.getElementById('nut-dong')?.addEventListener('click', function() { window.DienTu?.DongCuaSo(); });
  if (window.DienTu?.KhiTrangThaiCuaSoThayDoi) window.DienTu.KhiTrangThaiCuaSoThayDoi(function(dl) { document.body.classList.toggle('da-phong-to', dl.DaPhongTo); });
  if (window.DienTu?.KhiChuyenTrang) window.DienTu.KhiChuyenTrang(function(trang) { ChuyenTrang(trang); });

  document.getElementById('nut-thu-gon-menu')?.addEventListener('click', function() { 
    var tb = document.getElementById('thanh-ben');
    if (!tb) return;
    tb.classList.toggle('thu-gon'); 
    var icon = document.getElementById('icon-thu-gon');
    if (icon) {
      if (tb.classList.contains('thu-gon')) {
        icon.innerHTML = '<path d="M4.13 3.05a4.264 4.264 0 0 0-1.08 1.08A6.143 6.143 0 0 0 2 7.81v8.38C2 19.83 4.17 22 7.81 22h7.47V2H7.81a6.143 6.143 0 0 0-3.68 1.05zM8.5 9.971A.75.75 0 1 1 9.556 8.91l2.56 2.56a.749.749 0 0 1 0 1.06l-2.56 2.56A.75.75 0 0 1 8.5 14.029L10.525 12zM22 7.81v8.38a6.143 6.143 0 0 1-1.05 3.68 4.264 4.264 0 0 1-1.08 1.08 5.779 5.779 0 0 1-3.09 1.03V2.03C20.06 2.24 22 4.37 22 7.81z"></path>';
      } else {
        icon.innerHTML = '<path d="M2 7.81v8.38c0 1.49.36 2.73 1.05 3.68.29.42.66.79 1.08 1.08.82.6 1.86.95 3.09 1.03V2.03C3.94 2.24 2 4.37 2 7.81zM20.95 4.13c-.29-.42-.66-.79-1.08-1.08C18.92 2.36 17.68 2 16.19 2H8.72v20h7.47c3.64 0 5.81-2.17 5.81-5.81V7.81c0-1.49-.36-2.73-1.05-3.68zm-5.45 9.9c.29.29.29.77 0 1.06-.15.15-.34.22-.53.22s-.38-.07-.53-.22l-2.56-2.56a.754.754 0 0 1 0-1.06l2.56-2.56c.29-.29.77-.29 1.06 0s.29.77 0 1.06L13.48 12z"></path>';
      }
    }
  });

  var NutMenu = document.getElementById('nut-menu-chinh'), MenuDD = document.getElementById('menu-dropdown');
  if (NutMenu && MenuDD) {
    NutMenu.addEventListener('click', function(e) { e.stopPropagation(); MenuDD.classList.toggle('an'); });
    document.addEventListener('click', function() { MenuDD.classList.add('an'); });
  }

  document.getElementById('menu-cai-dat')?.addEventListener('click', function() { MenuDD.classList.add('an'); MoHopThoaiCaiDat(); });
  document.getElementById('menu-gioi-thieu')?.addEventListener('click', function() { MenuDD.classList.add('an'); BatTatHopThoai('hop-thoai-gioi-thieu', true); });
  document.getElementById('menu-cap-nhat')?.addEventListener('click', function() { MenuDD.classList.add('an'); KiemTraCapNhat(); });
  document.getElementById('dong-gioi-thieu')?.addEventListener('click', function() { BatTatHopThoai('hop-thoai-gioi-thieu', false); });
  document.getElementById('dong-cai-dat')?.addEventListener('click', function() { BatTatHopThoai('hop-thoai-cai-dat', false); });
  document.getElementById('caidat-huy')?.addEventListener('click', function() { BatTatHopThoai('hop-thoai-cai-dat', false); });
  document.getElementById('lop-phu-modal')?.addEventListener('click', function() {
    document.querySelectorAll('.HopThoai:not(.an)').forEach(function(h) { h.classList.add('an'); });
    document.getElementById('lop-phu-modal')?.classList.add('an');
  });

  document.getElementById('nav-installer')?.addEventListener('click', function() { ChuyenTrang('installer'); });
  document.getElementById('nav-uninstaller')?.addEventListener('click', function() { ChuyenTrang('uninstaller'); });

  document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function(n) {
    n.addEventListener('click', function() {
      BoLocHienTai = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function(m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); HienThiDanhSachInstaller();
    });
  });
  document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function(n) {
    n.addEventListener('click', function() {
      var bl = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function(m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); LocDanhSachUninstaller(bl);
    });
  });

  document.getElementById('o-tim-kiem-installer')?.addEventListener('input', function(e) { HienThiDanhSachInstaller(e.target.value); });
  document.getElementById('o-tim-kiem-uninstaller')?.addEventListener('input', function(e) { HienThiDanhSachUninstaller(e.target.value); });

  document.getElementById('chon-tat-ca-installer')?.addEventListener('change', function(e) {
    document.querySelectorAll('#danh-sach-installer .OChon').forEach(function(cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
  });
  document.getElementById('chon-tat-ca-uninstaller')?.addEventListener('change', function(e) {
    document.querySelectorAll('#danh-sach-uninstaller .OChon').forEach(function(cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
    CapNhatSoLuongDaChon();
  });

  document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function(c) {
    c.addEventListener('click', function() {
      var tr = c.getAttribute('data-sap-xep');
      if (CotSapXep === tr) HuongSapXep = !HuongSapXep; else { CotSapXep = tr; HuongSapXep = true; }
      document.querySelectorAll('.TieuDeCot_Cot.sap-xep').forEach(function(x) { x.classList.remove('tang', 'giam'); });
      c.classList.add(HuongSapXep ? 'tang' : 'giam');
      if (TrangHienTai === 'installer') HienThiDanhSachInstaller(); else HienThiDanhSachUninstaller();
    });
  });

  var DangXuLyCaiDat = false;
  document.getElementById('nut-cai-dat')?.addEventListener('click', async function() {
    if (DangXuLyCaiDat) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    
    var danhSachChon = [];
    dc.forEach(function(cb) {
        var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_ThongTinChinh span')?.textContent || cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
        var pm = DanhSachPhanMem.find(p => p.name === ten);
        if (pm) danhSachChon.push(pm);
    });

    DangXuLyCaiDat = true;
    HienThongBao(t('start_installing') + danhSachChon.length + t('apps_suffix'), 'thong-tin');
    
    var ketQua = await window.DienTu.TienHanhCaiDat(danhSachChon);
    if (ketQua) {
      var thanhCong = ketQua.filter(k => k.success).length;
      HienThongBao(t('finish_installing') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
    }
    DangXuLyCaiDat = false;
  });

  var DangLamMoi = false;
  document.getElementById('nut-lam-moi')?.addEventListener('click', async function() {
    if (DangLamMoi) { HienThongBao(t('slow_down'), 'canh-bao'); return; }
    DangLamMoi = true;
    var btn = this; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none';
    HienThongBao(t('refreshing_list'), 'thong-tin');
    DanhSachDaCaiDat = await window.DienTu.LayPhanMemDaCai(); HienThiDanhSachUninstaller();
    HienThongBao(t('list_refreshed'), 'thanh-cong');
    setTimeout(() => { DangLamMoi = false; btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }, 2000);
  });

  var DangXuLyGoCaiDat = false;
  document.getElementById('nut-go-cai-dat')?.addEventListener('click', async function() {
    if (DangXuLyGoCaiDat) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    
    var danhSachChon = [];
    dc.forEach(function(cb) {
        var ten = cb.dataset.ten;
        var pm = DanhSachDaCaiDat.find(p => p.name === ten);
        if (pm) danhSachChon.push(pm);
    });

    DangXuLyGoCaiDat = true;
    HienThongBao(t('start_uninstalling') + danhSachChon.length + t('apps_suffix'), 'thong-tin');
    
    var ketQua = await window.DienTu.TienHanhGoCaiDat(danhSachChon);
    if (ketQua) {
      var thanhCong = ketQua.filter(k => k.success).length;
      HienThongBao(t('finish_uninstalling') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
      DanhSachDaCaiDat = await window.DienTu.LayPhanMemDaCai(); HienThiDanhSachUninstaller();
    }
    DangXuLyGoCaiDat = false;
  });

  document.getElementById('nut-them-moi')?.addEventListener('click', function() {
    var modal = document.getElementById('hop-thoai-them-app');
    var lopPhu = document.getElementById('lop-phu-modal');
    if (modal && lopPhu) {
      document.getElementById('them-app-ten').value = '';
      document.getElementById('them-app-loai').value = '';
      document.getElementById('them-app-id').value = '';
      modal.classList.remove('an');
      lopPhu.classList.remove('an');
    }
  });

  document.getElementById('dong-them-app')?.addEventListener('click', function() {
    document.getElementById('hop-thoai-them-app')?.classList.add('an');
    document.getElementById('lop-phu-modal')?.classList.add('an');
  });

  document.getElementById('luu-them-app')?.addEventListener('click', async function() {
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
      source: { type: kieu, value: id, silent_args: "" }
    };
    var success = await window.DienTu.ThemUngDungInstaller(appInfo);
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

  document.getElementById('btn-tim-winget')?.addEventListener('click', async function() {
    var tuKhoa = document.getElementById('them-app-id').value.trim() || document.getElementById('them-app-ten').value.trim();
    if (!tuKhoa) {
      HienThongBao(t('enter_name_keyword'), 'canh-bao');
      return;
    }
    HienThongBao(t('searching_winget'), 'thong-tin');
    var result = await window.DienTu.TimKiemWinget(tuKhoa);
    if (result && result.length > 0) {
      var chon = prompt(t('found_results').replace('{0}', result.length) + result.map(r => r.name + ' (' + r.id + ')').join('\n'), result[0].id);
      if (chon) {
        document.getElementById('them-app-id').value = chon;
        var kn = document.getElementById('them-app-kieu-nguon');
        kn.dataset.value = 'Winget';
        kn.querySelector('.NhanText').textContent = 'Winget';
        document.getElementById('btn-tim-winget').style.display = 'flex';
      }
    } else {
      HienThongBao(t('no_results_winget'), 'canh-bao');
    }
  });

  document.getElementById('nut-xoa-chon')?.addEventListener('click', async function() {
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected'), 'canh-bao'); return; }
    
    var danhSachTen = [];
    dc.forEach(function(cb) {
        var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_ThongTinChinh span')?.textContent || cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
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
  document.querySelectorAll('.Trang').forEach(function(t) { t.classList.remove('dang-hien'); });
  document.getElementById('trang-' + trang)?.classList.add('dang-hien');
  var ni = document.getElementById('nav-installer'), nu = document.getElementById('nav-uninstaller');
  var di = document.getElementById('ds-installer'), du = document.getElementById('ds-uninstaller');
  ni?.classList.toggle('dang-chon', trang === 'installer'); ni?.classList.toggle('dang-mo', trang === 'installer');
  nu?.classList.toggle('dang-chon', trang === 'uninstaller'); nu?.classList.toggle('dang-mo', trang === 'uninstaller');
  di?.classList.toggle('dang-mo', trang === 'installer'); du?.classList.toggle('dang-mo', trang === 'uninstaller');
  if (trang === 'uninstaller') { var m = du?.querySelector('.ThanhBen_MucCon'); if (m && !du.querySelector('.dang-chon')) m.classList.add('dang-chon'); }
}

function HienThiDanhSachInstaller(TuKhoa) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-installer'); if (!ct) return; ct.innerHTML = '';
  var ds = DanhSachPhanMem.slice();
  if (BoLocHienTai === 'apps') ds = ds.filter(function(p) { return p.type === 'app'; });
  else if (BoLocHienTai === 'games') ds = ds.filter(function(p) { return p.type === 'game'; });
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function(p) { return p.name.toLowerCase().includes(tk) || p.category.toLowerCase().includes(tk); }); }
  ds.sort(function(a, b) { var gA, gB; switch (CotSapXep) { case 'category': gA = a.category; gB = b.category; break; case 'source': gA = a.source.type; gB = b.source.type; break; default: gA = a.name; gB = b.name; } return (HuongSapXep ? 1 : -1) * gA.localeCompare(gB); });
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_results') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_results_desc') + '</div></div>'; return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangInstaller(pm)); });
}

function TaoHangInstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name + '"></div><div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_Loai"><span>' + pm.category + '</span></div><div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--' + pm.source.type.toLowerCase() + '">' + pm.source.type + '</span><button class="NutSuaNho" title="' + t('edit_btn') + '" onclick="event.stopPropagation()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button></div>';
  d.addEventListener('click', function(e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); } });
  d.querySelector('.OChon')?.addEventListener('change', function() { d.classList.toggle('da-chon', this.checked); });
  return d;
}

function HienThiDanhSachUninstaller(TuKhoa) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return; ct.innerHTML = '';
  var ds = DanhSachDaCaiDat.slice();
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function(p) { return p.name.toLowerCase().includes(tk) || p.publisher.toLowerCase().includes(tk); }); }
  ds.sort(function(a, b) { var gA, gB; switch (CotSapXep) { case 'publisher': gA = a.publisher; gB = b.publisher; break; case 'date': gA = a.installDate; gB = b.installDate; break; case 'size': gA = a.size; gB = b.size; break; default: gA = a.name; gB = b.name; } return (HuongSapXep ? 1 : -1) * String(gA).localeCompare(String(gB)); });
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangUninstaller(pm)); });
}

function TaoHangUninstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  var idIcon = 'icon-' + Math.random().toString(36).substring(2, 9);
  
  var formattedDate = pm.installDate || t('unknown');
  var dStr = String(formattedDate).replace(/\D/g, '');
  if (dStr.length === 8) {
    var format = t('date_format') || 'DD/MM/YYYY';
    var year = dStr.substring(0,4);
    var month = dStr.substring(4,6);
    var day = dStr.substring(6,8);
    formattedDate = format.replace('YYYY', year).replace('MM', month).replace('DD', day);
  }
  
  var displaySize = t('unknown');
  if (pm.size) {
    let bytes = pm.size;
    if (bytes < 1024 * 1024) displaySize = (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else if (bytes < 1024 * 1024 * 1024 * 1024) displaySize = (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    else displaySize = (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
  }


  d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name.replace(/"/g, '&quot;') + '"></div>' +
                '<div class="HangUngDung_Icon"><img id="' + idIcon + '" src="TaiNguyen/BieuTuong/what_app.svg" alt="icon"></div>' +
                '<div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_NhaPhatHanh">' + (pm.publisher || t('unknown')) + '</div><div class="HangUngDung_Ngay">' + formattedDate + '</div><div class="HangUngDung_DungLuong">' + displaySize + '</div>';
  d.addEventListener('click', function(e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatSoLuongDaChon(); } });
  d.querySelector('.OChon')?.addEventListener('change', function() { d.classList.toggle('da-chon', this.checked); CapNhatSoLuongDaChon(); });
  
  if (!window.ObserverIcon) {
    window.ObserverIcon = new IntersectionObserver(async (entries, obs) => {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          let el = entry.target;
          obs.unobserve(el);
          let appName = el.dataset.appName;
          let iconId = el.dataset.iconId;
          if (appName && window.DienTu) {
            if (window.DienTu.LayIconApp) {
              window.DienTu.LayIconApp(appName).then(base64 => {
                let imgContainer = document.getElementById(iconId);
                if (imgContainer) {
                  if (base64) {
                    imgContainer.outerHTML = '<img id="' + iconId + '" src="' + base64 + '">';
                  } else {
                    imgContainer.outerHTML = '<img id="' + iconId + '" src="TaiNguyen/BieuTuong/what_app.svg">';
                  }
                }
              }).catch(e => {
                let imgContainer = document.getElementById(iconId);
                if (imgContainer) imgContainer.outerHTML = '<img id="' + iconId + '" src="TaiNguyen/BieuTuong/what_app.svg">';
              });
            }
            if (window.DienTu.LayThongTinThem && (el.dataset.needDate === 'true' || el.dataset.needSize === 'true')) {
              window.DienTu.LayThongTinThem(appName).then(info => {
                if (info) {
                  if (el.dataset.needDate === 'true' && info.date) {
                    let dStr = info.date;
                    let format = t('date_format') || 'DD/MM/YYYY';
                    let y = dStr.substring(0,4), m = dStr.substring(4,6), day = dStr.substring(6,8);
                    let fDate = format.replace('YYYY', y).replace('MM', m).replace('DD', day);
                    let ngayEl = el.querySelector('.HangUngDung_Ngay');
                    if (ngayEl) { ngayEl.textContent = fDate; ngayEl.style.color = '#e2b340'; ngayEl.title = t('estimated'); }
                  }
                  if (el.dataset.needSize === 'true' && info.size) {
                    let sizeEl = el.querySelector('.HangUngDung_DungLuong');
                    if (sizeEl) { sizeEl.textContent = info.size; sizeEl.style.color = '#e2b340'; sizeEl.title = t('estimated'); }
                  }
                }
              }).catch(e => {});
            }
          }
        }
      }
    }, { root: null, rootMargin: '100px', threshold: 0 });
  }
  
  d.dataset.appName = pm.name;
  d.dataset.iconId = idIcon;
  if (!pm.installDate) d.dataset.needDate = 'true';
  if (!pm.size) d.dataset.needSize = 'true';
  window.ObserverIcon.observe(d);

  return d;
}

function LocDanhSachUninstaller(bl) {
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return; ct.innerHTML = '';
  var ds = DanhSachDaCaiDat.slice();
  switch (bl) {
    case 'system': 
      ds = ds.filter(function(p) { return p.publisher && (p.publisher.toLowerCase().includes('microsoft') || p.publisher.toLowerCase().includes('intel') || p.publisher.toLowerCase().includes('amd') || p.publisher.toLowerCase().includes('nvidia')); }); 
      break;
    case 'external': 
      ds = ds.filter(function(p) { return !(p.publisher && (p.publisher.toLowerCase().includes('microsoft') || p.publisher.toLowerCase().includes('intel') || p.publisher.toLowerCase().includes('amd') || p.publisher.toLowerCase().includes('nvidia'))); }); 
      break;
    case 'large': 
      ds = ds.filter(function(p) { 
        if (!p.size) return false;
        var s = String(p.size).toLowerCase(); 
        if (s.includes('gb')) return true;
        if (s.includes('mb')) {
            var val = parseFloat(s.replace(/[^0-9.]/g, ''));
            return val > 500;
        }
        return false;
      }); 
      break;
    case 'recent': 
      var g = new Date(); 
      g.setMonth(g.getMonth() - 3); 
      ds = ds.filter(function(p) { 
        if (!p.installDate) return false;
        var dStr = String(p.installDate).replace(/\D/g, '');
        if (dStr.length === 8) {
            var y = parseInt(dStr.substring(0,4));
            var m = parseInt(dStr.substring(4,6)) - 1;
            var d = parseInt(dStr.substring(6,8));
            return new Date(y, m, d) >= g;
        }
        return new Date(p.installDate) >= g; 
      }); 
      break;
  }
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangUninstaller(pm)); });
}

function CapNhatSoLuongDaChon() {
  var sl = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked').length;
  var n = document.getElementById('so-luong-da-chon');
  if (n) n.textContent = t('status_selected').replace('{0}', sl);
}

function BatTatHopThoai(id, ht) {
  var h = document.getElementById(id), lp = document.getElementById('lop-phu-modal');
  if (ht) { h?.classList.remove('an'); lp?.classList.remove('an'); }
  else { h?.classList.add('an'); if (!document.querySelectorAll('.HopThoai:not(.an)').length) lp?.classList.add('an'); }
}

var CaiDatCacTab = ['settings_ui', 'settings_general', 'settings_installer', 'settings_uninstaller'];

function HienHopThoaiTroGiup(tieuDe, noiDung) {
  document.getElementById('tro-giup-tieu-de').textContent = tieuDe;
  document.getElementById('tro-giup-noi-dung').innerHTML = noiDung;
  BatTatHopThoai('hop-thoai-tro-giup', true);
}

function MoHopThoaiCaiDat() {
  var menu = document.getElementById('caidat-menu');
  var nd = document.getElementById('noi-dung-cai-dat');
  menu.innerHTML = '';
  nd.innerHTML = '';

  var ChuDeHT = LayChuDe(), NgonNguHT = LayNgonNgu();

  CaiDatCacTab.forEach(function(tab, i) {
    var btn = document.createElement('button');
    btn.className = 'CaiDat_MucMenu' + (i === 0 ? ' dang-chon' : '');
    btn.textContent = t(tab);
    btn.setAttribute('data-target', 'cai-dat-section-' + i);
    btn.addEventListener('click', function() {
      var target = document.getElementById('cai-dat-section-' + i);
      if (target) {
        nd.scrollTo({ top: target.offsetTop - nd.offsetTop, behavior: 'smooth' });
      }
    });
    menu.appendChild(btn);

    var sec = document.createElement('div');
    sec.id = 'cai-dat-section-' + i;
    sec.className = 'CaiDat_Phan';
    var helpText = '';
    if (i === 0) helpText = (NgonNguHT==='VN'?'Tùy chỉnh giao diện, chủ đề và ngôn ngữ.':'Customize the UI, theme and language.');
    if (i === 1) helpText = t('help_text_general');
    if (i === 2) helpText = t('help_text_installer');
    if (i === 3) helpText = t('help_text_uninstaller');
    var helpSvg = '<svg width="18" height="18" viewBox="-2 -2 104 104" fill="none" style="opacity:0.6; cursor:pointer; margin-left:8px;" title="' + t(tab) + ' (Trợ giúp)" onclick="HienHopThoaiTroGiup(\'' + t(tab) + '\', decodeURIComponent(\'' + encodeURIComponent(helpText) + '\'))"><circle cx="50" cy="50" r="50" stroke="currentColor" stroke-width="8"></circle><g transform="matrix(0.7,0,0,0.7,15,15)"><path d="M47.633 2.5c-2.126.242-4.603.367-7.017.829-5.655 1.08-10.71 3.485-14.87 7.529a10.294 10.294 0 0 0-.55 14.227c2.948 3.352 7.325 3.341 11.986-.031.32-.233.647-.458.962-.697 3.48-2.64 7.466-3.674 11.727-3.249 3.515.352 6.526 1.861 7.782 5.494 1.213 3.506-.484 6.153-2.95 8.393-1.237 1.125-2.663 2.046-4.011 3.049-8.1 6.019-11.618 15.485-9.127 24.568 1.185 4.322 3.199 6.59 5.846 6.586 2.59-.003 4.563-2.035 5.716-6.333 1.198-4.461 3.49-8.197 7.013-11.104 2.819-2.325 5.902-4.325 8.742-6.623 8.88-7.187 11.038-18.305 5.399-28.203C68.49 6.772 59.069 3.132 47.633 2.5zM49.12 76.368c-6.542.01-10.696 4.033-10.682 10.346.014 6.241 4.46 10.807 10.502 10.786 6.34-.022 10.896-4.534 10.865-10.76-.03-6.339-4.197-10.383-10.685-10.372z" fill="currentColor"></path></g></svg>';
    
    sec.innerHTML = '<div class="CaiDat_TieuDePhan" style="display:flex; align-items:center;">' + t(tab) + helpSvg + '</div>' + LayHTMLCaiDatTrang(i, ChuDeHT, NgonNguHT);
    nd.appendChild(sec);
  });

  // Gắn sự kiện cuộn để cập nhật menu
  nd.addEventListener('scroll', function() {
    var fromTop = nd.scrollTop + 60; // offset
    var secs = nd.querySelectorAll('.CaiDat_Phan');
    var current = secs[0].id;
    secs.forEach(function(sec) {
      if ((sec.offsetTop - nd.offsetTop) <= fromTop) current = sec.id;
    });
    menu.querySelectorAll('.CaiDat_MucMenu').forEach(function(m) {
      m.classList.toggle('dang-chon', m.getAttribute('data-target') === current);
    });
  });

  // Gắn sự kiện cho các control bên trong
  nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var cd = btn.getAttribute('data-chu-de');
      if (btn.classList.contains('dang-chon')) { DatChuDe('system'); nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(b) { b.classList.remove('dang-chon'); }); HienThongBao(t('system_label'), 'thong-tin'); return; }
      nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(b) { b.classList.remove('dang-chon'); });
      btn.classList.add('dang-chon'); DatChuDe(cd);
    });
  });
  nd.querySelectorAll('.ChonNgonNgu_Nut').forEach(function(btn) {
    btn.addEventListener('click', function() {
      nd.querySelectorAll('.ChonNgonNgu_Nut').forEach(function(b) { b.classList.remove('dang-chon'); });
      btn.classList.add('dang-chon'); DatNgonNgu(btn.getAttribute('data-ngon-ngu')); MoHopThoaiCaiDat();
    });
  });
  document.getElementById('caidat-co-chu')?.addEventListener('input', function() { document.getElementById('caidat-co-chu-gt').textContent = this.value + ' px'; });
  document.getElementById('caidat-trong-suot')?.addEventListener('input', function() { document.getElementById('caidat-trong-suot-gt').textContent = this.value + '%'; });

  var BtnLuu = document.getElementById('caidat-luu'); if (BtnLuu) BtnLuu.onclick = LuuCaiDat;
  var BtnDatLai = document.getElementById('caidat-dat-lai'); if (BtnDatLai) BtnDatLai.onclick = DatLaiCaiDat;
  BatTatHopThoai('hop-thoai-cai-dat', true);
}

let CauHinh = {
  boTron: localStorage.getItem('caidat-bo-tron') !== 'false',
  tatAnim: localStorage.getItem('caidat-tat-anim') === 'true',
  coChu: localStorage.getItem('caidat-co-chu') || 14,
  trongSuot: localStorage.getItem('caidat-trong-suot') || 0
};

function ApDungCauHinh() {
  document.documentElement.style.setProperty('--do-bo', CauHinh.boTron ? '8px' : '0px');
  document.documentElement.style.setProperty('--do-bo-nho', CauHinh.boTron ? '4px' : '0px');
  document.documentElement.style.setProperty('--do-bo-lon', CauHinh.boTron ? '12px' : '0px');
  document.documentElement.style.setProperty('--chuyen-dong', CauHinh.tatAnim ? '0s' : '0.2s cubic-bezier(0.4, 0, 0.2, 1)');
  document.documentElement.style.setProperty('--chuyen-dong-nhanh', CauHinh.tatAnim ? '0s' : '0.15s cubic-bezier(0.4, 0, 0.2, 1)');
  document.documentElement.style.setProperty('--chuyen-dong-cham', CauHinh.tatAnim ? '0s' : '0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  document.body.style.fontSize = CauHinh.coChu + 'px';
  document.body.style.opacity = '';
  document.documentElement.style.setProperty('--alpha-nen', 1 - (CauHinh.trongSuot / 100));
}
ApDungCauHinh();

function LayHTMLCaiDatTrang(i, ChuDeHT, NgonNguHT) {
  if (i === 0) {
    var isSysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var txtLight = NgonNguHT === 'VN' ? 'Sáng' : 'Light';
    var txtDark = NgonNguHT === 'VN' ? 'Tối' : 'Dark';
    var txtSys = NgonNguHT === 'VN' ? 'Hệ thống' : 'System';
    if (isSysDark) txtDark += ' / ' + txtSys; else txtLight += ' / ' + txtSys;

    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:flex-start; gap:12px;"><div class="MucCaiDat_Nhan">' + t('theme_label') + '</div>' +
      '<div class="ChonChuDe">' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'light' ? ' dang-chon' : '') + '" data-chu-de="light"><img src="TaiNguyen/BieuTuong/theme-light.svg" alt="Light"><span>' + txtLight + '</span></div>' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'dark' ? ' dang-chon' : '') + '" data-chu-de="dark"><img src="TaiNguyen/BieuTuong/theme-dark.svg" alt="Dark"><span>' + txtDark + '</span></div>' +
      '</div></div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:flex-start; gap:12px;"><div class="MucCaiDat_Nhan">' + t('lang_label') + '</div>' +
      '<div class="ChonNgonNgu"><button class="ChonNgonNgu_Nut' + (NgonNguHT === 'EN' ? ' dang-chon' : '') + '" data-ngon-ngu="EN">English</button>' +
      '<button class="ChonNgonNgu_Nut' + (NgonNguHT === 'VN' ? ' dang-chon' : '') + '" data-ngon-ngu="VN">Tiếng Việt</button></div></div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:stretch; gap:12px;"><div class="MucCaiDat_Nhan">' + t('font_size_label') + '</div>' +
      '<div class="ThanhTruot"><input type="range" id="caidat-co-chu" min="9" max="24" value="' + CauHinh.coChu + '"><span class="ThanhTruot_GiaTri" id="caidat-co-chu-gt">' + CauHinh.coChu + ' px</span></div></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('rounded_corners') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-bo-tron" ' + (CauHinh.boTron ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('disable_animations') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-tat-anim" ' + (CauHinh.tatAnim ? 'checked' : '') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:stretch; gap:12px; border-bottom:none;"><div class="MucCaiDat_Nhan">' + t('transparency_label') + '</div>' +
      '<div class="ThanhTruot"><input type="range" id="caidat-trong-suot" min="0" max="67" value="' + CauHinh.trongSuot + '"><span class="ThanhTruot_GiaTri" id="caidat-trong-suot-gt">' + CauHinh.trongSuot + '%</span></div></div>' +
      '</div>';
  } else if (i === 1) {
    let aot = localStorage.getItem('caidat-luon-tren') === 'true';
    let mtt = localStorage.getItem('caidat-thu-nho-khay') !== 'false';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('always_on_top') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-luon-tren" ' + (aot?'checked':'') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('minimize_to_tray') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-thu-nho-khay" ' + (mtt?'checked':'') + '><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 2) {
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Tăng tốc độ tải bằng cách sử dụng nhiều kết nối cùng lúc':'Increase download speed by using multiple connections') + '">' + t('multithread') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Tự động đánh dấu tất cả phần mềm khi mở':'Auto select all software on open') + '">' + t('auto_select') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('minimize_install') + '</div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('detailed_categories') + '</div></div><label class="CongTac"><input type="checkbox"><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('show_progress') + '</div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Ẩn các ứng dụng không tương thích với hệ thống hiện tại':'Hide incompatible apps for current system') + '">' + t('hide_unsupported') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox"><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Thông báo khi quá trình cài đặt xong':'Notify when installation is complete') + '">' + t('show_complete') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 3) {
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Gỡ phần mềm tự động không hiện giao diện':'Uninstall software silently without UI') + '">' + t('silent_uninstall') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Hỏi ý kiến trước khi gỡ':'Ask for confirmation before uninstalling') + '">' + t('show_confirmation') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('show_progress_uninstall') + '</div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('show_notification') + '</div></div><label class="CongTac"><input type="checkbox"><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + (NgonNguHT==='VN'?'Thu nhỏ Trình gỡ cài đặt sau khi gỡ xong':'Minimize uninstaller after finishing') + '">' + t('minimize_on_close') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div><label class="CongTac"><input type="checkbox" checked><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  }
}

function LuuCaiDat() { 
  let elBoTron = document.getElementById('caidat-bo-tron');
  if (elBoTron) {
    CauHinh.boTron = elBoTron.checked;
    localStorage.setItem('caidat-bo-tron', CauHinh.boTron);
  }
  let elTatAnim = document.getElementById('caidat-tat-anim');
  if (elTatAnim) {
    CauHinh.tatAnim = elTatAnim.checked;
    localStorage.setItem('caidat-tat-anim', CauHinh.tatAnim);
  }
  let elCoChu = document.getElementById('caidat-co-chu');
  if (elCoChu) {
    CauHinh.coChu = elCoChu.value;
    localStorage.setItem('caidat-co-chu', CauHinh.coChu);
  }
  let elTrongSuot = document.getElementById('caidat-trong-suot');
  if (elTrongSuot) {
    CauHinh.trongSuot = elTrongSuot.value;
    localStorage.setItem('caidat-trong-suot', CauHinh.trongSuot);
  }
  let elLuonTren = document.getElementById('caidat-luon-tren');
  if (elLuonTren) {
    localStorage.setItem('caidat-luon-tren', elLuonTren.checked);
  }
  let elThuNho = document.getElementById('caidat-thu-nho-khay');
  if (elThuNho) {
    localStorage.setItem('caidat-thu-nho-khay', elThuNho.checked);
  }

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
  CauHinh.boTron = true;
  CauHinh.tatAnim = false;
  CauHinh.coChu = 14;
  CauHinh.trongSuot = 0;
  ApDungCauHinh();
  HienThongBao(t('settings_reset'), 'thong-tin'); 
  MoHopThoaiCaiDat(); 
}

function KiemTraCapNhat() {
  HienThongBao(t('update_checking'), 'thong-tin');
  setTimeout(function() { HienThongBao(t('update_latest'), 'thanh-cong'); }, 2000);
}

function HienThongBao(nd, loai) {
  loai = loai || 'thong-tin';
  var vung = document.getElementById('vung-thong-bao'); if (!vung) return;
  
  if (vung.children.length >= 5) {
    var oldTb = vung.children[0];
    oldTb.style.animation = 'mooDan 0.2s forwards';
    setTimeout(function() { if (vung.contains(oldTb)) oldTb.remove(); }, 200);
  }

  var tb = document.createElement('div'); tb.className = 'ThongBao ThongBao--' + loai; tb.textContent = nd;
  vung.appendChild(tb); setTimeout(function() { if (vung.contains(tb)) tb.remove(); }, 4000);
}
