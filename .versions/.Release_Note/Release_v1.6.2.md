# Nex v1.6.2

> 🔧 **Bản cập nhật hoàn thiện hệ thống:** Nâng cấp trải nghiệm thông báo cập nhật trực quan hơn và giải quyết dứt điểm các lỗi trong luồng tải/cài đặt tự động.

### ✨ TÍNH NĂNG MỚI

- **Chỉ báo cập nhật trực quan (Glowing Dot):** Ứng dụng giờ đây sẽ tự động kiểm tra phiên bản mới ngầm mỗi khi khởi động. Nếu phát hiện bản cập nhật, một chấm nhỏ màu cam tỏa sáng sẽ xuất hiện và nhấp nháy êm dịu ở góc biểu tượng Cập nhật trên thanh tiêu đề. Giúp người dùng dễ dàng nhận biết có phiên bản mới mà không cần phải truy cập sâu vào menu.

### 🚀 CẢI TIẾN & SỬA LỖI

- **Sửa lỗi khóa file (OS error 32) khi cài đặt cập nhật:** Khắc phục triệt để lỗi trình tự động cập nhật tải xong file cài đặt nhưng bị chặn khởi chạy. Nguyên nhân do luồng ghi file chưa giải phóng khóa (lock) trước khi gọi lệnh thực thi. Hệ thống hiện đã chủ động đóng handle (lệnh `drop`) ngay trước khi kích hoạt bộ cài.
- **Sửa lỗi tham số giao tiếp frontend - backend:** Xử lý lỗi giao diện (JavaScript) truyền sai định dạng chữ hoa/chữ thường của tham số (`Url`, `FileName` thay vì `url`, `fileName`) xuống nhân Rust, khiến quá trình gọi lệnh tải bản cập nhật bị thất bại do thiếu key.
- **Tinh chỉnh hiệu ứng thị giác:** Tối ưu hóa hiệu ứng nhấp nháy của chấm thông báo cập nhật (chu kỳ 2 giây, nhịp thở mượt mà) với cường độ tỏa sáng mềm mại, không gây chói mắt và bám sát hoàn toàn vào góc biểu tượng.
