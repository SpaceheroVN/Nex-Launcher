// === [ UI COMPONENTS & DIALOGS ] ===

// === [-- 1. GLOBAL & UTILITIES --] ===
window.BatTatHopThoai = function (id, ht) {
  var h = document.getElementById(id), lp = document.getElementById('lop-phu-modal');
  if (ht) {
    if (h) {
      h.classList.remove('an');
      setTimeout(() => h.classList.add('mo-hop-thoai'), 10);
    }
    if (lp) {
      lp.classList.remove('an');
      setTimeout(() => lp.classList.add('mo-hop-thoai'), 10);
    }
    setTimeout(window.CapNhatMauThanhTruot, 10);
    if (h) {
      var focusable = h.querySelector('button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) setTimeout(function () { focusable.focus(); }, 100);
    }
  } else {
    if (id === 'hop-thoai-cai-dat' && typeof ChuDeKhiMo !== 'undefined' && ChuDeKhiMo) {
      if (typeof LayChuDe === 'function' && LayChuDe() !== ChuDeKhiMo && typeof DatChuDe === 'function') DatChuDe(ChuDeKhiMo);
      if (typeof LayNgonNgu === 'function' && LayNgonNgu() !== NgonNguKhiMo && typeof DatNgonNgu === 'function') DatNgonNgu(NgonNguKhiMo);
    }
    if (h) h.classList.remove('mo-hop-thoai');
    if (lp && document.querySelectorAll('.HopThoai.mo-hop-thoai').length === 0) {
      lp.classList.remove('mo-hop-thoai');
    }

    setTimeout(function () {
      if (h && !h.classList.contains('mo-hop-thoai')) h.classList.add('an');
      if (lp && !lp.classList.contains('mo-hop-thoai') && document.querySelectorAll('.HopThoai.mo-hop-thoai').length === 0) {
        lp.classList.add('an');
      }
    }, 250);
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
// === [-- 2. SETTINGS DIALOG --] ===
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
      if (btn.classList.contains('dang-chon')) return;
      nd.querySelectorAll('.ChonChuDe_Nut').forEach(function (b) { b.classList.remove('dang-chon'); });
      btn.classList.add('dang-chon'); DatChuDe(cd);
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
          HienThongBao(t('data_up_to_date') || 'Dữ liệu hiện tại đã là mới nhất, không có thay đổi.', 'thong-tin');
        } else if (res.status === 'different') {
          let xacNhan = await window.XacNhanHanhDongAsync(t('confirm_basic_update') || 'Có bản cập nhật dữ liệu Basic mới. Bạn có chắc chắn muốn thay thế toàn bộ dữ liệu hiện tại bằng bản cập nhật mới nhất từ Github không? Mọi chỉnh sửa cá nhân trước đó sẽ bị xóa sạch và không thể hoàn tác.');
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
          HienThongBao(t('data_update_fetch_error') || 'Lỗi kiểm tra dữ liệu từ Github hoặc định dạng không hợp lệ.', 'loi');
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

// === [-- 3. UPDATE SYSTEM --] ===
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
                  muc.textContent = t('completed') || "Hoàn tất";
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

  tb.style.cursor = 'pointer';
  tb.addEventListener('click', function () {
    if (this.classList.contains('dang-xoa')) return;
    this.classList.add('dang-xoa');
    this.style.animation = 'mooDan 0.2s forwards';
    setTimeout(() => { if (this.parentNode) this.remove(); }, 200);
  });
  vung.appendChild(tb);
  setTimeout(function () { if (tb.parentNode) tb.remove(); }, 4000);
}

// === [-- 4. PROGRESS UI --] ===
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
    if (mb) { mb.style.width = '0%'; mb.style.background = (tieuDe.toLowerCase().includes('gỡ') || tieuDe.toLowerCase().includes('uninstall')) ? 'var(--nguy-hiem)' : ''; }
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

  document.getElementById('tien-trinh-thanh').style.background = isUninstall ? 'var(--nguy-hiem)' : '';

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
      BatTatHopThoai('hop-thoai-tien-trinh', false);
      let mini = document.getElementById('sidebar-mini-progress');
      if (mini) mini.style.display = 'flex';
    });
  }

  let miniProgClick = document.getElementById('sidebar-mini-progress');
  if (miniProgClick && !miniProgClick.dataset.hasListener) {
    miniProgClick.dataset.hasListener = 'true';
    miniProgClick.addEventListener('click', () => {
      miniProgClick.style.display = 'none';
      BatTatHopThoai('hop-thoai-tien-trinh', true);
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

      if (opts.taoDiemLuu) stagesData.push({ id: 'rs', name: 'Điểm lưu' });
      stagesData.push({ id: 'un', name: 'Gỡ cài đặt' });
      if (opts.xoaTanDu) stagesData.push({ id: 'cl', name: 'Xóa tàn dư' });
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

    let appMode = typeof app === 'object' && app.mode ? app.mode : (isUninstall ? (t('single_thread') || 'Đơn luồng') : (t('single_thread') || 'Đơn luồng'));
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
    tt.style.width = '200px';
    tt.style.flexShrink = '0';
    tt.style.display = 'flex';
    tt.style.alignItems = 'center';
    tt.style.justifyContent = 'flex-end';
    tt.style.fontSize = '0.9em';
    tt.style.paddingRight = '12px';
    tt.id = 'tien-trinh-tt-' + encodeURIComponent(tenApp).replace(/%/g, '_');
    tt.innerHTML = '<span class="status-text" style="display: inline-block; width: 170px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px;">' + (t('waiting_status') || 'Đang chờ...') + '</span><span class="spinner" id="spinner-' + encodeURIComponent(tenApp).replace(/%/g, '_') + '" style="display: none; flex-shrink: 0;"></span>';
    tt.style.color = 'var(--chu-phu)';

    hang.appendChild(tenWrap);
    hang.appendChild(tt);
    ds.appendChild(hang);
  });
  if (ds.lastChild) {
    ds.lastChild.style.borderBottom = 'none';
  }
  if (CauHinh.chungHienTienTrinh) {
    if (h && h.id) BatTatHopThoai(h.id, true);
  } else {
    let mini = document.getElementById('sidebar-mini-progress');
    if (mini) mini.style.display = 'flex';
  }
  ds.scrollTop = 0;
}
function CapNhatHopThoaiTienTrinh(tenApp, phanTram, trangThai, mauChu, fullStatus, rawStatus) {
  var h = document.getElementById('hop-thoai-tien-trinh');
  if (!h) return;

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
          if (tieuDe) tieuDe.textContent = hasError ? (t('process_ended_error') || 'Tiến trình kết thúc (Có lỗi nghiêm trọng)') : (t('process_ended') || 'Hoàn tất tiến trình');
        } else if (hasDownloading) {
          dlStage.style.background = 'var(--canh-bao)';
          inStage.style.background = 'var(--nen-tang3)';
          if (tieuDe) tieuDe.textContent = t('downloading_data') || 'Đang tải xuống dữ liệu...';
        } else {
          dlStage.style.background = 'var(--thanh-cong)';
          inStage.style.background = 'var(--canh-bao)';
          if (tieuDe) {
            let txt = (typeof BoLocHienTai !== 'undefined' && BoLocHienTai === 'updates') ? t('updating_app') : t('installing_app');
            tieuDe.textContent = txt || 'Đang tiến hành cài đặt...';
          }
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
        if (allDoneOrError) tieuDe.textContent = hasError ? (t('process_ended_error') || 'Tiến trình kết thúc (Có lỗi)') : (t('process_ended') || 'Hoàn tất tiến trình');
        else if (targetStage === 'rs') tieuDe.textContent = t('creating_restore_point') || 'Đang tạo điểm khôi phục...';
        else if (targetStage === 'cl') tieuDe.textContent = t('cleanup_status') || 'Đang quét dữ liệu thừa...';
        else tieuDe.textContent = t('uninstalling_app') || 'Đang tiến hành gỡ cài đặt...';
      }
    }

    if (tieuDe) {
      let miniTieuDe = document.getElementById('mini-progress-title');
      if (miniTieuDe) miniTieuDe.textContent = tieuDe.textContent;
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
              BatTatHopThoai('hop-thoai-bao-cao-loi', true);
            };
          }
        } else {
          btnHuy.style.background = 'var(--mau-nhan)';
          btnHuy.style.color = 'white';
          btnHuy.style.border = 'none';
          if (btnBaoCao) btnBaoCao.style.display = 'none';
        }
      }
    }
  }

  let isUninstall = window.isUninstallMode;
  let mauThanh = isUninstall ? 'var(--nguy-hiem)' : '';
  document.getElementById('tien-trinh-thanh').style.background = mauThanh;
  let mb = document.getElementById('mini-progress-bar');
  if (mb) mb.style.background = mauThanh;

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
        let statusText = k.success ? (t('completed') || 'Hoàn tất') : (t('error_status') || 'Lỗi');
        ttEl.textContent = statusText;
        ttEl.className = 'TienTrinh_TrangThai ' + (k.success ? 'thanh-cong' : 'loi');
        ttEl.style.color = '';
        ttEl.title = statusText;
      }
      if (!k.success) coLoi = true;
    });
  }
  let tieuDe = document.getElementById('tien-trinh-tieu-de');
  if (tieuDe) tieuDe.textContent = coLoi ? (t('process_ended_error') || 'Tiến trình kết thúc (Có lỗi)') : (t('process_ended') || 'Hoàn tất tiến trình');

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
  document.getElementById('tien-trinh-thanh').style.background = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)';
  document.getElementById('tien-trinh-phan-tram').textContent = '100%';

  let miniProgEnd = document.getElementById('sidebar-mini-progress');
  if (miniProgEnd) {
    let mt = document.getElementById('mini-progress-title');
    if (mt) { mt.textContent = coLoi ? (t('process_ended_error') || 'Tiến trình kết thúc (Có lỗi)') : (t('completed') || 'Hoàn tất'); mt.style.color = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
    let mp = document.getElementById('mini-progress-percent');
    if (mp) { mp.textContent = '100%'; mp.style.color = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
    let mb = document.getElementById('mini-progress-bar');
    if (mb) { mb.style.width = '100%'; mb.style.background = coLoi ? 'var(--nguy-hiem)' : 'var(--thanh-cong)'; }
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
  let btnSkip = document.getElementById('bo-qua-tien-trinh');
  if (btnSkip) btnSkip.style.display = 'none';
  
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
      BatTatHopThoai('hop-thoai-bao-cao-loi', true);
    };
  }
}
document.getElementById('dong-bao-cao-loi-x')?.addEventListener('click', () => {
  BatTatHopThoai('hop-thoai-bao-cao-loi', false);
});
document.getElementById('dong-bao-cao-loi-ok')?.addEventListener('click', () => {
  BatTatHopThoai('hop-thoai-bao-cao-loi', false);
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
// === [-- 5. UNINSTALLER & CONFIRMATION --] ===
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
            window.DienTu.LayThongTinThem(app.name, app.installLocation, app.installDate || null).then(info => {
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
      if (hopThoai && hopThoai.id) BatTatHopThoai(hopThoai.id, false);
      nutHuy?.removeEventListener('click', xuliHuy);
      nutGo?.removeEventListener('click', xuliGo);
      nutPrev?.removeEventListener('click', xuliPrev);
      nutNext?.removeEventListener('click', xuliNext);
      resolve(false);
    };
    var xuliGo = () => {
      if (hopThoai && hopThoai.id) BatTatHopThoai(hopThoai.id, false);
      nutHuy?.removeEventListener('click', xuliHuy);
      nutGo?.removeEventListener('click', xuliGo);
      nutPrev?.removeEventListener('click', xuliPrev);
      nutNext?.removeEventListener('click', xuliNext);
      resolve(true);
    };
    nutHuy?.addEventListener('click', xuliHuy);
    nutGo?.addEventListener('click', xuliGo);
    if (hopThoai && hopThoai.id) BatTatHopThoai(hopThoai.id, true);
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
// === [-- 6. DATA DESTROY & RECOVER --] ===
let duongDanPhaHuy = "";
let laPhaHuyODia = false;
let mucDoNhayCam = 1;
let demXacNhan = 0;
document.addEventListener('DOMContentLoaded', () => {


document.addEventListener('click', function(e) {
  const wrap = e.target.closest('.CaiDat_Dropdown');
  const isMuc = e.target.closest('.CaiDat_Dropdown_Muc');
  
  
  document.querySelectorAll('.CaiDat_Dropdown.mo').forEach(el => {
    if (el !== wrap) el.classList.remove('mo');
  });

  if (wrap) {
    if (isMuc) {
      let val = isMuc.getAttribute('data-value');
      wrap.setAttribute('data-value', val);
      
      
      let textSpan = wrap.querySelector('.CaiDat_Dropdown_Chon span, .CaiDat_Dropdown_Chon div');
      if (!textSpan) {
         
         textSpan = wrap.querySelector('.CaiDat_Dropdown_Chon');
         if(textSpan) textSpan.innerText = isMuc.innerText;
      } else {
         textSpan.innerText = isMuc.innerText;
      }

      
      if (wrap.id === 'cd-ngon-ngu-wrap' && val !== (typeof NgonNguHT !== 'undefined' ? NgonNguHT : '')) {
        if(typeof DatNgonNgu === 'function') DatNgonNgu(val);
        if(typeof MoHopThoaiCaiDat === 'function') MoHopThoaiCaiDat();
      }
      
      
      const evt = new CustomEvent('dropdownChange', { detail: { value: val } });
      wrap.dispatchEvent(evt);
    }
    
    
    if (isMuc) {
      wrap.classList.remove('mo');
    } else {
      const chon = e.target.closest('.CaiDat_Dropdown_Chon');
      if (chon) {
        if (e.target.tagName.toLowerCase() !== 'input' || !wrap.classList.contains('mo')) {
          wrap.classList.toggle('mo');
        }
      }
    }
  }
});

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
      HienThongBao(t('choose_recover_folder') || "Vui lòng chọn thư mục lưu kết quả khôi phục", "canh-bao");
      return;
    }
    drive = drive.replace(/\\/g, "").replace(/\/\//g, "");
    if (drive.length === 1) drive += ":";
    if (!drive.startsWith("\\\\.\\")) {
      drive = "\\\\.\\" + drive;
    }
    btnBatDauKhoiPhuc.disabled = true;
    divTienTrinhKhoiPhuc.style.display = "block";
    txtTienTrinhKhoiPhuc.textContent = t('starting_scan') || "Đang bắt đầu quét...";
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

// === [-- 7. REGISTRY & FILE LEFTOVERS --] ===
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

// === [-- 8. RESTORE POINTS --] ===
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
        rpList.reverse().forEach(rp => {
          let dateStr = "Unknown Date";
          if (rp.CreationTime) {
            if (typeof rp.CreationTime === 'string' && rp.CreationTime.includes('/Date(')) {
              let msMatch = rp.CreationTime.match(/\d+/);
              if (msMatch) dateStr = new Date(parseInt(msMatch[0])).toLocaleString();
            } else if (typeof rp.CreationTime === 'string' && rp.CreationTime.length >= 14 && /^\d{14}/.test(rp.CreationTime)) {
              let y = rp.CreationTime.substring(0,4);
              let m = parseInt(rp.CreationTime.substring(4,6)) - 1;
              let d = rp.CreationTime.substring(6,8);
              let h = rp.CreationTime.substring(8,10);
              let min = rp.CreationTime.substring(10,12);
              let sec = rp.CreationTime.substring(12,14);
              dateStr = new Date(y, m, d, h, min, sec).toLocaleString();
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
                        <button class="Nut Nut--Huy btn-delete-rp" data-seq="${rp.SequenceNumber}" style="padding: 6px 10px; font-size: 0.85rem; margin-left: 12px;">${t('delete_btn') || 'Xóa'}</button>
                    `;
          oldContainer.appendChild(el);
        });

        document.querySelectorAll('.btn-delete-rp').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            let btnEl = e.currentTarget;
            let seq = btnEl.getAttribute('data-seq');
            btnEl.disabled = true;
            btnEl.textContent = t('deleting') || 'Đang xóa...';
            try {
              await window.DienTu.XoaDiemKhoiPhuc(parseInt(seq));
              btnEl.closest('div').remove();
            } catch (err) {
              btnEl.disabled = false;
              btnEl.textContent = t('error_status') || 'Lỗi';
            }
          });
        });
      } else {
        oldContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--chu-phu); font-size: 0.9rem;">' + (t('no_restore_points') || 'Không có điểm khôi phục nào trên máy.') + '</div>';
      }
    }
  } catch (e) {
    loading.style.display = 'none';
    oldContainer.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--nguy-hiem); font-size: 0.9rem;">${e || t('error_restore_points') || 'Lỗi khi tải danh sách điểm khôi phục. (Yêu cầu quyền Admin)'}</div>`;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const btnSetMonitor = document.getElementById('btn-set-lock-monitor');
  const shortcutMonitor = document.getElementById('shortcut-lock-monitor');

  if (btnSetMonitor) {
    btnSetMonitor.addEventListener('click', () => {
      shortcutMonitor.textContent = (typeof t === 'function' && t('press_key')) ? t('press_key') : 'Nhấn phím...';
      setTimeout(() => { shortcutMonitor.textContent = 'Ctrl+Alt+M'; }, 1500);
    });
  }

  const btnSetArea = document.getElementById('btn-set-lock-area');
  const shortcutArea = document.getElementById('shortcut-lock-area');
  const btnSelectWindow = document.getElementById('btn-select-window');
  const selectedWindowName = document.getElementById('selected-window-name');

  if (btnSelectWindow) {
    btnSelectWindow.addEventListener('click', () => {
      selectedWindowName.textContent = (typeof t === 'function' && t('selecting')) ? t('selecting') : 'Đang chọn...';
      setTimeout(() => { selectedWindowName.textContent = 'Cửa sổ: Task Manager'; }, 1500);
    });
  }

  if (btnSetArea) {
    btnSetArea.addEventListener('click', () => {
      shortcutArea.textContent = (typeof t === 'function' && t('press_key')) ? t('press_key') : 'Nhấn phím...';
      setTimeout(() => { shortcutArea.textContent = 'Ctrl+Alt+A'; }, 1500);
    });
  }

  const btnSetPoint = document.getElementById('btn-set-lock-pos');
  const shortcutPoint = document.getElementById('shortcut-lock-pos');

  if (btnSetPoint) {
    btnSetPoint.addEventListener('click', () => {
      shortcutPoint.textContent = (typeof t === 'function' && t('press_key')) ? t('press_key') : 'Nhấn phím...';
      setTimeout(() => { shortcutPoint.textContent = 'Ctrl+Alt+P'; }, 1500);
    });
  }
});


document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    

    const openModals = document.querySelectorAll('.HopThoai:not(.an)');
    if (openModals.length > 0) {
      let highestModal = openModals[0];
      let maxZ = parseInt(window.getComputedStyle(highestModal).zIndex) || 0;

      openModals.forEach(m => {
        let z = parseInt(window.getComputedStyle(m).zIndex) || 0;
        if (z > maxZ) {
          maxZ = z;
          highestModal = m;
        }
      });

      if (highestModal.id !== 'hop-thoai-tien-trinh') {
        BatTatHopThoai(highestModal.id, false);
      }
    }
  }
});

// === [-- 9. MISC HELPERS --] ===
window.XacNhanHanhDongAsync = function (message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('hop-thoai-xac-nhan');
    if (!modal) return resolve(confirm(message));

    const contentEl = document.getElementById('xac-nhan-noi-dung');
    if (contentEl) contentEl.textContent = message;

    const btnOk = document.getElementById('xacnhan-ok-btn');
    const btnCancel = document.getElementById('xacnhan-huy-btn');
    const btnClose = document.getElementById('xacnhan-dong-btn');

    const cleanup = () => {
      if (btnOk) btnOk.onclick = null;
      if (btnCancel) btnCancel.onclick = null;
      if (btnClose) btnClose.onclick = null;
      if (modal.id) { BatTatHopThoai(modal.id, false); } else { modal.classList.add('an'); }
    };

    if (btnOk) btnOk.onclick = () => { cleanup(); resolve(true); };
    if (btnCancel) btnCancel.onclick = () => { cleanup(); resolve(false); };
    if (btnClose) btnClose.onclick = () => { cleanup(); resolve(false); };

    if (modal.id) { BatTatHopThoai(modal.id, true); } else { modal.classList.remove('an'); }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.InputCombobox').forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--mau-chinh)';
      const dropdownId = input.getAttribute('data-dropdown');
      if (dropdownId) {
        const d = document.getElementById(dropdownId);
        if (d) d.classList.remove('an');
      }
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'var(--vien)';
      const dropdownId = input.getAttribute('data-dropdown');
      if (dropdownId) setTimeout(() => {
        const el = document.getElementById(dropdownId);
        if (el) el.classList.add('an');
      }, 200);
    });
  });

  document.querySelectorAll('.ComboboxItem').forEach(item => {
    item.addEventListener('mousedown', () => {
      const targetId = item.getAttribute('data-target');
      const value = item.getAttribute('data-value');
      if (targetId && value) {
        const tInput = document.getElementById(targetId);
        if (tInput) tInput.value = value;
      }
    });
  });

  document.querySelectorAll('.SourceTypeItem').forEach(item => {
    item.addEventListener('mousedown', () => {
      const val = item.getAttribute('data-value');
      const el = document.getElementById('them-app-kieu-nguon');
      if (!el) return;
      el.dataset.value = val;
      const txt = item.textContent.trim();
      const nhanText = el.querySelector('.NhanText');
      if (nhanText) nhanText.textContent = txt;

      const idInput = document.getElementById('them-app-id');
      const btnWinget = document.getElementById('btn-tim-winget');
      const btnFile = document.getElementById('btn-chon-file-cai-dat');
      if (!idInput) return;

      if (val === 'Link') {
        idInput.placeholder = 'https://...';
        if (btnWinget) btnWinget.style.display = 'none';
        if (btnFile) btnFile.style.display = 'none';
      } else if (val === 'Package') {
        idInput.placeholder = 'C:\\Downloads\\installer.exe';
        if (btnWinget) btnWinget.style.display = 'none';
        if (btnFile) btnFile.style.display = 'flex';
      } else if (val === 'Winget') {
        idInput.placeholder = (typeof t === 'function') ? t('add_app_id_ph') : 'Winget ID';
        if (btnWinget) btnWinget.style.display = 'flex';
        if (btnFile) btnFile.style.display = 'none';
      } else if (val === 'Store') {
        idInput.placeholder = (typeof t === 'function') ? t('add_app_store_id_ph') : 'Store ID';
        if (btnWinget) btnWinget.style.display = 'none';
        if (btnFile) btnFile.style.display = 'none';
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const btnDongTroGiup = document.getElementById('dong-tro-giup-ok');
  if (btnDongTroGiup) {
    btnDongTroGiup.addEventListener('click', () => {
      if (typeof BatTatHopThoai === 'function') BatTatHopThoai('hop-thoai-tro-giup', false);
    });
  }
});

document.addEventListener('click', function (e) {
  var btnSvg = e.target.closest('.BtnTroGiupSvg');
  if (btnSvg) {
    if (typeof HienHopThoaiTroGiup === 'function') {
      HienHopThoaiTroGiup(decodeURIComponent(btnSvg.dataset.tab || ''), decodeURIComponent(btnSvg.dataset.help || ''));
    }
  }
  var btnDm = e.target.closest('.BtnDanhMucDis');
  if (btnDm) {
    var cb = document.getElementById('cd-chung-danh-muc');
    if (cb && cb.disabled && typeof HienThongBao === 'function') {
      HienThongBao(decodeURIComponent(btnDm.dataset.msg || ''), 'thong-tin');
    }
  }
});

document.querySelectorAll('.KhoaChuot_NutToggle').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const targetId = btn.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      if (btn.classList.contains('active')) {
        targetEl.classList.remove('an');
      } else {
        targetEl.classList.add('an');
      }
    }
  });
});