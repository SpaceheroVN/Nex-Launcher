// CauNoiTruoc.js - Preload script: Cầu nối an toàn giữa main process và renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('DienTu', {
  // Dieu khien cua so
  ThuNho: () => ipcRenderer.send('dieu-khien-cua-so', 'thu-nho'),
  PhongTo: () => ipcRenderer.send('dieu-khien-cua-so', 'phong-to'),
  DongCuaSo: () => ipcRenderer.send('dieu-khien-cua-so', 'dong'),

  // Lay trang thai
  LayTrangThaiCuaSo: () => ipcRenderer.invoke('lay-trang-thai-cua-so'),
  LayChuDeHeThong: () => ipcRenderer.invoke('lay-chu-de-he-thong'),
  HuyTuyChonKhoiDong: (pm) => ipcRenderer.invoke('huy-tuy-chon-khoi-dong', pm),
  LayIconApp: (appName) => ipcRenderer.invoke('lay-icon-app', appName),
  LayThongTinThem: (appName) => ipcRenderer.invoke('lay-thong-tin-them', appName),

  // Lang nghe su kien
  KhiTrangThaiCuaSoThayDoi: (HamXuLy) => {
    ipcRenderer.on('trang-thai-cua-so', (SuKien, DuLieu) => HamXuLy(DuLieu));
  },
  KhiChuyenTrang: (HamXuLy) => {
    ipcRenderer.on('chuyen-trang', (SuKien, trang) => HamXuLy(trang));
  },

  // Quan ly ung dung
  LayDanhSachUngDung: () => ipcRenderer.invoke('lay-danh-sach-ung-dung'),
  LayPhanMemDaCai: () => ipcRenderer.invoke('lay-phan-mem-da-cai'),
  TienHanhCaiDat: (apps) => ipcRenderer.invoke('tien-hanh-cai-dat', apps),
  TienHanhGoCaiDat: (apps) => ipcRenderer.invoke('tien-hanh-go-cai-dat', apps),
  ThemUngDungInstaller: (appInfo) => ipcRenderer.invoke('them-ung-dung-installer', appInfo),
  XoaUngDungInstaller: (danhSachTen) => ipcRenderer.invoke('xoa-ung-dung-installer', danhSachTen),
  TimKiemWinget: (ten) => ipcRenderer.invoke('tim-kiem-winget', ten),
  KhiTienTrinhCaiDat: (HamXuLy) => {
    ipcRenderer.on('tien-trinh-cai-dat', (SuKien, DuLieu) => HamXuLy(DuLieu));
  },
  KhiTienTrinhGoCaiDat: (HamXuLy) => {
    ipcRenderer.on('tien-trinh-go-cai-dat', (SuKien, DuLieu) => HamXuLy(DuLieu));
  }
});
