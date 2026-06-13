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
let ChuDeKhiMo = '', NgonNguKhiMo = '';
function DatChuDe(c) { ChuDeHienTai = c; localStorage.setItem('nex_chu_de', c); ApDungChuDe(c); }
function LayChuDe() { return ChuDeHienTai; }
function ApDungChuDe(c) {
  var cd = c; if (c === 'system') { cd = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  document.documentElement.setAttribute('data-chu-de', cd);
}
var DanhSachPhanMem = [], DanhSachDaCaiDat = [], TrangHienTai = 'installer', BoLocHienTai = 'all', CotSapXep = 'name', HuongSapXep = true;
document.addEventListener('DOMContentLoaded', async function() {
  KhoiTaoChuDe(); KhoiTaoNgonNgu(); CapNhatBanDich(); DangKySuKien();
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
      } catch (e) {}
    }
  DanhSachPhanMem = await window.DienTu.LayDanhSachUngDung();
  HienThiDanhSachInstaller();
  DanhSachDaCaiDat = await window.DienTu.LayPhanMemDaCai();
  HienThiDanhSachUninstaller();
  var TienTrinhSoApp = 0, TienTrinhHienTai = 0, TienTrinhAppTruoc = '';
  if (window.DienTu.KhiTienTrinhCaiDat) {
      window.DienTu.KhiTienTrinhCaiDat((dl) => {
          if (dl.name !== TienTrinhAppTruoc) {
              TienTrinhHienTai++;
              TienTrinhAppTruoc = dl.name;
          }
          let laTai = dl.status === 'downloading';
          let phanTram = dl.percent || 0;
          let demText = laTai ? (NgonNguHienTai === 'VN' ? 'Đang tải (' : 'Downloading (') + phanTram + '%)' : t('installing') + '...';
          CapNhatHopThoaiTienTrinh(dl.name, phanTram, demText);
      });
  }
  if (window.DienTu.KhiTienTrinhGoCaiDat) {
      window.DienTu.KhiTienTrinhGoCaiDat((dl) => {
          if (dl.name !== TienTrinhAppTruoc) {
              TienTrinhHienTai++;
              TienTrinhAppTruoc = dl.name;
          }
          CapNhatHopThoaiTienTrinh(dl.name, 50, t('uninstalling') + '...');
      });
  }
});
function DangKySuKien() {
  document.getElementById('nut-thu-nho')?.addEventListener('click', function() { window.DienTu?.ThuNho(); });
  document.getElementById('nut-phong-to')?.addEventListener('click', function() { window.DienTu?.PhongTo(); });
  document.getElementById('nut-dong')?.addEventListener('click', function() { window.DienTu?.DongCuaSo(); });
  document.getElementById('dong-tien-trinh')?.addEventListener('click', DongHopThoaiTienTrinh);
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
  document.getElementById('nav-tien-ich')?.addEventListener('click', function() { ChuyenTrang('tien-ich'); });
  document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function(n) {
    n.addEventListener('click', function() {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'installer') return;
      BoLocHienTai = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-installer .ThanhBen_MucCon').forEach(function(m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); HienThiDanhSachInstaller();
    });
  });
  document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function(n) {
    n.addEventListener('click', function() {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'uninstaller') return;
      var bl = n.getAttribute('data-bo-loc');
      document.querySelectorAll('#ds-uninstaller .ThanhBen_MucCon').forEach(function(m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon'); LocDanhSachUninstaller(bl);
    });
  });
  document.querySelectorAll('#ds-tien-ich .ThanhBen_MucCon').forEach(function(n) {
    n.addEventListener('click', function() {
      if (n.classList.contains('dang-chon') && TrangHienTai === 'tien-ich') return;
      document.querySelectorAll('#ds-tien-ich .ThanhBen_MucCon').forEach(function(m) { m.classList.remove('dang-chon'); });
      n.classList.add('dang-chon');
      let boLoc = n.getAttribute('data-bo-loc');
      if (document.getElementById('tab-khoi-phuc')) {
        document.getElementById('tab-khoi-phuc').style.display = (boLoc === 'khoi-phuc') ? 'block' : 'none';
      }
      if (document.getElementById('tab-pha-huy')) {
        document.getElementById('tab-pha-huy').style.display = (boLoc === 'pha-huy') ? 'block' : 'none';
      }
      if (document.getElementById('tab-don-rac')) {
        document.getElementById('tab-don-rac').style.display = (boLoc === 'don-rac') ? 'block' : 'none';
      }
    });
  });
  document.getElementById('o-tim-kiem-installer')?.addEventListener('input', function(e) { HienThiDanhSachInstaller(e.target.value); });
  document.getElementById('o-tim-kiem-uninstaller')?.addEventListener('input', function(e) { HienThiDanhSachUninstaller(e.target.value); });
  document.getElementById('chon-tat-ca-installer')?.addEventListener('change', function(e) {
    document.querySelectorAll('#danh-sach-installer .OChon').forEach(function(cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
    CapNhatNutDongGoi();
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
    if (DangXuLyCaiDat) { HienThongBao(t('processing_wait') || 'Vui lòng chờ tiến trình hoàn tất', 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked');
    if (dc.length === 0) { HienThongBao(t('no_software_selected') || 'Vui lòng chọn phần mềm', 'canh-bao'); return; }
    var danhSachChon = [];
    if (BoLocHienTai === 'updates') {
      dc.forEach(function(cb) {
        danhSachChon.push({ id: cb.getAttribute('data-id'), name: cb.getAttribute('data-ten') });
      });
    } else {
      dc.forEach(function(cb) {
          var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
          var pm = DanhSachPhanMem.find(p => p.name === ten);
          if (pm) danhSachChon.push(pm);
      });
    }
    if (danhSachChon.length === 0) return;
    DangXuLyCaiDat = true;
    if (CauHinh.installerThuNho && window.DienTu && window.DienTu.AnCuaSo) {
        window.DienTu.AnCuaSo();
    }
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
        }
    } finally {
        HoanTatHopThoaiTienTrinh(ketQua);
        DangXuLyCaiDat = false;
    }
  });
  var DangLamMoi = false;
  document.getElementById('nut-lam-moi')?.addEventListener('click', async function() {
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
    if (CauHinh.uninstallerHoiXacNhan) {
        let xacNhan = await HienThiXacNhanGoCaiDat(danhSachChon);
        if (!xacNhan) {
            DangXuLyGoCaiDat = false;
            return;
        }
    }
    DangXuLyGoCaiDat = true;
    TienTrinhSoApp = danhSachChon.length;
    TienTrinhHienTai = 0;
    TienTrinhAppTruoc = '';
    MoHopThoaiTienTrinh(t('uninstalling'), danhSachChon);
    try {
        var ketQua = await window.DienTu.TienHanhGoCaiDat(danhSachChon, {
            silent: CauHinh.chungDaLuong,
            showProgress: CauHinh.chungHienTienTrinh
        });
        if (ketQua) {
          var thanhCong = ketQua.filter(k => k.success).length;
          if (CauHinh.chungHienThongBao) {
              HienThongBao(t('finish_uninstalling') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
          }
          let dsMoi = await window.DienTu.LayPhanMemDaCai();
          DanhSachDaCaiDat = dsMoi;
          HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
          if (CauHinh.uninstallerThuNho && window.DienTu && window.DienTu.AnCuaSo) {
              window.DienTu.AnCuaSo();
          }
        }
    } finally {
        HoanTatHopThoaiTienTrinh(ketQua);
        DangXuLyGoCaiDat = false;
    }
  });
  window.MoHopThoaiSuaPhanMem = function(tenPm) {
    let pm = DanhSachPhanMem.find(p => p.name === tenPm);
    if (!pm) return;
    let btnLuu = document.getElementById('luu-them-app');
    if (btnLuu) {
      btnLuu.dataset.editMode = 'true';
      btnLuu.dataset.oldName = tenPm;
    }
    document.getElementById('them-app-tieu-de').textContent = NgonNguHienTai === 'VN' ? "Chỉnh sửa phần mềm" : "Edit Software";
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
  document.getElementById('nut-them-moi')?.addEventListener('click', function() {
    var modal = document.getElementById('hop-thoai-them-app');
    var lopPhu = document.getElementById('lop-phu-modal');
    if (modal && lopPhu) {
      document.getElementById('them-app-tieu-de').textContent = NgonNguHienTai === 'VN' ? "Thêm phần mềm mới" : "Add new software";
      document.getElementById('them-app-ten').value = '';
      document.getElementById('them-app-loai').value = '';
      document.getElementById('them-app-id').value = '';
      if (document.getElementById('them-app-tham-so')) document.getElementById('them-app-tham-so').value = '';
      let btnLuu = document.getElementById('luu-them-app');
      if (btnLuu) btnLuu.dataset.editMode = 'false';
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
  document.querySelectorAll('.Trang').forEach(function(t) { t.classList.remove('dang-hien'); });
  document.getElementById('trang-' + trang)?.classList.add('dang-hien');
  var ni = document.getElementById('nav-installer'), nu = document.getElementById('nav-uninstaller'), nti = document.getElementById('nav-tien-ich');
  var di = document.getElementById('ds-installer'), du = document.getElementById('ds-uninstaller'), dti = document.getElementById('ds-tien-ich');
  ni?.classList.toggle('dang-chon', trang === 'installer'); ni?.classList.toggle('dang-mo', trang === 'installer');
  nu?.classList.toggle('dang-chon', trang === 'uninstaller'); nu?.classList.toggle('dang-mo', trang === 'uninstaller');
  nti?.classList.toggle('dang-chon', trang === 'tien-ich'); nti?.classList.toggle('dang-mo', trang === 'tien-ich');
  di?.classList.toggle('dang-mo', trang === 'installer'); du?.classList.toggle('dang-mo', trang === 'uninstaller'); dti?.classList.toggle('dang-mo', trang === 'tien-ich');
  if (trang === 'uninstaller') { var m = du?.querySelector('.ThanhBen_MucCon'); if (m && !du.querySelector('.dang-chon')) m.classList.add('dang-chon'); }
  if (trang === 'tien-ich') { var mt = dti?.querySelector('.ThanhBen_MucCon'); if (mt && !dti.querySelector('.dang-chon')) mt.classList.add('dang-chon'); }
}
function HienThiDanhSachInstaller(TuKhoa) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-installer'); if (!ct) return; ct.innerHTML = '';
  var ds = DanhSachPhanMem.slice();
  if (BoLocHienTai === 'apps') ds = ds.filter(function(p) { return p.type === 'app'; });
  else if (BoLocHienTai === 'games') ds = ds.filter(function(p) { return p.type === 'game'; });
  else if (BoLocHienTai === 'updates') {
    let nutCaiDatSpan = document.getElementById('nut-cai-dat')?.querySelector('span');
    if (nutCaiDatSpan) nutCaiDatSpan.textContent = 'Cập nhật';
    ct.innerHTML = '<div class="KhongCoKetQua"><div class="KhongCoKetQua_MoTa">Đang quét bản cập nhật...</div></div>';
    if (window.DienTu && window.DienTu.KiemTraCapNhat) {
        window.DienTu.KiemTraCapNhat().then(results => {
            if (!results || results.length === 0) {
                ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">Phần mềm đã mới nhất</div><div class="KhongCoKetQua_MoTa">Không tìm thấy bản cập nhật nào cho các ứng dụng trên máy của bạn.</div></div>';
                CapNhatNutDongGoi(); return;
            }
            ct.innerHTML = '';
            results.forEach(pm => {
                ct.appendChild(TaoHangCapNhat(pm));
            });
            CapNhatNutDongGoi();
        });
    }
    return;
  }
  let nutCaiDatSpan = document.getElementById('nut-cai-dat')?.querySelector('span');
  if (nutCaiDatSpan) nutCaiDatSpan.textContent = t('install_btn') || 'Cài đặt';
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function(p) { return p.name.toLowerCase().includes(tk) || p.category.toLowerCase().includes(tk); }); }
  ds.sort(function(a, b) { var gA, gB; switch (CotSapXep) { case 'category': gA = a.category; gB = b.category; break; case 'source': gA = a.source.type; gB = b.source.type; break; default: gA = a.name; gB = b.name; } return (HuongSapXep ? 1 : -1) * gA.localeCompare(gB); });
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_results') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_results_desc') + '</div></div>'; CapNhatNutDongGoi(); return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangInstaller(pm)); });
  CapNhatNutDongGoi();
}
function TaoHangInstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  if(pm.source && pm.source.type) {
    d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name + '"></div><div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_Loai"><span>' + pm.category + '</span></div><div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--' + pm.source.type.toLowerCase() + '">' + pm.source.type + '</span><button class="NutSuaNho" title="' + t('edit_btn') + '" onclick="event.stopPropagation(); window.MoHopThoaiSuaPhanMem(\'' + pm.name.replace(/'/g, "\\'") + '\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button></div>';
  }
  d.addEventListener('click', function(e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatNutDongGoi(); } });
  d.querySelector('.OChon')?.addEventListener('change', function() { d.classList.toggle('da-chon', this.checked); CapNhatNutDongGoi(); });
  return d;
}
function TaoHangCapNhat(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  d.innerHTML = '<div class="HangUngDung_Chon"><input type="checkbox" class="OChon" data-ten="' + pm.name + '" data-id="' + pm.id + '"></div><div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_Loai"><span>' + pm.current + ' → ' + pm.available + '</span></div><div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--winget">Winget</span></div>';
  d.addEventListener('click', function(e) { if (e.target.type === 'checkbox') return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatNutDongGoi(); } });
  d.querySelector('.OChon')?.addEventListener('change', function() { d.classList.toggle('da-chon', this.checked); CapNhatNutDongGoi(); });
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
let TienTrinhRenderUninstaller = null;
function HienThiDanhSachUninstaller(TuKhoa) {
  TuKhoa = TuKhoa || '';
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return;
  if (TienTrinhRenderUninstaller) { cancelAnimationFrame(TienTrinhRenderUninstaller); TienTrinhRenderUninstaller = null; }
  var ds = DanhSachDaCaiDat.slice();
  if (TuKhoa.trim()) { var tk = TuKhoa.toLowerCase(); ds = ds.filter(function(p) { return p.name.toLowerCase().includes(tk) || p.publisher.toLowerCase().includes(tk); }); }
  ds.sort(function(a, b) { var gA, gB; switch (CotSapXep) { case 'publisher': gA = a.publisher; gB = b.publisher; break; case 'date': gA = a.installDate; gB = b.installDate; break; case 'size': gA = a.size; gB = b.size; break; default: gA = a.name; gB = b.name; } return (HuongSapXep ? 1 : -1) * String(gA).localeCompare(String(gB)); });
  ct.innerHTML = '';
  CapNhatSoLuongDaChon();
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangUninstaller(pm)); });
}
function TaoHangUninstaller(pm) {
  var d = document.createElement('div'); d.className = 'HangUngDung';
  var idIcon = 'icon-' + Math.random().toString(36).substring(2, 9);
  var formattedDate = pm.installDate || '-';
  var dStr = String(formattedDate).replace(/\D/g, '');
  if (dStr.length === 8) {
    var format = t('date_format') || 'DD/MM/YYYY';
    var year = dStr.substring(0,4);
    var month = dStr.substring(4,6);
    var day = dStr.substring(6,8);
    formattedDate = format.replace('YYYY', year).replace('MM', month).replace('DD', day);
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
                '<div class="HangUngDung_Icon"><img id="' + idIcon + '" src="TaiNguyen/BieuTuong/what_app.svg" alt="icon"></div>' +
                '<div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_NhaPhatHanh">' + (pm.publisher || '-') + '</div><div class="HangUngDung_Ngay">' + formattedDate + '</div><div class="HangUngDung_DungLuong">' + displaySize + '</div>';
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
              window.DienTu.LayThongTinThem(appName, el.dataset.installLocation).then(info => {
                if (info) {
                  if (el.dataset.needDate === 'true' && info.date) {
                    let dStr = info.date;
                    let format = t('date_format') || 'DD/MM/YYYY';
                    let y = dStr.substring(0,4), m = dStr.substring(4,6), day = dStr.substring(6,8);
                    let fDate = format.replace('YYYY', y).replace('MM', m).replace('DD', day);
                    let ngayEl = el.querySelector('.HangUngDung_Ngay');
                    if (ngayEl) { ngayEl.textContent = fDate; ngayEl.classList.add('ChuUocTinh'); ngayEl.title = t('estimated'); }
                  }
                  if (el.dataset.needSize === 'true' && info.size) {
                    let sizeEl = el.querySelector('.HangUngDung_DungLuong');
                    if (sizeEl) { sizeEl.textContent = info.size; sizeEl.classList.add('ChuUocTinh'); sizeEl.title = t('estimated'); }
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
  if (pm.installLocation) d.dataset.installLocation = pm.installLocation;
  if (!pm.installDate || pm.installDate === '-') d.dataset.needDate = 'true';
  if (!pm.size || pm.size === 0) d.dataset.needSize = 'true';
  window.ObserverIcon.observe(d);
  return d;
}
let TienTrinhRenderBoLoc = null;
function LocDanhSachUninstaller(bl) {
  var ct = document.getElementById('danh-sach-uninstaller'); if (!ct) return;
  if (TienTrinhRenderBoLoc) { cancelAnimationFrame(TienTrinhRenderBoLoc); TienTrinhRenderBoLoc = null; }
  var ds = DanhSachDaCaiDat.slice();
  switch (bl) {
    case 'system': 
      ds = ds.filter(function(p) {
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
      ds = ds.filter(function(p) {
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
      ds = ds.filter(function(p) { 
        if (!p.size) return false;
        let pub = (p.publisher || '').toLowerCase();
        let name = (p.name || '').toLowerCase();
        let isSysPub = pub.includes('microsoft') || pub.includes('intel') || pub.includes('amd') || pub.includes('nvidia') || pub.includes('realtek');
        let isUserApp = name.includes('edge') || name.includes('visual studio') || name.includes('geforce now') || name.includes('onedrive') || name.includes('skype') || name.includes('teams') || name.includes('discord');
        let isSystem = (isSysPub && !isUserApp) || (name.includes('redistributable') || name.includes('c++') || name.includes('runtime') || name.includes('framework') || name.includes('sdk'));
        if (isSystem) return false;
        return p.size > 500 * 1024 * 1024;
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
  ct.innerHTML = '';
  if (ds.length === 0) { ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_apps') + '</div></div>'; return; }
  ds.forEach(function(pm) { ct.appendChild(TaoHangUninstaller(pm)); });
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
function HienHopThoaiXacNhanCustom(noiDung) {
  return new Promise((resolve) => {
    document.getElementById('xac-nhan-noi-dung').innerHTML = noiDung;
    BatTatHopThoai('hop-thoai-xac-nhan', true);
    const dongBtn = document.getElementById('xacnhan-dong-btn');
    const huyBtn = document.getElementById('xacnhan-huy-btn');
    const okBtn = document.getElementById('xacnhan-ok-btn');
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
    if (i === 0) helpText = t('help_text_ui');
    if (i === 1) helpText = t('help_text_general');
    if (i === 2) helpText = t('help_text_installer');
    if (i === 3) helpText = t('help_text_uninstaller');
    if (i === 4) helpText = t('help_text_utilities');
    var helpSvg = '<svg width="18" height="18" viewBox="-2 -2 104 104" fill="none" style="opacity:0.6; cursor:pointer; margin-left:8px;" title="' + t(tab) + ' (' + t('settings_help') + ')" onclick="HienHopThoaiTroGiup(\'' + t(tab) + '\', decodeURIComponent(\'' + encodeURIComponent(helpText) + '\'))"><circle cx="50" cy="50" r="50" stroke="currentColor" stroke-width="8"></circle><g transform="matrix(0.7,0,0,0.7,15,15)"><path d="M47.633 2.5c-2.126.242-4.603.367-7.017.829-5.655 1.08-10.71 3.485-14.87 7.529a10.294 10.294 0 0 0-.55 14.227c2.948 3.352 7.325 3.341 11.986-.031.32-.233.647-.458.962-.697 3.48-2.64 7.466-3.674 11.727-3.249 3.515.352 6.526 1.861 7.782 5.494 1.213 3.506-.484 6.153-2.95 8.393-1.237 1.125-2.663 2.046-4.011 3.049-8.1 6.019-11.618 15.485-9.127 24.568 1.185 4.322 3.199 6.59 5.846 6.586 2.59-.003 4.563-2.035 5.716-6.333 1.198-4.461 3.49-8.197 7.013-11.104 2.819-2.325 5.902-4.325 8.742-6.623 8.88-7.187 11.038-18.305 5.399-28.203C68.49 6.772 59.069 3.132 47.633 2.5zM49.12 76.368c-6.542.01-10.696 4.033-10.682 10.346.014 6.241 4.46 10.807 10.502 10.786 6.34-.022 10.896-4.534 10.865-10.76-.03-6.339-4.197-10.383-10.685-10.372z" fill="currentColor"></path></g></svg>';
    sec.innerHTML = '<div class="CaiDat_TieuDePhan" style="display:flex; align-items:center;">' + t(tab) + helpSvg + '</div>' + LayHTMLCaiDatTrang(i, ChuDeHT, NgonNguHT);
    nd.appendChild(sec);
  });
  nd.addEventListener('scroll', function() {
    var fromTop = nd.scrollTop + 60;
    var secs = nd.querySelectorAll('.CaiDat_Phan');
    var current = secs[0].id;
    secs.forEach(function(sec) {
      if ((sec.offsetTop - nd.offsetTop) <= fromTop) current = sec.id;
    });
    menu.querySelectorAll('.CaiDat_MucMenu').forEach(function(m) {
      m.classList.toggle('dang-chon', m.getAttribute('data-target') === current);
    });
  });
  nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var cd = btn.getAttribute('data-chu-de');
      if (btn.classList.contains('dang-chon')) { DatChuDe('system'); nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(b) { b.classList.remove('dang-chon'); }); HienThongBao(t('system_label'), 'thong-tin'); return; }
      nd.querySelectorAll('.ChonChuDe_Nut').forEach(function(b) { b.classList.remove('dang-chon'); });
      btn.classList.add('dang-chon'); DatChuDe(cd);
    });
  });
  document.querySelectorAll('.CaiDat_Dropdown').forEach(function(wrap) {
    wrap.addEventListener('click', function(e) {
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
    wrap.addEventListener('blur', function() {
      wrap.classList.remove('mo');
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
  trongSuot: localStorage.getItem('caidat-trong-suot') || 0,
  chungDaLuong: localStorage.getItem('caidat-chung-da-luong') !== 'false',
  chungHienTienTrinh: localStorage.getItem('caidat-chung-hien-tien-trinh') !== 'false',
  chungAnKhongHoTro: localStorage.getItem('caidat-chung-an-khong-ho-tro') === 'true',
  chungHienThongBao: localStorage.getItem('caidat-chung-hien-thong-bao') !== 'false',
  installerTaiDaLuong: localStorage.getItem('caidat-installer-tai-da-luong') !== 'false',
  installerTuDongChon: localStorage.getItem('caidat-installer-tu-dong-chon') === 'true',
  installerThuNho: localStorage.getItem('caidat-installer-thu-nho') !== 'false',
  installerHienTienTrinh: localStorage.getItem('caidat-installer-hien-tien-trinh') !== 'false',
  installerHienThongBao: localStorage.getItem('caidat-installer-hien-thong-bao') !== 'false',
  uninstallerGoNgam: localStorage.getItem('caidat-uninstaller-go-ngam') !== 'false',
  uninstallerHoiXacNhan: localStorage.getItem('caidat-uninstaller-hoi-xac-nhan') !== 'false',
  uninstallerHienTienTrinh: localStorage.getItem('caidat-uninstaller-hien-tien-trinh') !== 'false',
  uninstallerHienThongBao: localStorage.getItem('caidat-uninstaller-hien-thong-bao') === 'true',
  uninstallerThuNho: localStorage.getItem('caidat-uninstaller-thu-nho') !== 'false'
};
function ApDungCauHinh() {
  document.documentElement.style.setProperty('--do-bo', CauHinh.boTron ? '8px' : '0px');
  document.documentElement.style.setProperty('--do-bo-nho', CauHinh.boTron ? '4px' : '0px');
  document.documentElement.style.setProperty('--do-bo-lon', CauHinh.boTron ? '12px' : '0px');
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
    var txtLight = NgonNguHT === 'VN' ? 'Sáng' : 'Light';
    var txtDark = NgonNguHT === 'VN' ? 'Tối' : 'Dark';
    var txtSys = NgonNguHT === 'VN' ? 'Hệ thống' : 'System';
    if (isSysDark) txtDark += ' / ' + txtSys; else txtLight += ' / ' + txtSys;
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('lang_label') + '</div></div>' +
      '<div class="CaiDat_Dropdown" id="cd-ngon-ngu-wrap" data-value="' + NgonNguHT + '" tabindex="0">' +
      '  <div class="CaiDat_Dropdown_Chon"><span id="cd-ngon-ngu-text">' + (NgonNguHT === 'VN' ? 'Tiếng Việt' : 'English') + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>' +
      '  <div class="CaiDat_Dropdown_DanhSach">' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="EN">English</div>' +
      '    <div class="CaiDat_Dropdown_Muc" data-value="VN">Tiếng Việt</div>' +
      '  </div>' +
      '</div></div>' +
      '<div class="MucCaiDat" style="flex-direction:column; align-items:flex-start; gap:12px;"><div class="MucCaiDat_Nhan">' + t('theme_label') + '</div>' +
      '<div class="ChonChuDe">' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'light' ? ' dang-chon' : '') + '" data-chu-de="light"><img src="TaiNguyen/BieuTuong/theme-light.svg" alt="Light"><span>' + txtLight + '</span></div>' +
      '<div class="ChonChuDe_Nut' + (ChuDeHT === 'dark' ? ' dang-chon' : '') + '" data-chu-de="dark"><img src="TaiNguyen/BieuTuong/theme-dark.svg" alt="Dark"><span>' + txtDark + '</span></div>' +
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
    let ttDaLuong = NgonNguHT === 'VN' ? 'Đa luồng và tự xử lý cả cài đặt và gỡ cài đặt. Nếu gặp file đơn luồng (như .msi), tự chuyển sang đơn luồng ở lần thử lại tiếp theo (tối đa 3 lần).' : 'Automatic multithreaded processing. Falls back to single thread for specific files (.msi) on retry (max 3 times).';
    let ttDanhMuc = NgonNguHT === 'VN' ? 'Đang trong phát triển' : 'Under development';
    let ttTienTrinh = NgonNguHT === 'VN' ? 'Hiển thị hộp thoại tiến trình chi tiết khi cài đặt hoặc gỡ cài đặt' : 'Show detailed progress dialog during installation or uninstallation';
    let ttAn = NgonNguHT === 'VN' ? 'Tự động ẩn các ứng dụng không tương thích với hệ điều hành hiện tại' : 'Automatically hide applications incompatible with the current OS';
    let ttThongBao = NgonNguHT === 'VN' ? 'Hiển thị thông báo (toast) ở góc màn hình khi quá trình xử lý hoàn tất' : 'Show toast notification when processing is complete';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('always_on_top') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-luon-tren" ' + (aot?'checked':'') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan">' + t('minimize_to_tray') + '</div></div><label class="CongTac"><input type="checkbox" id="caidat-thu-nho-khay" ' + (mtt?'checked':'') + '><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttDaLuong + '">Đa luồng xử lý</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-da-luong" '+(CauHinh.chungDaLuong?'checked':'')+'><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttTienTrinh + '">' + t('show_progress') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-hien-tien-trinh" '+(CauHinh.chungHienTienTrinh?'checked':'')+'><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttThongBao + '">' + t('show_complete') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-chung-hien-thong-bao" '+(CauHinh.chungHienThongBao?'checked':'')+'><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" onclick="if(document.getElementById(\'cd-chung-danh-muc\').disabled) HienThongBao(\'' + ttDanhMuc + '\', \'thong-tin\')"><div><div class="MucCaiDat_Nhan" title="' + ttDanhMuc + '">' + t('detailed_categories') + '</div></div><label class="CongTac" style="opacity:0.5"><input type="checkbox" id="cd-chung-danh-muc" disabled><span class="CongTac_Thanh"></span></label></div>' +
      '<div class="MucCaiDat" onclick="if(document.getElementById(\'cd-chung-an-khong-ho-tro\').disabled) HienThongBao(\'' + ttDanhMuc + '\', \'thong-tin\')"><div><div class="MucCaiDat_Nhan" title="' + ttAn + '">' + t('hide_unsupported') + '</div></div><label class="CongTac" style="opacity:0.5"><input type="checkbox" id="cd-chung-an-khong-ho-tro" disabled><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 2) {
    let ttThuNhoCaiDat = NgonNguHT === 'VN' ? 'Thu nhỏ giao diện chính xuống khay hệ thống khi quá trình cài đặt bắt đầu' : 'Minimize main window to tray when installation starts';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttThuNhoCaiDat + '">' + t('minimize_install') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-installer-thu-nho" '+(CauHinh.installerThuNho?'checked':'')+'><span class="CongTac_Thanh"></span></label></div>' +
      '</div>';
  } else if (i === 3) {
    let ttXacNhan = NgonNguHT === 'VN' ? 'Hiển thị hộp thoại xác nhận trước khi bắt đầu quá trình gỡ cài đặt' : 'Show confirmation dialog before uninstalling';
    return '<div class="NhomCaiDat">' +
      '<div class="MucCaiDat"><div><div class="MucCaiDat_Nhan" title="' + ttXacNhan + '">' + t('show_confirmation') + '</div></div><label class="CongTac"><input type="checkbox" id="cd-uninstaller-hoi-xac-nhan" '+(CauHinh.uninstallerHoiXacNhan?'checked':'')+'><span class="CongTac_Thanh"></span></label></div>' +
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
          if (!txt || txt === 'weak_machine_warning') txt = NgonNguHienTai === 'VN' ? "Máy bạn có cấu hình khá yếu hoặc đang thiếu tài nguyên trống. Việc BẬT hiệu ứng có thể gây giật lag hoặc phản hồi chậm. Bạn có chắc chắn muốn bật hiệu ứng không?" : "Your system resources are low. Enabling effects might cause lag. Are you sure?";
          let xacNhan = await HienHopThoaiXacNhanCustom(txt);
          if (!xacNhan) elTatAnim.checked = true;
        }
      } catch (e) {}
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
    { id: 'cd-chung-an-khong-ho-tro', key: 'caidat-chung-an-khong-ho-tro', cauHinhKey: 'chungAnKhongHoTro' },
    { id: 'cd-chung-hien-thong-bao', key: 'caidat-chung-hien-thong-bao', cauHinhKey: 'chungHienThongBao' },
    { id: 'cd-installer-thu-nho', key: 'caidat-installer-thu-nho', cauHinhKey: 'installerThuNho' },
    { id: 'cd-uninstaller-hoi-xac-nhan', key: 'caidat-uninstaller-hoi-xac-nhan', cauHinhKey: 'uninstallerHoiXacNhan' }
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
  const chungKeys = ['caidat-chung-da-luong', 'caidat-chung-hien-tien-trinh', 'caidat-chung-an-khong-ho-tro', 'caidat-chung-hien-thong-bao'];
  const oldKeys = ['caidat-installer-tai-da-luong','caidat-installer-tu-dong-chon','caidat-installer-thu-nho','caidat-installer-hien-tien-trinh','caidat-installer-hien-thong-bao','caidat-uninstaller-go-ngam','caidat-uninstaller-hoi-xac-nhan','caidat-uninstaller-hien-tien-trinh','caidat-uninstaller-hien-thong-bao','caidat-uninstaller-thu-nho'];
  const tienIchKeys = ['tienich-canh-bao-odia','tienich-chi-pho-bien','tienich-xac-nhan-don','tienich-so-lan','tienich-che-do'];
  chungKeys.concat(oldKeys).concat(tienIchKeys).forEach(k => localStorage.removeItem(k));
  CauHinh.boTron = true;
  CauHinh.tatAnim = false;
  CauHinh.coChu = 14;
  CauHinh.trongSuot = 0;
  CauHinh.chungDaLuong = true;
  CauHinh.chungHienTienTrinh = true;
  CauHinh.chungAnKhongHoTro = false;
  CauHinh.chungHienThongBao = true;
  CauHinh.installerThuNho = true;
  CauHinh.uninstallerHoiXacNhan = true;
  if (window.DienTu?.DatLuonTrenCung) window.DienTu.DatLuonTrenCung(false);
  if (window.DienTu?.DatThuNhoKhay) window.DienTu.DatThuNhoKhay(true);
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
  let hienTai = Array.from(vung.children).filter(e => !e.classList.contains('dang-xoa'));
  while (hienTai.length >= 5) {
    var oldTb = hienTai.shift();
    oldTb.classList.add('dang-xoa');
    oldTb.style.animation = 'mooDan 0.2s forwards';
    setTimeout(function() { if (oldTb.parentNode) oldTb.remove(); }, 200);
  }
  var tb = document.createElement('div'); tb.className = 'ThongBao ThongBao--' + loai; tb.textContent = nd;
  vung.appendChild(tb); setTimeout(function() { if (tb.parentNode) tb.remove(); }, 4000);
}
function MoHopThoaiTienTrinh(tieuDe, danhSachApp) {
  var h = document.getElementById('hop-thoai-tien-trinh');
  var lp = document.getElementById('lop-phu-modal');
  var ds = document.getElementById('tien-trinh-danh-sach');
  document.getElementById('tien-trinh-tieu-de').textContent = tieuDe;
  document.getElementById('tien-trinh-thanh').style.width = '0%';
  document.getElementById('tien-trinh-phan-tram').textContent = '0%';
  var nutDong = document.getElementById('dong-tien-trinh');
  if (nutDong) { 
      nutDong.disabled = false; 
      nutDong.style.opacity = '1'; 
      nutDong.textContent = NgonNguHienTai === 'VN' ? 'Hủy' : 'Cancel';
      nutDong.dataset.isCancel = 'true';
  }
  ds.innerHTML = '';
  danhSachApp.forEach(app => {
      var hang = document.createElement('div');
      hang.className = 'TienTrinh_Muc';
      var ten = document.createElement('div');
      ten.className = 'TienTrinh_Ten';
      ten.textContent = app.name;
      ten.title = app.name;
      var tt = document.createElement('div');
      tt.className = 'TienTrinh_TrangThai';
      tt.id = 'tien-trinh-tt-' + encodeURIComponent(app.name).replace(/%/g, '_');
      tt.textContent = t('processing_wait') || 'Đang xử lý...';
      hang.appendChild(ten);
      hang.appendChild(tt);
      ds.appendChild(hang);
  });
  h?.classList.remove('an');
  lp?.classList.remove('an');
  ds.scrollTop = 0;
}
function CapNhatHopThoaiTienTrinh(tenApp, phanTram, trangThai) {
  var h = document.getElementById('hop-thoai-tien-trinh');
  if (!h || h.classList.contains('an')) return;
  var idTt = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
  var ttEl = document.getElementById(idTt);
  if (ttEl) {
      ttEl.textContent = trangThai;
  }
  if (ttEl && ttEl.parentElement) {
      var ds = document.getElementById('tien-trinh-danh-sach');
      var offsetTop = ttEl.parentElement.offsetTop;
      if (offsetTop > ds.scrollTop + ds.clientHeight - 50 || offsetTop < ds.scrollTop) {
          ds.scrollTop = offsetTop - ds.clientHeight / 2;
      }
  }
  let tongPhanTram = Math.min(100, ((Math.max(0, TienTrinhHienTai - 1) * 100 + phanTram) / TienTrinhSoApp));
  document.getElementById('tien-trinh-thanh').style.width = tongPhanTram + '%';
  document.getElementById('tien-trinh-phan-tram').textContent = Math.round(tongPhanTram) + '%';
}
function HoanTatHopThoaiTienTrinh(ketQua) {
  if (ketQua && Array.isArray(ketQua)) {
      ketQua.forEach(k => {
          var idTt = 'tien-trinh-tt-' + encodeURIComponent(k.name).replace(/%/g, '_');
          var ttEl = document.getElementById(idTt);
          if (ttEl) {
              ttEl.textContent = k.success ? 'Hoàn tất' : 'Lỗi';
              ttEl.className = 'TienTrinh_TrangThai ' + (k.success ? 'thanh-cong' : 'loi');
          }
      });
  }
  document.getElementById('tien-trinh-thanh').style.width = '100%';
  document.getElementById('tien-trinh-phan-tram').textContent = '100%';
  var nutDong = document.getElementById('dong-tien-trinh');
  if (nutDong) { 
      nutDong.disabled = false; 
      nutDong.style.opacity = '1'; 
      nutDong.textContent = NgonNguHienTai === 'VN' ? 'Đóng' : 'Close';
      nutDong.dataset.isCancel = 'false';
  }
}
function HienThiXacNhanGoCaiDat(danhSachChon) {
    return new Promise((resolve) => {
        var hopThoai = document.getElementById('hop-thoai-xac-nhan-go');
        var danhSach = document.getElementById('xac-nhan-go-danh-sach');
        var cauHoi = document.getElementById('xac-nhan-go-cau-hoi');
        var lp = document.getElementById('lop-phu-modal');
        if (cauHoi) cauHoi.textContent = (t('confirm_remove_apps') || 'Bạn có chắc chắn muốn gỡ cài đặt {0} chương trình đã chọn không?').replace('{0}', danhSachChon.length);
        if (danhSach) {
            danhSach.innerHTML = '';
            danhSachChon.forEach(app => {
                var div = document.createElement('div');
                div.className = 'XacNhanGo_App';
                var img = document.createElement('img');
                img.className = 'XacNhanGo_Icon';
                img.src = 'TaiNguyen/BieuTuong/logo.ico';
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
                if (window.DienTu && window.DienTu.LayThongTinThem) {
                    window.DienTu.LayThongTinThem(app.name).then(info => {
                        if (info && info.size) size.textContent = info.size;
                        else size.textContent = '-';
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
        var nutHuy = document.getElementById('dong-xac-nhan-go');
        var nutGo = document.getElementById('luu-xac-nhan-go');
        var xuliHuy = () => {
            hopThoai.classList.add('an');
            if (!document.querySelectorAll('.HopThoai:not(.an)').length) lp.classList.add('an');
            nutHuy?.removeEventListener('click', xuliHuy);
            nutGo?.removeEventListener('click', xuliGo);
            resolve(false);
        };
        var xuliGo = () => {
            hopThoai.classList.add('an');
            nutHuy?.removeEventListener('click', xuliHuy);
            nutGo?.removeEventListener('click', xuliGo);
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
      nutDong.textContent = NgonNguHienTai === 'VN' ? 'Đang hủy...' : 'Canceling...';
      return;
  }
  BatTatHopThoai('hop-thoai-tien-trinh', false);
}
let duongDanPhaHuy = "";
let laPhaHuyODia = false;
let mucDoNhayCam = 1;
let demXacNhan = 0;
document.addEventListener('DOMContentLoaded', () => {
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
        let drive = prompt("Nhập đường dẫn ổ đĩa cần phá hủy (VD: \\\\.\\PhysicalDrive1 hoặc D:)\\nLƯU Ý: Phá hủy ổ đĩa sẽ mất toàn bộ dữ liệu vĩnh viễn!");
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
        btnXacNhan.textContent = `Vẫn Xóa (Lần ${demXacNhan + 1}/3)`;
        let fontSize = 14 + (demXacNhan * 4);
        let weight = 500 + (demXacNhan * 200);
        btnXacNhan.style.fontSize = `${fontSize}px`;
        btnXacNhan.style.fontWeight = weight;
    }
    async function ThucHienPhaHuy() {
        if (!window.DienTu || !window.DienTu.PhaHuyDuLieu) return;
        let passes = parseInt(document.getElementById('input-so-lan-ghi').value) || 3;
        HienThongBao("Đang tiến hành phá hủy dữ liệu. Vui lòng không tắt máy...", "thong-tin");
        btnPhaHuy.disabled = true;
        try {
            const ketQua = await window.DienTu.PhaHuyDuLieu(duongDanPhaHuy, { isDrive: laPhaHuyODia, passes: passes });
            if (ketQua === true || ketQua.success) {
                HienThongBao("Phá hủy dữ liệu hoàn tất!", "thanh-cong");
            } else {
                HienThongBao("Lỗi phá hủy: " + (ketQua.error || "Không xác định"), "loi");
            }
        } catch (e) {
            HienThongBao("Đã xảy ra lỗi: " + e.message, "loi");
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
    document.getElementById('btn-bat-dau-quet-rac')?.addEventListener('click', async function() {
        let xacNhan = localStorage.getItem('tienich-xac-nhan-don');
        if (xacNhan !== 'false') {
            let msg = NgonNguHienTai === 'VN' ? "Hành động này sẽ dọn dẹp các tập tin hệ thống theo chế độ đã chọn. Bạn có chắc chắn muốn tiếp tục?" : "This action will clean system files according to the selected mode. Are you sure you want to continue?";
            let x = await HienHopThoaiXacNhanCustom(msg);
            if (!x) return;
        }
        let cheDo = cheDoQuetHienTai;
        if (cheDo === 'thong-minh') cheDo = 'thong_minh';
        if (cheDo === 'toan-bo') cheDo = 'tat_ca';
        let btn = document.getElementById('btn-bat-dau-quet-rac');
        let tienTrinh = document.getElementById('tien-trinh-don-dep');
        let txtTienTrinh = document.getElementById('txt-tien-trinh-don-dep');
        let thanhTienTrinh = document.getElementById('thanh-tien-trinh-don-dep');
        if (btn) btn.disabled = true;
        if (tienTrinh) tienTrinh.style.display = 'block';
        if (txtTienTrinh) txtTienTrinh.innerText = (NgonNguHienTai === 'VN' ? 'Đang phân tích và dọn dẹp...' : 'Analyzing and cleaning...');
        if (thanhTienTrinh) thanhTienTrinh.style.width = '50%';
        try {
            let res = await window.DienTu.DonDepHeThong(cheDo);
            if (thanhTienTrinh) thanhTienTrinh.style.width = '100%';
            if (txtTienTrinh) txtTienTrinh.innerText = (NgonNguHienTai === 'VN' ? `Đã dọn dẹp xong. Xóa: ${res.tongXoa} mục, Lỗi: ${res.tongLoi} mục.` : `Cleanup finished. Deleted: ${res.tongXoa} items, Errors: ${res.tongLoi} items.`);
            HienThongBao(NgonNguHienTai === 'VN' ? 'Dọn dẹp hoàn tất!' : 'Cleanup finished!', 'thanh-cong');
        } catch (e) {
            if (txtTienTrinh) txtTienTrinh.innerText = (NgonNguHienTai === 'VN' ? 'Đã có lỗi xảy ra.' : 'An error occurred.');
            HienThongBao(NgonNguHienTai === 'VN' ? 'Lỗi khi dọn dẹp!' : 'Error during cleanup!', 'loi');
        } finally {
            if (btn) btn.disabled = false;
            setTimeout(() => { if (tienTrinh) tienTrinh.style.display = 'none'; }, 5000);
        }
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
            txtTienTrinhKhoiPhuc.textContent = `Đang quét và khôi phục... ${percent}%`;
            thanhTienTrinhKhoiPhuc.style.width = `${percent}%`;
            if (window.DienTu.DatTienTrinh) {
                window.DienTu.DatTienTrinh(percent, `Nex Launcher - Đang khôi phục: ${percent}%`);
            }
        });
    }
    btnBatDauKhoiPhuc?.addEventListener('click', async () => {
        let drive = inputDuongDanKhoiPhuc.value.trim();
        if (!drive) {
            HienThongBao("Vui lòng nhập ổ đĩa cần quét (VD: C:, D:)", "canh-bao");
            return;
        }
        if (!thuMucLuuKhoiPhuc) {
            HienThongBao("Vui lòng chọn thư mục lưu kết quả khôi phục", "canh-bao");
            return;
        }
        drive = drive.replace(/\\/g, "").replace(/\//g, "");
        if (drive.length === 1) drive += ":";
        if (!drive.startsWith("\\\\.\\")) {
            drive = "\\\\.\\" + drive;
        }
        btnBatDauKhoiPhuc.disabled = true;
        divTienTrinhKhoiPhuc.style.display = "block";
        txtTienTrinhKhoiPhuc.textContent = "Đang bắt đầu quét...";
        thanhTienTrinhKhoiPhuc.style.width = "0%";
        if (window.DienTu.DatTienTrinh) {
            window.DienTu.DatTienTrinh(0, `Nex Launcher - Bắt đầu khôi phục...`);
        }
        try {
            const ketQua = await window.DienTu.KhoiPhucDuLieu(drive, thuMucLuuKhoiPhuc);
            if (ketQua) {
                HienThongBao("Khôi phục dữ liệu hoàn tất!", "thanh-cong");
                txtTienTrinhKhoiPhuc.textContent = "Hoàn tất!";
                thanhTienTrinhKhoiPhuc.style.width = "100%";
            } else {
                HienThongBao("Lỗi khôi phục: Không thể mở ổ đĩa (Cần quyền Admin?)", "loi");
                divTienTrinhKhoiPhuc.style.display = "none";
            }
        } catch (e) {
            HienThongBao("Đã xảy ra lỗi: " + e.message, "loi");
            divTienTrinhKhoiPhuc.style.display = "none";
        } finally {
            btnBatDauKhoiPhuc.disabled = false;
            if (window.DienTu.DatTienTrinh) {
                window.DienTu.DatTienTrinh(-1, "");
            }
        }
    });
});
