# Nex v1.4.0

### ✨ TÍNH NĂNG MỚI

- **Nút "Luôn trên cùng" (Always on Top):** Giữ cửa sổ Nex luôn hiển thị phía trên các ứng dụng khác. Trạng thái được áp dụng cho cả Installer và Uninstaller.

- **Kiểm tra trùng lặp trước khi cài:** Installer tự động quét Windows Registry để xác định ứng dụng đã cài hay chưa, bỏ qua nếu đã có — tiết kiệm thời gian khi batch install.

- **Quét ứng dụng UWP (Microsoft Store):** Uninstaller giờ quét cả ứng dụng UWP qua `Get-AppxPackage`, hiển thị đầy đủ thông tin publisher, ngày cài đặt ước tính, và dung lượng.

- **Quét icon từ Start Menu:** Hệ thống dùng COM API đọc shortcut `.lnk` trong Start Menu để lấy icon cho các ứng dụng mà registry không có `DisplayIcon`.

- **Ước tính ngày cài đặt & dung lượng:** Khi registry thiếu thông tin, tự tính từ thư mục cài đặt. Giá trị ước tính được đánh dấu riêng kèm tooltip thông báo.

- **Format ngày theo ngôn ngữ:** Hiển thị `dd/mm/yyyy` cho tiếng Việt, `mm/dd/yyyy` cho tiếng Anh thay vì raw `YYYYMMDD`.

- **Cài đặt thông báo chi tiết:** Tùy chọn bật/tắt thông báo riêng biệt khi thu nhỏ vào tray và khi hoàn tất cài đặt.

- **Tùy chọn đơn luồng / đa luồng:** Chọn giữa cài tuần tự (ổn định) hoặc đa luồng 5 workers (nhanh hơn cho batch lớn).

### 🚀 CẢI TIẾN

- **Header cột Uninstaller mới:** Dùng custom widget `ClickableHeader` thay vì button, hỗ trợ styling sort indicator linh hoạt hơn.
- **Separator phân cách:** Thêm đường kẻ ngăn giữa nội dung và toolbar, giao diện rõ ràng hơn.
- **Fix icon extraction:** Kiểm tra `painter.begin()` trước khi vẽ, xử lý lỗi an toàn hơn.
- **Retry thông minh hơn:** Ẩn trạng thái "failed" khi hệ thống vẫn đang retry (tối đa 3 lần).
- **Lọc registry tốt hơn:** Thêm filter `NoRemove`, `ReleaseType`, kết hợp tên + publisher làm ID tránh trùng lặp.
