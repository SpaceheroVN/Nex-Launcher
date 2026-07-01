// === [ CONFIGURATION & STATE ] ===
var NgonNguHienTai = 'VN', ChuDeHienTai = 'dark', CaiDatTrangHienTai = 0;
var TienTrinhSoApp = 0, TienTrinhHienTai = 0, TienTrinhAppTruoc = '';
let ChuDeKhiMo = '', NgonNguKhiMo = '';

var CacheTimKiemWinget = new Map();
window.IconCache = {};
window.SizeCache = {};
window.DateCache = {};

var _renderVersion = 0;

window.IconFetchQueue = [];
window.IconFetchActive = 0;
window.IconFetchDeepActive = 0;

window.InfoFetchQueue = [];
window.InfoFetchActive = 0;

var DanhSachBatBuoc = [
  { "category": ".NET", "name": ".NET 8.0 (x64)", "source": { "type": "Winget", "value": "Microsoft.DotNet.DesktopRuntime.8" }, "type": "app", "khongSuaXoa": true },
  { "category": ".NET", "name": ".NET 8.0 (x86)", "source": { "silent_args": "--architecture x86", "type": "Winget", "value": "Microsoft.DotNet.DesktopRuntime.8" }, "type": "app", "khongSuaXoa": true },
  { "category": "VC++ Redistributables", "name": "All Visual C++ 2005-2022 Redistributable", "source": { "type": "Winget", "value": "abbodi1406.vcredist" }, "type": "app", "khongSuaXoa": true }
];

var DanhSachPhanMem = [], DanhSachDaCaiDat = [], TrangHienTai = 'installer', BoLocHienTai = 'rec', CotSapXep = 'name', HuongSapXep = true;
