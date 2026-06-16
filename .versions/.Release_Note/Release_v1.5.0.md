# Nex v1.5.0 — Viết lại bằng C++/Qt6

> ⚠️ **Viết lại hoàn toàn:** Chuyển từ Python/PyQt6 sang **C++17 native** với **Qt 6.11.1**, build bằng CMake.

### ✨ TÍNH NĂNG MỚI

- **Giao diện một cửa sổ duy nhất:** Bỏ kiến trúc cũ (Launcher mở cửa sổ riêng cho mỗi tool). Giờ tất cả nằm trong một cửa sổ với **sidebar trái** (`QTreeWidget`) và **stacked widget** chuyển đổi giữa Installer/Uninstaller.

- **Sidebar với phân loại chi tiết:**
  - Installer: Tất cả, Phần mềm, Trò chơi, Cập nhật.
  - Uninstaller: Mọi chương trình, Cài đặt gần đây, Phần mềm lớn, Hệ thống, Bên ngoài.
  - Sidebar có thể thu gọn/mở rộng, accordion behavior (expand 1 → collapse cái kia).

- **Custom Title Bar:** Thanh tiêu đề tùy chỉnh với nút Toggle Sidebar, Menu (Settings, Check Updates, About), Minimize, Maximize/Restore, Close — dùng SVG icons colorize theo theme.

- **Settings tập trung (`Cai_Dat_Chung`):** Một dialog quản lý cài đặt cho cả Launcher, Installer và Uninstaller, thay vì settings riêng lẻ.

- **Auto-detect phần cứng yếu:** Kiểm tra RAM (≤4GB), CPU (≤2 cores), RAM usage (≥85%) → tự bật `disable_animations`.

- **Tùy chỉnh nâng cao:** Font size, độ trong suốt cửa sổ (opacity), bo góc (border radius).

- **Kiểm tra cập nhật:** Kiểm tra phiên bản mới từ GitHub qua `QNetworkAccessManager`.

- **Custom MessageBox + Blur Effect:** Dialog tùy chỉnh theo theme, tự động blur cửa sổ chính khi mở dialog.

- **Single Instance:** Dùng Windows Mutex ngăn chạy nhiều instance cùng lúc.

### 🚀 CẢI TIẾN

- **Hiệu năng vượt trội:** Compiled C++ thay vì interpreted Python — khởi động nhanh, file nhỏ gọn hơn.
- **Theme transition mượt:** Loading overlay khi chuyển theme, tránh flicker.
- **Tray Icon mở rộng:** Menu tray có quick-access cho Installer, Uninstaller, About.
- **Maximize thông minh:** Tự điều chỉnh border-radius và icon khi chuyển giữa windowed/maximized.
