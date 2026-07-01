// === [ 1. GLOBAL & INITIALIZATION ] ===
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
  
    if (window.innerWidth <= 768) {
    var tb = document.getElementById('thanh-ben');
    if (tb) tb.classList.add('thu-gon');
  }
  var iconRot = typeof window.iconRotVal !== 'undefined' ? window.iconRotVal : 0;
  document.getElementById('nut-thu-gon-menu')?.addEventListener('click', function () {
    var tb = document.getElementById('thanh-ben');
    if (!tb) return;
    tb.classList.toggle('thu-gon');
    var icon = document.getElementById('icon-thu-gon');
    if (icon) {
      iconRot -= 180;
      window.iconRotVal = iconRot;
      icon.style.transform = 'rotate(' + iconRot + 'deg)';
    }
  });
  var tbInit = document.getElementById('thanh-ben');
  var iconInit = document.getElementById('icon-thu-gon');
  if (tbInit && iconInit) {
    if (tbInit.classList.contains('thu-gon') && iconRot === 0) {
      iconRot = -180;
      window.iconRotVal = iconRot;
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
    document.querySelectorAll('.HopThoai.mo-hop-thoai').forEach(function (h) { BatTatHopThoai(h.id, false); });
  });
  document.getElementById('nav-installer')?.addEventListener('click', function () { ChuyenTrang('installer'); });
  document.getElementById('nav-uninstaller')?.addEventListener('click', function () { ChuyenTrang('uninstaller'); });
  
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
    document.querySelectorAll('#danh-sach-installer .OChon:not(:disabled)').forEach(function (cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
    CapNhatNutDongGoi();
  });
  document.getElementById('chon-tat-ca-uninstaller')?.addEventListener('change', function (e) {
    document.querySelectorAll('#danh-sach-uninstaller .OChon:not(:disabled)').forEach(function (cb) { cb.checked = e.target.checked; cb.closest('.HangUngDung')?.classList.toggle('da-chon', e.target.checked); });
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

  window.DangXuLyTienTrinh = false;

  document.getElementById('nhap-tu-khoa')?.addEventListener('input', function (e) {
    var txt = e.target.value;
    HienThiTheoBoLoc(txt);
  });
  document.getElementById('nut-dong-goi')?.addEventListener('click', function () {
    let msg = t('feature_dev');
    HienThongBao(msg, 'canh-bao');
  });

  document.getElementById('nut-cai-dat')?.addEventListener('click', async function () {
    if (window.DangXuLyTienTrinh) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked:not(:disabled)');
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
      if (BoLocHienTai === 'updates') {
        let cfmMsg = t('confirm_update_apps') ? t('confirm_update_apps').replace('{0}', danhSachChon.length) : "Bạn có chắc chắn muốn cập nhật " + danhSachChon.length + " phần mềm đã chọn không?";
        isCfm = await HienHopThoaiXacNhanCustom(cfmMsg, t('update_app_btn') || 'Cập nhật', danhSachChon);
      } else {
        let cfmMsg = t('confirm_install_apps') ? t('confirm_install_apps').replace('{0}', danhSachChon.length) : "Bạn có chắc chắn muốn bắt đầu cài đặt " + danhSachChon.length + " phần mềm đã chọn không?";
        isCfm = await HienHopThoaiXacNhanCustom(cfmMsg, t('install_btn') || 'Cài đặt', danhSachChon);
      }
    }
    if (!isCfm) return;
    if (window.DienTu && window.DienTu.ThayDoiUuTienCPU) {
      window.DienTu.ThayDoiUuTienCPU(true);
    }
    DangXuLyCaiDat = true;
    TienTrinhSoApp = danhSachChon.length;
    TienTrinhHienTai = 0;
    TienTrinhAppTruoc = '';
    if (BoLocHienTai === 'updates') {
      MoHopThoaiTienTrinh(t('updating_app') || 'Đang tiến hành cập nhật...', danhSachChon);
    } else {
      MoHopThoaiTienTrinh(t('installing_app') || 'Đang tiến hành cài đặt...', danhSachChon);
    }
    try {
      var ketQua = await window.DienTu.TienHanhCaiDat(danhSachChon, {
        showProgress: CauHinh.chungHienTienTrinh
      });
      if (ketQua) {
        var cancelled = ketQua.some(k => k.error === 'Cancelled by user' || k.error === 'Người dùng đã bỏ qua hoặc huỷ gỡ cài đặt');
        var thanhCong = ketQua.filter(k => k.success).length;
        if (cancelled) {
          HienThongBao(t('cancelled') || 'Đã huỷ quá trình', 'thong-tin');
        } else if (CauHinh.chungHienThongBao) {
          HienThongBao(t('finish_installing') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
        }
        
        if (thanhCong > 0) {
          window.YeuCauLamMoiUninstaller = true;
          if (window.DienTu && window.DienTu.LayPhanMemDaCai) {
            window.DienTu.LayPhanMemDaCai().then(ds => {
              DanhSachDaCaiDat = ds;
              if (typeof TrangHienTai !== 'undefined' && TrangHienTai === 'installer') {
                HienThiDanhSachInstaller(document.getElementById('o-tim-kiem-installer')?.value || '', BoLocHienTai === 'updates');
              }
            });
          }
        }
      }
    } finally {
      HoanTatHopThoaiTienTrinh(typeof ketQua !== 'undefined' ? ketQua : []);
      window.DangXuLyTienTrinh = false;
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
    
    let ct = document.getElementById('danh-sach-uninstaller');
    if (ct) ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:var(--mau-nhan);stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="5" /></svg><div class="KhongCoKetQua_MoTa" style="margin-top: 15px;">' + (t('loading_text') || 'Đang quét các phần mềm được cài đặt...') + '</div></div>';

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

  document.getElementById('nut-go-cai-dat')?.addEventListener('click', async function () {
    if (window.DangXuLyTienTrinh) { HienThongBao(t('processing_wait'), 'canh-bao'); return; }
    var dc = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked:not(:disabled)');
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
        
        let customNameInput = document.getElementById('ten-diem-khoi-phuc-input');
        let customName = customNameInput && customNameInput.value ? customNameInput.value.trim() : "";
        goCaiDatOptions.tenDiemKhoiPhuc = customName ? customName : `Nex Launcher - ${dateStr} : ${n}`;
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
    MoHopThoaiTienTrinh(t('uninstalling'), danhSachChon);
    if (goCaiDatOptions.taoDiemKhoiPhuc && window.DienTu && window.DienTu.TaoDiemKhoiPhuc) {
      window.CurrentGlobalStage = 'rs';
      if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') CapNhatHopThoaiTienTrinh('', 0, '', '', '', 'installing');

      let newRpContainer = document.getElementById('diem-khoi-phuc-moi');
      if (newRpContainer) {
        let rpName = goCaiDatOptions.tenDiemKhoiPhuc || "Nex Launcher Restore Point";
        let textNode = '<span id="rp-status-text" style="font-size: 0.85rem; color: var(--chu-phu);">' + (t('creating_restore_point') || 'Đang tiến hành tạo điểm khôi phục...') + '</span>';
        newRpContainer.innerHTML = `
              <div style="padding: 16px; background: var(--nen-tang2); border: 1px solid var(--vien); border-radius: var(--do-bo); display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                      <span style="font-weight: 600; font-size: 1.05rem; color: var(--chu-chinh);">${rpName}</span>
                      ${textNode}
                  </div>
              </div>
          `;
      }

      let btnSkip = document.getElementById('bo-qua-tien-trinh');
      if (btnSkip) {
          btnSkip.style.display = 'block';
          btnSkip.onclick = () => { if (window.ResolveSkipRS) window.ResolveSkipRS(true); };
      }
      let btnNext = document.getElementById('tiep-theo-tien-trinh');
      if (btnNext) {
          btnNext.style.display = 'none';
      }

      let rsPromise = window.DienTu.TaoDiemKhoiPhuc(goCaiDatOptions.tenDiemKhoiPhuc || "Nex Launcher Restore Point").catch(err => {
        console.warn("Lỗi tạo điểm khôi phục:", err);
        return false;
      });
      TaiDanhSachDiemKhoiPhucCu();       
      
      let skipped = await Promise.race([rsPromise, new Promise(r => window.ResolveSkipRS = r)]);
      
      if (btnSkip) btnSkip.style.display = 'none';
      
      let rpStatusText = document.getElementById('rp-status-text');
      if (rpStatusText) {
          rpStatusText.textContent = skipped === true ? (t('skipped') || 'Đã bỏ qua.') : (t('completed') || 'Hoàn tất.');
          rpStatusText.style.color = 'var(--thanh-cong)';
      }
      
      let hopThoai = document.getElementById('hop-thoai-tien-trinh');
      if (hopThoai && hopThoai.classList.contains('mo-hop-thoai')) {
          if (btnNext) {
              btnNext.style.display = 'block';
              btnNext.textContent = t('next_btn') || 'Tiếp theo';
              await new Promise(r => {
                  let btnDong = document.getElementById('dong-tien-trinh');
                  let handlerNext = () => {
                      btnNext.removeEventListener('click', handlerNext);
                      if (btnDong) btnDong.removeEventListener('click', handlerDong);
                      r();
                  };
                  let handlerDong = () => {
                      btnNext.removeEventListener('click', handlerNext);
                      if (btnDong) btnDong.removeEventListener('click', handlerDong);
                      r();
                  };
                  btnNext.addEventListener('click', handlerNext);
                  if (btnDong) btnDong.addEventListener('click', handlerDong);
              });
              btnNext.style.display = 'none';
          }
      }
    }
    window.CurrentGlobalStage = 'un';
    if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') CapNhatHopThoaiTienTrinh('', 0, '', '', '', 'installing');

    try {
      var ketQua = await window.DienTu.TienHanhGoCaiDat(danhSachChon, goCaiDatOptions);
      if (ketQua) {
        let dsMoi = await window.DienTu.LayPhanMemDaCai();
        let dsMoiNames = new Set(dsMoi.map(p => p.name));

        for (let i = 0; i < ketQua.length; i++) {
          let k = ketQua[i];
          if (k.success && dsMoiNames.has(k.name)) {
            let app = danhSachChon.find(d => d.name === k.name);
            if (app && goCaiDatOptions.silent) {
              if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') {
                CapNhatHopThoaiTienTrinh(k.name, 50, t('retrying_interactive') || 'Đang thử lại (Thủ công)...', '', '', 'installing');
              }
              try {
                let retryOpts = Object.assign({}, goCaiDatOptions, { silent: false });
                let retryResult = await window.DienTu.TienHanhGoCaiDat([app], retryOpts);
                if (retryResult && retryResult[0]) {
                  k.success = retryResult[0].success;
                  k.error = retryResult[0].error;
                }
              } catch (e) {
                k.success = false;
                k.error = e.message || e;
              }
              
              let dsMoiSauRetry = await window.DienTu.LayPhanMemDaCai();
              if (k.success && new Set(dsMoiSauRetry.map(p => p.name)).has(k.name)) {
                  k.success = false;
                  k.error = "Gỡ cài đặt thất bại (Phần mềm vẫn còn tồn tại). Vui lòng thử gỡ thủ công.";
                  if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') {
                    CapNhatHopThoaiTienTrinh(k.name, 100, t('error_status') || 'Lỗi', 'var(--nguy-hiem)', k.error, 'error');
                  }
              } else if (k.success) {
                  dsMoiNames = new Set(dsMoiSauRetry.map(p => p.name));
                  if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') {
                    CapNhatHopThoaiTienTrinh(k.name, 100, t('completed') || 'Hoàn tất', 'var(--thanh-cong)', '', 'done');
                  }
              } else {
                  if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') {
                    CapNhatHopThoaiTienTrinh(k.name, 100, t('error_status') || 'Lỗi', 'var(--nguy-hiem)', k.error, 'error');
                  }
              }
            } else {
              k.success = false;
              k.error = "Gỡ cài đặt thất bại (Phần mềm vẫn còn tồn tại). Vui lòng thử gỡ thủ công.";
              if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') {
                CapNhatHopThoaiTienTrinh(k.name, 100, t('error_status') || 'Lỗi', 'var(--nguy-hiem)', k.error, 'error');
              }
            }
          }
        }

        var thanhCong = ketQua.filter(k => k.success).length;

        let allLeftovers = [];
        if (goCaiDatOptions.loaiBoFileThua && window.DienTu && window.DienTu.QuetTanDuPhanMem) {
          let dsThanhCong = ketQua.filter(k => k.success).map(k => danhSachChon.find(d => d.name === k.name)).filter(Boolean);
          if (dsThanhCong.length > 0) {
            window.CurrentGlobalStage = 'cl';
            if (typeof CapNhatHopThoaiTienTrinh !== 'undefined') CapNhatHopThoaiTienTrinh('', 100, '', '', '', 'done');
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

        var cancelled = ketQua.some(k => k.error === 'Cancelled by user' || k.error === 'Người dùng đã bỏ qua hoặc huỷ gỡ cài đặt');
        if (cancelled) {
          HienThongBao(t('cancelled') || 'Đã huỷ quá trình', 'thong-tin');
        } else if (CauHinh.chungHienThongBao) {
          HienThongBao(t('finish_uninstalling') + thanhCong + '/' + ketQua.length + t('apps_suffix_short'), thanhCong === ketQua.length ? 'thanh-cong' : 'canh-bao');
        }

        DanhSachDaCaiDat = dsMoi;
        HienThiDanhSachUninstaller(document.getElementById('o-tim-kiem-uninstaller')?.value || '');
      }
    } catch (e) {
      console.error(e);
      DangXuLyGoCaiDat = false;
      HienThongBao(t('error_uninstalling') + (e.message || e), 'loi');
      let nutHuy = document.getElementById('dong-tien-trinh');
      if (nutHuy) nutHuy.click();
    } finally {
      window.DangXuLyTienTrinh = false;
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
    BatTatHopThoai('hop-thoai-them-app', true);
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
      BatTatHopThoai('hop-thoai-them-app', true);
    }
  });
  document.getElementById('dong-them-app')?.addEventListener('click', function () {
    BatTatHopThoai('hop-thoai-them-app', false);
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
      BatTatHopThoai('hop-thoai-them-app', false);
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
    statusEl.textContent = '';
    listEl.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:var(--mau-nhan);stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="5" /></svg><div class="KhongCoKetQua_Ten" data-i18n="searching">' + (t('searching') === 'searching' ? 'Đang tìm kiếm...' : t('searching')) + '</div></div>';
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
      HienThiKetQuaTimKiemWinget([]);
    }
  }
  function HienThiKetQuaTimKiemWinget(ketQua) {
    let listEl = document.getElementById('tim-winget-danh-sach');
    let statusEl = document.getElementById('tim-winget-trang-thai');
    if (!ketQua || ketQua.length === 0) {
      statusEl.textContent = '';
      listEl.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div class="KhongCoKetQua_TieuDe">' + t('no_results_winget') + '</div><div class="KhongCoKetQua_MoTa">' + t('no_results_desc') + '</div></div>';
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
        BatTatHopThoai('hop-thoai-tim-winget', false);
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
    BatTatHopThoai('hop-thoai-tim-winget', false);
  });
  document.getElementById('dong-tim-winget-x')?.addEventListener('click', function () {
    BatTatHopThoai('hop-thoai-tim-winget', false);
  });
  document.getElementById('nut-xoa-chon')?.addEventListener('click', async function () {
    var allChecked = document.querySelectorAll('#danh-sach-installer .OChon:checked:not(:disabled)');
    var dc = document.querySelectorAll('#danh-sach-installer .OChon:checked:not(:disabled):not([data-undeletable="true"])');
    if (dc.length === 0) { 
      if (allChecked.length > 0) {
        HienThongBao(t('cannot_delete_locked_apps') || 'Không thể xóa các phần mềm bắt buộc/đề xuất', 'canh-bao');
      } else {
        HienThongBao(t('no_software_selected'), 'canh-bao'); 
      }
      return; 
    }
    var danhSachTen = [];
    dc.forEach(function (cb) {
      var ten = cb.closest('.HangUngDung')?.querySelector('.HangUngDung_Ten')?.textContent;
      if (ten) danhSachTen.push(ten);
    });
    if (await window.XacNhanHanhDongAsync(t('confirm_remove_apps').replace('{0}', danhSachTen.length))) {
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

// === [ 2. NAVIGATION ] ===
function ChuyenTrang(trang) {
  TrangHienTai = trang;
  document.querySelectorAll('.Trang').forEach(function (t) { t.classList.remove('dang-hien', 'hien-thi-trang'); });
  document.getElementById('trang-' + trang)?.classList.add('dang-hien');
  setTimeout(() => { document.getElementById('trang-' + trang)?.classList.add('hien-thi-trang'); }, 10);
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

// === [ 3. INSTALLER ] ===
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
      ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:var(--mau-nhan);stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="5" /></svg><div class="KhongCoKetQua_MoTa" style="margin-top: 15px;">' + t('scanning_updates') + '</div></div>';
      return;
    }
    ct.innerHTML = '<div class="KhongCoKetQua"><svg width="48" height="48" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:var(--mau-nhan);stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="5" /></svg><div class="KhongCoKetQua_MoTa" style="margin-top: 15px;">' + t('scanning_updates') + '</div></div>';
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
  
  let isInstalled = false;
  if (typeof DanhSachDaCaiDat !== 'undefined') {
    let targetName = pm.name.toLowerCase().trim();
    let baseName = targetName.replace(/(_|\()?(\s*)(x64|x86|x32|64-bit|32-bit)(\s*)?\)?/g, '').trim();

    isInstalled = DanhSachDaCaiDat.some(p => {
      let n = p.name.toLowerCase().trim();
      if (n === targetName || n === baseName) return true;
      
      if (targetName.includes('visual c++')) {
        if (targetName.includes('all visual c++')) {
          if (n.includes('visual c++') && (n.includes('2015') || n.includes('v14') || n.includes('2010') || n.includes('2012') || n.includes('2013') || n.includes('2008') || n.includes('2005'))) return true;
        } else {
          let yearMatch = targetName.match(/\d{4}(-\d{4})?/);
          let year = yearMatch ? yearMatch[0] : '';
          let is64 = targetName.includes('x64') || targetName.includes('64-bit');
          let is86 = targetName.includes('x86') || targetName.includes('x32') || targetName.includes('32-bit');
          
          if (!n.includes('visual c++')) return false;
          if (year) {
            if (year === '2015-2022' || year === '2015') {
              if (!n.includes(year) && !n.includes('v14') && !n.match(/2015-\d{4}/)) return false;
            } else {
              if (!n.includes(year)) return false;
            }
          }
          if (is64 || is86) {
            if (is64 && !n.includes('x64') && !n.includes('64-bit')) return false;
            if (is86 && (n.includes('x64') || n.includes('64-bit'))) return false;
          }
          return true;
        }
      }
      
      if (baseName.includes('.net') && /\d/.test(baseName)) {
        let ver = baseName.match(/\d+\.\d+/);
        if (ver && n.includes('.net') && n.includes(ver[0])) {
          let is64 = targetName.includes('x64');
          let is86 = targetName.includes('x86') || targetName.includes('x32');
          if (is64 && !n.includes('x64')) return false;
          if (is86 && n.includes('x64')) return false;
          return true;
        }
      }

      if (n.startsWith(baseName + ' ') || n.includes(' ' + baseName + ' ') || n.endsWith(' ' + baseName)) return true;
      
      return false;
    });

    if (isInstalled) {
      d.classList.add('da-cai-dat');
    }
  }

  if (pm.isLocked) {
    d.classList.add('bi-khoa');
  }

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
    
    let chkHtml = isInstalled 
      ? '<input type="checkbox" class="OChon da-cai" disabled checked title="Phần mềm này đã được cài đặt trên máy">' 
      : '<input type="checkbox" class="OChon" data-ten="' + pm.name + '" ' + (pm.khongSuaXoa === true ? 'data-undeletable="true"' : '') + '>';
      
    d.innerHTML = '<div class="HangUngDung_Chon">' + chkHtml + '</div><div class="HangUngDung_Ten">' + pm.name + '</div><div class="HangUngDung_Loai"><span>' + catName + '</span></div><div class="HangUngDung_Nguon" style="display:flex;align-items:center;justify-content:space-between;"><span class="NhanNguon--' + pm.source.type.toLowerCase() + '">' + pm.source.type + '</span>' + editBtn + '</div>';
    
    if (pm.isLocked) {
      d.innerHTML += '<div class="KhoaOverlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>Ứng dụng này hiện đang bị khóa</span></div>';
    }
  }
  
  if (!isInstalled && !pm.isLocked) {
    d.addEventListener('click', function (e) { if (e.target.type === 'checkbox' || e.target.closest('.NutSuaNho')) return; var cb = d.querySelector('.OChon'); if (cb) { cb.checked = !cb.checked; d.classList.toggle('da-chon', cb.checked); CapNhatNutDongGoi(); } });
    d.querySelector('.OChon')?.addEventListener('change', function () { d.classList.toggle('da-chon', this.checked); CapNhatNutDongGoi(); });
  }
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
  const checkedCount = document.querySelectorAll('#danh-sach-installer .OChon:checked:not(:disabled)').length;
  const nutDongGoi = document.getElementById('nut-dong-goi');
  if (nutDongGoi) {
    nutDongGoi.style.display = (checkedCount >= 2 && BoLocHienTai !== 'updates') ? '' : 'none';
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

// === [ 4. UNINSTALLER ] ===
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
    '<svg width="24" height="24" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><style>.spinner{animation:rotate 2s linear infinite;transform-origin:center center}.path{stroke:var(--mau-nhan);stroke-dasharray:1,200;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;stroke-linecap:round}@keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}</style><circle class="spinner path" cx="30" cy="30" r="20" fill="none" stroke-width="9" /></svg>' +
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
            window.PushIconQueue(pm.name, idIcon, 0, true);
    }
  });
  if (window.ObserverIcon) { window.ObserverIcon.disconnect(); window.ObserverIcon = null; }
  if (window.ObserverIcon) { window.ObserverIcon.disconnect(); }
    if (true) {
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
              iconPrio = 0;             } else if (!pmObj || !pmObj.displayIcon) {
              iconPrio = 2;             }
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
  if (bl === 'large') {
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
  var sl = document.querySelectorAll('#danh-sach-uninstaller .OChon:checked:not(:disabled)').length;
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

// === [ 5. UTILITIES ] ===

// === [ 6. HELPERS ] ===
document.addEventListener('input', function(e) {
  if (e.target && e.target.type === 'range') {
    var min = e.target.min || 0;
    var max = e.target.max || 100;
    var val = e.target.value;
    var percentage = (val - min) / (max - min) * 100;
    e.target.style.background = 'linear-gradient(to right, var(--mau-nhan) ' + percentage + '%, var(--nen-tang3) ' + percentage + '%)';
  }
});
window.CapNhatMauThanhTruot = function() {
  document.querySelectorAll('input[type="range"]').forEach(function(slider) {
    var min = slider.min || 0;
    var max = slider.max || 100;
    var val = slider.value;
    var percentage = (val - min) / (max - min) * 100;
    slider.style.background = 'linear-gradient(to right, var(--mau-nhan) ' + percentage + '%, var(--nen-tang3) ' + percentage + '%)';
  });
};
