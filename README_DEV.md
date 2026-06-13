# Hướng dẫn dành cho lập trình viên

Cảm ơn bạn đã quan tâm đến Nex Launcher! Tài liệu này sẽ giúp bạn thiết lập môi trường, hiểu cấu trúc mã nguồn và bắt đầu đóng góp.

---

## Mục lục

- [Yêu cầu](#yêu-cầu)
- [Thiết lập](#thiết-lập)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Quy ước đặt tên](#quy-ước-đặt-tên)
- [Kiến trúc CSS](#kiến-trúc-css)
- [Đa ngôn ngữ (i18n)](#đa-ngôn-ngữ-i18n)
- [Scripts](#scripts)

---

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | v18+ |
| npm | Đi kèm Node.js |
| Windows | 10 hoặc 11 |

## Thiết lập

```bash
# 1. Clone repository
git clone https://github.com/SpaceheroVN/Nex-Launcher.git
cd Nex-Launcher

# 2. Cài đặt dependencies
npm install

# 3. Chạy development mode
npm run dev
```

> **Lưu ý:** App đã tự thêm `--disable-gpu --no-sandbox` trong script để tránh lỗi GPU trên một số máy.

## Cấu trúc thư mục

```
Nex-Launcher/
├── package.json              # Metadata & scripts
├── README.md                 # Giới thiệu cho người dùng
├── ReadmeDev.md              # Tài liệu này
├── LICENSE
│
├── src/
│   ├── ui/                   # ─── Frontend (Electron Renderer) ───
│   │   ├── index.html        # Giao diện chính
│   │   ├── KhoiChay.js       # Logic renderer (i18n, theme, UI, settings)
│   │   ├── TienTrinhChinh.js # Main process (tạo cửa sổ, IPC)
│   │   ├── CauNoiTruoc.js    # Preload script (bridge IPC)
│   │   │
│   │   ├── KieuDang/         # CSS (3 files)
│   │   │   ├── GocThietKe.css    # Design tokens, reset, base
│   │   │   ├── ThanhPhan.css     # Components (titlebar, sidebar, list, toast...)
│   │   │   └── CaiDat.css        # Settings modal, dialogs, sliders
│   │   │
│   │   └── TaiNguyen/        # Static assets
│   │       └── BieuTuong/    # SVG icons, logo.ico
│   │
│   └── core/                 # ─── Backend C++ (bản gốc Qt, chỉ tham khảo) ───
│
├── Basic.json                # Danh sách phần mềm mẫu
└── Basic/                    # Dữ liệu bổ sung
```

## Quy ước đặt tên

Dự án dùng **tiếng Việt PascalCase** (không dấu). Đây là quy ước bắt buộc.

### Files & Thư mục

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| File JS | PascalCase | `KhoiChay.js`, `TienTrinhChinh.js` |
| File CSS | PascalCase | `GocThietKe.css`, `ThanhPhan.css` |
| Thư mục | PascalCase | `KieuDang/`, `TaiNguyen/` |

### CSS Classes (BEM-style)

| Phần | Quy tắc | Ví dụ |
|------|---------|-------|
| Block | PascalCase | `.ThanhTieuDe`, `.ThanhBen` |
| Element | `_` phân cách | `.ThanhBen_MucCon`, `.HopThoai_NoiDung` |
| Modifier | `--` phân cách | `.Nut--chinh`, `.HopThoai_NoiDung--rong` |
| State class | chữ thường, gạch ngang | `.dang-chon`, `.dang-mo`, `.thu-gon` |

### CSS Variables

```css
--nen-tang0      /* nền tầng 0 (tối nhất) */
--chu-chinh      /* chữ chính */
--mau-nhan       /* màu nhấn (accent) */
--do-bo          /* độ bo góc */
--chuyen-dong    /* transition timing */
```

## Kiến trúc CSS

3 file, load theo thứ tự:

| # | File | Vai trò |
|---|------|---------|
| 1 | `GocThietKe.css` | Design tokens (`--nen-tang0`, `--mau-nhan`...), reset CSS, scrollbar, base elements |
| 2 | `ThanhPhan.css` | Tất cả UI components: titlebar, sidebar, buttons, search, table, list rows, toast, animations |
| 3 | `CaiDat.css` | Settings dialog (5 tab), About dialog, toggle switches, sliders, theme picker |

**Light/Dark** dùng `data-chu-de` attribute trên `<html>`:

```html
<html data-chu-de="dark">  <!-- hoặc "light" -->
```

## Đa ngôn ngữ (i18n)

Hỗ trợ **VN** (Tiếng Việt) và **EN** (English).

### Cách dùng trong HTML

```html
<span data-i18n="installer_btn">Trình Cài Đặt</span>
<input data-i18n-placeholder="search_placeholder" placeholder="Tìm kiếm...">
```

### Cách thêm chuỗi mới

Thêm key vào cả 2 ngôn ngữ trong object `banDich` ở đầu file `KhoiChay.js`:

```js
var banDich = {
  EN: {
    my_new_key: "English text",
    // ...
  },
  VN: {
    my_new_key: "Tiếng Việt",
    // ...
  }
};
```

Sau đó dùng `t('my_new_key')` trong JS hoặc `data-i18n="my_new_key"` trong HTML.

## Scripts

| Lệnh | Mô tả |
|-------|--------|
| `npm run dev` | Chạy dev mode (có `--disable-gpu --no-sandbox`) |
| `npm run start` | Tương tự `dev` |
| `npm run build` | Build production (cần cài thêm `electron-builder`) |

## Electron Architecture

```
┌─────────────────────────────────────────┐
│  TienTrinhChinh.js  (Main Process)      │
│  - Tạo BrowserWindow                   │
│  - Xử lý IPC (thu nhỏ, phóng to, đóng)│
│  - System tray                          │
└────────────┬────────────────────────────┘
             │ IPC (contextBridge)
┌────────────▼────────────────────────────┐
│  CauNoiTruoc.js  (Preload Script)       │
│  - Expose window.dienTu API             │
│  - thuNho(), phongTo(), dongCuaSo()     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  KhoiChay.js  (Renderer Process)        │
│  - UI logic, i18n, theme                │
│  - Settings dialog (5 tabs)             │
│  - Installer & Uninstaller lists        │
└─────────────────────────────────────────┘
```

---

*Nex Launcher v1.6.0 — Phát triển bởi SpaceheroVN*
