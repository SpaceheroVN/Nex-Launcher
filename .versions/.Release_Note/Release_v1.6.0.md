# Nex v1.6.0 — Viết lại bằng Tauri 2 + Rust + Web UI

> ⚠️ **Viết lại hoàn toàn:** Chuyển từ C++/Qt6 sang **Tauri 2** (Rust backend + HTML/CSS/JS frontend). Kiến trúc production hiện tại.

### ✨ TÍNH NĂNG MỚI

- **Kiến trúc Tauri 2 + Rust:** Backend Rust với `reqwest`, `sysinfo`, `serde_json`. Frontend HTML/CSS/JS thuần, giao tiếp qua `invoke()`. File executable nhỏ gọn, không cần Python runtime hay Qt DLLs.

- **Trình tải bất đồng bộ native (`reqwest`):** Download file cài đặt qua Rust async streaming, với progress bar real-time (0-100%) thay vì dùng PowerShell `Invoke-WebRequest`.

- **Kiểm tra & cập nhật phần mềm:** Quét ứng dụng có bản cập nhật mới qua `winget upgrade`, parse output tự động, cập nhật hàng loạt với progress tracking.

- **Quét và dọn dẹp tàn dư phần mềm:** Sau khi gỡ cài đặt, quét sâu tàn dư trong Registry và thư mục hệ thống (AppData, ProgramFiles, ProgramData...). Cho phép chọn xóa từng tàn dư.

- **Dọn dẹp ứng dụng "ma" (Ghost Cleanup):** Phát hiện ứng dụng còn registry nhưng file `.exe` đã bị xóa → tự động xóa registry entry thay vì báo lỗi.

- **`Basic.json` đóng gói sẵn:** Danh sách phần mềm mặc định bundled trong app. Khi offline, dùng file local thay vì tải từ GitHub.

- **Cửa sổ tiến trình riêng:** Mở cửa sổ Tauri riêng biệt khi cài đặt/gỡ cài đặt, hiển thị progress bar chi tiết.

- **Hủy tiến trình:** Dùng `AtomicBool` cho phép hủy cài đặt/gỡ cài đặt đang chạy, tự kill child process.

- **Chạy process native:** Winget và Package được gọi trực tiếp qua `Command::new()` thay vì qua PowerShell, tăng tốc độ và bảo mật.

- **Post-install command:** Hỗ trợ chạy script tùy chỉnh sau khi cài đặt thành công.

- **Xử lý exit code Winget thông minh:** Nhận diện các mã đặc biệt (đã cài, cần restart, phiên bản khác đã có) và coi là thành công.

- **Tiện ích nâng cao:** Phá hủy dữ liệu an toàn, kiểm tra thư mục nhạy cảm, khôi phục, sửa chữa phần mềm, quản lý tài nguyên hệ thống.

### 🚀 CẢI TIẾN

- **Custom dialogs đẹp hơn:** Thay thế system dialogs bằng dialog HTML/CSS tùy chỉnh theo dark/light theme.
- **Gỡ UWP trực tiếp:** Dùng `Remove-AppxPackage -AllUsers` cho ứng dụng Microsoft Store.
- **Silent uninstall thông minh:** Thử `QuietUninstallString` → fallback `UninstallString` + flags → fallback `winget uninstall`.
- **Encoded PowerShell:** Dùng `-EncodedCommand` (Base64) tránh vấn đề escape characters.
- **UI Web hiện đại:** HTML/CSS/JS cho phép styling linh hoạt hơn Qt — gradient, animations, CSS variables.
- **File size giảm đáng kể:** Không cần bundle Python (~30MB) hay Qt DLLs (~50MB+), dùng WebView2 có sẵn trên Windows 10/11.
