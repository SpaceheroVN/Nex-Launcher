const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('DienTu', {
  ThuNho: () => ipcRenderer.send('dieu-khien-cua-so', 'thu-nho'),
  AnCuaSo: () => ipcRenderer.send('dieu-khien-cua-so', 'an-cua-so'),
  PhongTo: () => ipcRenderer.send('dieu-khien-cua-so', 'phong-to'),
  DongCuaSo: () => ipcRenderer.send('dieu-khien-cua-so', 'dong'),
  HienCuaSo: () => ipcRenderer.send('dieu-khien-cua-so', 'hien-cua-so'),
  LayTrangThaiCuaSo: () => ipcRenderer.invoke('lay-trang-thai-cua-so'),
  LayChuDeHeThong: () => ipcRenderer.invoke('lay-chu-de-he-thong'),
  DatLuonTrenCung: (val) => ipcRenderer.invoke('dat-luon-tren-cung', val),
  DatThuNhoKhay: (val) => ipcRenderer.invoke('dat-thu-nho-khay', val),
  KiemTraCapNhat: () => ipcRenderer.invoke('kiem-tra-cap-nhat'),
  LayIconApp: (appName) => ipcRenderer.invoke('lay-icon-app', appName),
  LayThongTinThem: (appName, installLoc) => ipcRenderer.invoke('lay-thong-tin-them', appName, installLoc),
  KiemTraTaiNguyen: () => ipcRenderer.invoke('kiem-tra-tai-nguyen'),
  DonDepHeThong: (cheDoc) => ipcRenderer.invoke('don-dep-he-thong', cheDoc),
  KhiTrangThaiCuaSoThayDoi: (HamXuLy) => {
    ipcRenderer.on('trang-thai-cua-so', (SuKien, DuLieu) => HamXuLy(DuLieu));
  },
  KhiChuyenTrang: (HamXuLy) => {
    ipcRenderer.on('chuyen-trang', (SuKien, trang) => HamXuLy(trang));
  },
  LayDanhSachUngDung: () => ipcRenderer.invoke('lay-danh-sach-ung-dung'),
  LayPhanMemDaCai: () => ipcRenderer.invoke('lay-phan-mem-da-cai'),
  TienHanhCaiDat: (apps, options) => ipcRenderer.invoke('tien-hanh-cai-dat', apps, options),
  TienHanhGoCaiDat: (apps, options) => ipcRenderer.invoke('tien-hanh-go-cai-dat', apps, options),
  TienHanhCapNhat: (apps, options) => ipcRenderer.invoke('tien-hanh-cap-nhat', apps, options),
  HuyTienTrinh: () => ipcRenderer.send('huy-tien-trinh'),
  SuaPhanMemKhac: (appInfo) => ipcRenderer.invoke('sua-phan-mem-khac', appInfo),
  ThemUngDungInstaller: (appInfo) => ipcRenderer.invoke('them-ung-dung-installer', appInfo),
  SuaUngDungInstaller: (oldName, newAppInfo) => ipcRenderer.invoke('sua-ung-dung-installer', oldName, newAppInfo),
  XoaUngDungInstaller: (appName) => ipcRenderer.invoke('xoa-ung-dung-installer', appName),
  TimKiemWinget: (ten) => ipcRenderer.invoke('tim-kiem-winget', ten),
  KhiTienTrinhCaiDat: (HamXuLy) => {
    ipcRenderer.on('tien-trinh-cai-dat', (SuKien, DuLieu) => HamXuLy(DuLieu));
  },
  KhiTienTrinhGoCaiDat: (HamXuLy) => {
    ipcRenderer.on('tien-trinh-go-cai-dat', (SuKien, DuLieu) => HamXuLy(DuLieu));
  },
  PhaHuyDuLieu: (targetPath, options) => ipcRenderer.invoke('pha-huy-du-lieu', targetPath, options),
  KiemTraThuMucNhayCam: (targetPath) => ipcRenderer.invoke('kiem-tra-thu-muc-nhay-cam', targetPath),
  ChonDuongDanPhaHuy: (type) => ipcRenderer.invoke('chon-duong-dan-pha-huy', type),
  KhoiPhucDuLieu: (drivePath, outDir) => ipcRenderer.invoke('tien-hanh-khoi-phuc', drivePath, outDir),
  KhiTienTrinhKhoiPhuc: (HamXuLy) => ipcRenderer.on('tien-trinh-khoi-phuc', (SuKien, percent) => HamXuLy(percent)),
  DatTienTrinh: (percent, text) => ipcRenderer.send('dat-tien-trinh', { percent, text }),
  MoCuaSoTienTrinh: (tieuDe, danhSachApp) => ipcRenderer.invoke('mo-cua-so-tien-trinh', tieuDe, danhSachApp),
  DongCuaSoTienTrinh: () => ipcRenderer.send('dong-cua-so-tien-trinh'),
  CapNhatCuaSoTienTrinh: (DuLieu) => ipcRenderer.send('cap-nhat-cua-so-tien-trinh', DuLieu),
  HoanTatCuaSoTienTrinh: (ketQua) => ipcRenderer.send('hoan-tat-cua-so-tien-trinh', ketQua),
  KhiKhoiTaoTienTrinh: (HamXuLy) => ipcRenderer.on('khoi-tao-tien-trinh', (SuKien, DuLieu) => HamXuLy(DuLieu)),
  KhiCapNhatTienTrinh: (HamXuLy) => ipcRenderer.on('cap-nhat-tien-trinh', (SuKien, DuLieu) => HamXuLy(DuLieu)),
  KhiHoanTatTienTrinh: (HamXuLy) => ipcRenderer.on('hoan-tat-tien-trinh', (SuKien, ketQua) => HamXuLy(ketQua))
});
