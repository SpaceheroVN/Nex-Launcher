# Function.py (Phiên bản đã sửa lỗi)

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QGridLayout, QLabel, QCheckBox,
    QScrollArea, QFrame, QPushButton, QMenu
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from functools import partial

def add_new_software(database: list, name: str, item_type: str) -> dict:
    new_item = { 'name': name, 'type': item_type, 'source': {'type': 'Unknown', 'value': None, 'silent_args': ''} }
    database.append(new_item)
    return new_item

def remove_software_items(database: list, items_to_remove: list) -> list:
    names_to_remove = {item['name'] for item in items_to_remove}
    return [item for item in database if item['name'] not in names_to_remove]

def filter_list_by_name(page_widget: QWidget, search_text: str):
    search_text = search_text.lower()
    if not page_widget: return
    for row_widget in page_widget.findChildren(QWidget, "rowContainer"):
        label = row_widget.findChild(QLabel)
        if label: row_widget.setVisible(search_text in label.text().lower())

def create_software_list_page(software_list: list, filter_type: str, source_edit_handler) -> QScrollArea:
    scroll_area = QScrollArea()
    scroll_area.setWidgetResizable(True)
    scroll_area.setObjectName("contentScroll")
    page_content_widget = QWidget()
    content_layout = QVBoxLayout(page_content_widget)
    content_layout.setContentsMargins(10, 0, 10, 0)
    content_layout.setSpacing(0)
    header_font = QFont("Segoe UI", 12, QFont.Weight.Bold)
    header_layout = QGridLayout()
    header_layout.setContentsMargins(5, 5, 5, 5)
    headers = [QLabel(""), QLabel("Name"), QLabel("Source")]
    headers[1].setAlignment(Qt.AlignmentFlag.AlignLeft)
    headers[2].setAlignment(Qt.AlignmentFlag.AlignHCenter)
    for lbl in headers: lbl.setFont(header_font)
    header_layout.addWidget(headers[0], 0, 0); header_layout.addWidget(headers[1], 0, 1)
    header_layout.addWidget(headers[2], 0, 2); header_layout.setColumnStretch(1, 1)
    content_layout.addLayout(header_layout)
    line = QFrame(); line.setFrameShape(QFrame.Shape.HLine); line.setFrameShadow(QFrame.Shadow.Sunken)
    content_layout.addWidget(line)
    list_container = QWidget()
    list_layout = QVBoxLayout(list_container)
    list_layout.setContentsMargins(0, 0, 0, 0); list_layout.setSpacing(5)

    # SỬA LỖI: Tạo một hàm trợ giúp để xử lý lựa chọn menu một cách chính xác
    def _handle_menu_action(button, item_data, new_type):
        """Cập nhật văn bản của nút TRƯỚC, sau đó gọi trình xử lý chính."""
        button.setText(new_type)
        source_edit_handler(button, item_data)

    def add_items_to_layout(items, layout):
        for item_data in items:
            row_container = QWidget(); row_container.setObjectName("rowContainer")
            row_layout = QGridLayout(row_container); row_layout.setContentsMargins(5, 8, 5, 8)
            checkbox = QCheckBox(); checkbox.setProperty("software_data", item_data)
            name_label = QLabel(item_data['name'])
            source_info = item_data.get('source', {})
            source_button = QPushButton(source_info.get('type', 'Unknown'))
            source_button.setFixedWidth(140)
            source_menu = QMenu(source_button)
            source_types = ["Unknown", "Package", "Link"]
            
            # SỬA LỖI: Thay đổi cách kết nối tín hiệu để đảm bảo logic đúng
            for source_type in source_types:
                action = source_menu.addAction(source_type)
                # Sử dụng lambda để bắt đúng `source_type` cho mỗi mục menu
                action.triggered.connect(
                    lambda checked=False, btn=source_button, data=item_data, type=source_type: 
                    _handle_menu_action(btn, data, type)
                )

            source_button.setMenu(source_menu)
            font = QFont("Segoe UI", 11); name_label.setFont(font)
            row_layout.addWidget(checkbox, 0, 0, Qt.AlignmentFlag.AlignHCenter)
            row_layout.addWidget(name_label, 0, 1, Qt.AlignmentFlag.AlignLeft)
            row_layout.addWidget(source_button, 0, 2, Qt.AlignmentFlag.AlignHCenter)
            row_layout.setColumnStretch(1, 1)
            layout.addWidget(row_container)

    if filter_type == 'all':
        apps = sorted([s for s in software_list if s['type'] == 'app'], key=lambda x: x['name'])
        games = sorted([s for s in software_list if s['type'] == 'game'], key=lambda x: x['name'])
        if apps:
            app_header = QLabel("Applications"); app_header.setProperty("class", "ListHeader")
            list_layout.addWidget(app_header); add_items_to_layout(apps, list_layout)
        if apps and games: list_layout.addSpacing(20)
        if games:
            game_header = QLabel("Games"); game_header.setProperty("class", "ListHeader")
            list_layout.addWidget(game_header); add_items_to_layout(games, list_layout)
    else:
        filtered_list = sorted([s for s in software_list if s['type'] == filter_type], key=lambda x: x['name'])
        add_items_to_layout(filtered_list, list_layout)
    list_layout.addStretch(1); content_layout.addWidget(list_container)
    scroll_area.setWidget(page_content_widget)
    return scroll_area