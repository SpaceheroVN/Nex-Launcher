# Nex v1.0.0 — Phiên bản đầu tiên

### ✨ TÍNH NĂNG CHÍNH

- **Trình cài đặt hàng loạt (Batch Installer):** Cài đặt hàng chục ứng dụng và game chỉ bằng một click, hỗ trợ chế độ cài đặt im lặng (silent) với các tham số phổ biến (NSIS `/S`, MSI `/qn`, Inno Setup `/verysilent`).

- **Đa nguồn cài đặt:** Hỗ trợ thêm phần mềm từ file local (`.exe`, `.msi`, `.bat`) hoặc từ link download trực tiếp. Ứng dụng tự động tải file về thư mục tạm trước khi cài.

- **Quản lý danh sách phần mềm:** Tổ chức phần mềm theo 2 tab: Ứng dụng và Game. Hỗ trợ xuất/nhập danh sách dưới dạng file JSON để sao lưu hoặc chia sẻ giữa các máy.

- **Kho phần mềm online:** Lần đầu khởi chạy, ứng dụng tự động đề xuất tải danh sách phần mềm cơ bản từ GitHub để bắt đầu nhanh.

- **Giao diện hiện đại (PyQt6):** Hỗ trợ theme Sáng/Tối, song ngữ Tiếng Anh & Tiếng Việt, tìm kiếm nhanh, và kéo thả file installer vào cửa sổ để thêm.

- **Tích hợp System Tray:** Thu nhỏ vào khay hệ thống khi chạy nền, hiển thị thông báo tiến trình cài đặt mà không làm gián đoạn công việc.
