// === [ DATA FETCHING & RENDERING ] ===
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
          if (!it.isDeep) {
            window.PushIconQueue(it.name, it.iconId, 2, true);
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