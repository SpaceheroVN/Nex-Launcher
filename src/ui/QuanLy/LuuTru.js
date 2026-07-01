// === [ CACHE & STORAGE (IndexedDB) ] ===
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
function SaveIconDB(name, b64) {
  if (typeof CauHinh !== 'undefined' && CauHinh.uninstallerGhiNhoDuLieu === false) return;
  if (!window.IconDB || !b64) return;
  try { window.IconDB.transaction('icons', 'readwrite').objectStore('icons').put(b64, name); } catch (e) { }
}
function GetIconDB(name) {
  return new Promise(function (res) {
    if (typeof CauHinh !== 'undefined' && CauHinh.uninstallerGhiNhoDuLieu === false) return res(null);
    if (!window.IconDB) return res(null);
    try {
      const req = window.IconDB.transaction('icons', 'readonly').objectStore('icons').get(name);
      req.onsuccess = function () { res(req.result || null); };
      req.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
function SaveDateDB(name, dateStr) {
  if (typeof CauHinh !== 'undefined' && CauHinh.uninstallerGhiNhoDuLieu === false) return;
  if (!window.IconDB || !dateStr) return;
  try { window.IconDB.transaction('dates', 'readwrite').objectStore('dates').put(dateStr, name); } catch (e) { }
}
function GetDateDB(name) {
  return new Promise(function (res) {
    if (typeof CauHinh !== 'undefined' && CauHinh.uninstallerGhiNhoDuLieu === false) return res(null);
    if (!window.IconDB) return res(null);
    try {
      const req = window.IconDB.transaction('dates', 'readonly').objectStore('dates').get(name);
      req.onsuccess = function () { res(req.result || null); };
      req.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
