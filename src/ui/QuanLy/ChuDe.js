// === [ THEME LOGIC ] ===
function KhoiTaoChuDe() { ChuDeHienTai = localStorage.getItem('nex_chu_de') || 'dark'; ApDungChuDe(ChuDeHienTai); }
function DatChuDe(c) { ChuDeHienTai = c; localStorage.setItem('nex_chu_de', c); ApDungChuDe(c); }
function LayChuDe() { return ChuDeHienTai; }
function ApDungChuDe(c) {
  var cd = c; if (c === 'system') { cd = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  document.documentElement.setAttribute('data-chu-de', cd);
}