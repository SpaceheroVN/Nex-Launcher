# Hướng dẫn dành cho lập trình viên

Cảm ơn bạn đã quan tâm đến Nex Launcher! Tài liệu này sẽ giúp bạn thiết lập môi trường, hiểu cấu trúc mã nguồn và bắt đầu đóng góp.

---

## Mục lục

- [Yêu cầu](#yêu-cầu)
- [Thiết lập](#thiết-lập)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Kiến trúc Tauri](#kiến-trúc-tauri)
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
| Rust | v1.77+ |
| Windows | 10 hoặc 11 |

> **Lưu ý:** Cần cài đặt [Rust toolchain](https://www.rust-lang.org/tools/install) và [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) trước khi chạy.

## Thiết lập

```bash
# 1. Clone repository
git clone https://github.com/SpaceheroVN/Nex-Launcher.git
cd Nex-Launcher

# 2. Cài đặt JS dependencies
npm install

# 3. Chạy development mode (tự build Rust backend + serve frontend)
npm run dev
```

## Cấu trúc thư mục

```
Nex-Launcher/
├── package.json              # Metadata & scripts (tauri dev/build)
├── README.md                 # Giới thiệu cho người dùng
├── README_DEV.md             # Tài liệu này
├── LICENSE
├── Basic.json                # Danh sách phần mềm mẫu
├── Basic/                    # Dữ liệu bổ sung (Apps/Games)
│
└── src-tauri/                # ─── Toàn bộ mã nguồn ───
    ├── Cargo.toml            # Rust dependencies
    ├── tauri.conf.json       # Tauri configuration
    ├── build.rs              # Tauri build script
    ├── capabilities/         # Tauri permission capabilities
    │   └── default.json
    │
    ├── core/                 # ─── Backend Rust ───
    │   ├── main.rs           # Rust entry point
    │   ├── lib.rs            # Plugin setup & handler registration
    │   └── GiaoTiepIPC.rs    # Tất cả IPC command handlers
    │
    └── ui/                   # ─── Frontend (WebView) ───
        ├── index.html        # Giao diện chính
        ├── TienTrinh.html    # Cửa sổ tiến trình (multi-window)
        ├── KhoiChay.js       # Logic renderer (i18n, theme, UI, settings)
        ├── TienTrinh.js      # Logic cửa sổ tiến trình
        ├── CauNoiTauri.js    # Tauri IPC Bridge (window.__TAURI__)
        │
        ├── KieuDang/         # CSS (3 files)
        │   ├── GocThietKe.css    # Design tokens, reset, base
        │   ├── ThanhPhan.css     # Components (titlebar, sidebar, list, toast...)
        │   └── CaiDat.css        # Settings modal, dialogs, sliders
        │
        └── TaiNguyen/        # Static assets
            ├── BieuTuong/    # SVG icons, logo.ico
            └── Languages.js  # Dữ liệu đa ngôn ngữ (VN/EN)
```

## Kiến trúc Tauri

```
┌─────────────────────────────────────────┐
│  GiaoTiepIPC.rs  (Rust Backend)         │
│  - IPC command handlers                 │
│  - Winget integration (install/remove)  │
│  - System info (sysinfo crate)          │
│  - File operations (phá hủy, dọn dẹp)  │
│  - PowerShell scripts (registry scan)   │
└────────────┬────────────────────────────┘
             │ Tauri IPC (invoke/listen)
┌────────────▼────────────────────────────┐
│  CauNoiTauri.js  (IPC Bridge)           │
│  - window.__TAURI__.core.invoke()       │
│  - window.__TAURI__.event.listen()      │
│  - Expose window.DienTu API             │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  KhoiChay.js  (Renderer / UI Logic)     │
│  - UI logic, i18n, theme                │
│  - Settings dialog (5 tabs)             │
│  - Installer & Uninstaller lists        │
│  - Tiện ích (dọn dẹp, phá hủy, khôi phục)│
└─────────────────────────────────────────┘
```

## Quy ước đặt tên

Dự án dùng **tiếng Việt PascalCase** (không dấu). Đây là quy ước bắt buộc.

### Files & Thư mục

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| File JS | PascalCase | `KhoiChay.js`, `CauNoiTauri.js` |
| File CSS | PascalCase | `GocThietKe.css`, `ThanhPhan.css` |
| File Rust | PascalCase | `GiaoTiepIPC.rs` |
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

Thêm key vào cả 2 ngôn ngữ trong file `TaiNguyen/Languages.js`:

```js
var Languages = {
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
| `npm run dev` | Chạy dev mode (Tauri dev server + Rust hot reload) |
| `npm run build` | Build production (Tauri bundle → NSIS installer) |

---

*Nex Launcher v1.6.0 — Phát triển bởi SpaceheroVN — Powered by Tauri v2*
