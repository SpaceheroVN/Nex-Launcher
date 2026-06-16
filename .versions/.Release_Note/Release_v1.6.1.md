# Nex v1.6.1

> 🔧 **Bản cập nhật chất lượng:** Tập trung vào đồng bộ dữ liệu thông minh, cải thiện gỡ cài đặt và trải nghiệm người dùng.

### ✨ TÍNH NĂNG MỚI

- **Merge thông minh danh sách phần mềm (Remote ↔ Local):** Khi tải `Basic.json` từ GitHub, hệ thống merge dữ liệu remote với local thay vì ghi đè. Ứng dụng do người dùng thêm (flag `edit`) được giữ lại, ứng dụng đánh dấu xóa (flag `delete`) không mất khi đồng bộ, trạng thái `recommended` được bảo toàn.

- **Nút "Đặt lại danh sách" (`DatLaiDanhSachUngDung`):** Cho phép khôi phục danh sách Installer về mặc định — xóa các ứng dụng do người dùng tự thêm, bỏ flag `delete`/`edit`, đồng bộ lại từ remote. Tích hợp vào quy trình Reset cài đặt.

- **Tab "Đề xuất" (Recommended):** Tab mặc định đổi từ "Tất cả" sang tab Đề xuất, hiển thị danh sách phần mềm thiết yếu bắt buộc (.NET 8.0 x64/x86, VC++ 2005-2022) cùng các ứng dụng được đánh dấu `recommended` — giúp người dùng mới cài đặt nhanh bộ phần mềm cần thiết.

- **Bảo vệ phần mềm mặc định (flag `khongSuaXoa`):** Các ứng dụng thiết yếu được đánh dấu `khongSuaXoa` sẽ ẩn nút sửa và không thể bị xóa khỏi danh sách Installer, ngăn người dùng vô tình loại bỏ phần mềm quan trọng.

- **Xác minh gỡ cài đặt bằng Registry:** Sau khi trình gỡ cài đặt kết thúc, hệ thống kiểm tra lại registry key xem phần mềm đã thực sự bị xóa chưa — phát hiện trường hợp người dùng bấm Cancel/Skip trong wizard. Timeout 15 phút, có hỗ trợ hủy.

- **Fallback cập nhật `winget upgrade → winget install --force`:** Khi `winget upgrade` trả mã lỗi `-1978335212` (không tìm thấy bản upgrade phù hợp), tự động chuyển sang `winget install --force` để cài đè phiên bản mới.

- **Chọn file cài đặt (Package type):** Thêm loại nguồn "File (.exe/.msi)" trong dialog Thêm ứng dụng — duyệt file cài đặt từ máy tính qua nút Browse, dùng `start /wait` để chạy installer đồng bộ.

- **Cột "Phiên bản" trong tab Cập nhật:** Hiển thị cột phiên bản riêng với badge trực quan (phiên bản hiện tại → phiên bản mới) khi ở tab Cập nhật.

### 🚀 CẢI TIẾN

- **Xóa mềm (soft delete) thay vì xóa cứng:** Khi xóa ứng dụng khỏi Installer, hệ thống đánh dấu `delete: true` thay vì xóa vĩnh viễn — đảm bảo không bị thêm lại khi đồng bộ từ remote.
- **Gỡ cài đặt qua file `.bat` tạm:** Chuyển từ chạy trực tiếp `cmd.exe /C` sang tạo file `.bat` tạm rồi chạy qua `Start-Process -Verb RunAs`, xử lý đúng escape characters và arguments phức tạp. File `.bat` tự xóa sau khi chạy.
- **Bảo toàn arguments gốc khi gỡ cài đặt:** Giữ lại arguments ban đầu từ `UninstallString` khi thêm silent flags, tránh mất tham số cần thiết.
- **Package installer dùng `start /wait`:** Chuyển từ `cmd.exe /C` sang `start /wait` khi chạy file cài đặt local, đảm bảo chờ installer kết thúc trước khi báo kết quả.
- **Cài đặt phân nhóm rõ ràng:** Trang Cài đặt thêm tiêu đề phụ phân nhóm ("Hệ thống & Cửa sổ", "Tiến trình & Thông báo", "Giao diện") giúp tìm tùy chọn dễ hơn.
- **Bố cục cột cân đối hơn:** Điều chỉnh tỉ lệ flex cột Tên từ `2` xuống `1.5`, cân đối hiển thị khi có thêm cột Phiên bản.
- **Expose `KiemTraDevMode` ra frontend:** Bridge Tauri bổ sung hàm kiểm tra chế độ dev từ phía giao diện.
