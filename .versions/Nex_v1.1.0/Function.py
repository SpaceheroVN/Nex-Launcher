from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QGridLayout, QLabel, QCheckBox, QHBoxLayout,
    QScrollArea, QFrame, QPushButton, QMenu
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QFont
from functools import partial
from language import TRANSLATIONS, DETAILED_CATEGORIES

def add_new_software(database: list, name: str, item_type: str, category: str = None) -> dict:
    new_item = {
        'name': name,
        'type': item_type,
        'category': category,
        'source': {'type': 'Unknown', 'value': None, 'silent_args': ''}
    }
    database.append(new_item)
    return new_item

def remove_software_items(database: list, items_to_remove: list) -> list:
    names_to_remove = {item['name'] for item in items_to_remove}
    return [item for item in database if item['name'] not in names_to_remove]

def filter_list_by_name(page_widget: QWidget, search_text: str):
    search_text = search_text.lower()
    if not page_widget: return
    
    for header in page_widget.findChildren(QLabel, "ListHeader"):
        has_visible_item = False
        container = header.property("container")
        if container:
            for item_widget in container.findChildren(QWidget):
                if item_widget.objectName() in ["gridItem", "rowContainer"]:
                    checkbox = item_widget.findChild(QCheckBox)
                    if checkbox:
                        is_visible = search_text in checkbox.text().lower()
                        item_widget.setVisible(is_visible)
                        if is_visible:
                            has_visible_item = True
                        
                        if item_widget.objectName() == "rowContainer":
                            line = item_widget.property("separator_line")
                            if line:
                                line.setVisible(is_visible)

            header.setVisible(has_visible_item)
            select_all_button = header.property("select_all_button")
            if select_all_button:
                select_all_button.setVisible(has_visible_item)


def _create_list_view_for_items(items: list, list_layout: QVBoxLayout, source_edit_handler, toggle_all_handler, t: dict, page_content_widget: QWidget):
    if not items:
        return

    main_list_container = QWidget()
    main_list_layout = QVBoxLayout(main_list_container)
    main_list_layout.setContentsMargins(0,0,0,0)
    main_list_layout.setSpacing(0)
    
    select_all_button = QPushButton(t['select_all_btn'])
    select_all_button.setObjectName("selectAllButton")
    main_list_layout.addWidget(select_all_button)
    main_list_layout.addSpacing(10)

    item_widgets_container = QWidget()
    layout = QVBoxLayout(item_widgets_container)
    layout.setContentsMargins(0,0,0,0)
    layout.setSpacing(0)

    def _handle_menu_action(button, item_data, new_type):
        button.setText(new_type)
        source_edit_handler(button, item_data)
        
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
        
        for source_type in source_types:
            action = source_menu.addAction(source_type)
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

        separator_line = QFrame()
        separator_line.setFrameShape(QFrame.Shape.HLine)
        separator_line.setFrameShadow(QFrame.Shadow.Sunken)
        separator_line.setStyleSheet("color: #e0e0e0;")
        layout.addWidget(separator_line)
        row_container.setProperty("separator_line", separator_line)
    
    main_list_layout.addWidget(item_widgets_container)
    list_layout.addWidget(main_list_container)
    select_all_button.clicked.connect(lambda: toggle_all_handler(item_widgets_container, select_all_button))


def _create_grid_view_for_apps(apps: list, list_layout: QVBoxLayout, toggle_all_handler, lang: str, t: dict):
    if not apps:
        return

    en_categories = DETAILED_CATEGORIES['EN']
    lang_categories = DETAILED_CATEGORIES[lang]

    apps_by_en_category = {}
    for item in apps:
        category = item.get('category') or "Utilities"
        if category not in apps_by_en_category:
            apps_by_en_category[category] = []
        apps_by_en_category[category].append(item)
    
    sorted_en_categories = [cat for cat in en_categories if cat in apps_by_en_category and en_categories[cat] == 'app']
    
    lang_cat_map = {en_cat: la_cat for en_cat, la_cat in zip(en_categories.keys(), lang_categories.keys())}

    for en_category_name in sorted_en_categories:
        items = sorted(apps_by_en_category[en_category_name], key=lambda x: x['name'])
        if not items: continue
        
        lang_category_name = lang_cat_map.get(en_category_name, en_category_name)
        
        header_widget = QWidget()
        header_layout = QHBoxLayout(header_widget)
        header_layout.setContentsMargins(0,0,0,0)

        cat_header = QLabel(lang_category_name)
        cat_header.setProperty("class", "ListHeader")
        
        select_all_button = QPushButton(t['select_all_btn'])
        select_all_button.setObjectName("selectAllButton")
        select_all_button.setFixedWidth(140)

        header_layout.addWidget(cat_header)
        header_layout.addStretch()
        header_layout.addWidget(select_all_button)
        list_layout.addWidget(header_widget)
        
        grid_container = QWidget()
        grid_layout = QGridLayout(grid_container)
        grid_layout.setSpacing(10)
        row, col = 0, 0
        for item_data in items:
            item_widget = QWidget()
            item_widget.setObjectName("gridItem")
            
            checkbox = QCheckBox(item_data['name'])
            checkbox.setProperty("software_data", item_data)
            
            item_h_layout = QHBoxLayout(item_widget)
            item_h_layout.setContentsMargins(5, 5, 5, 5)
            item_h_layout.addWidget(checkbox)
            item_h_layout.addStretch()

            grid_layout.addWidget(item_widget, row, col)
            col += 1
            if col >= 3:
                col = 0
                row += 1
        
        list_layout.addWidget(grid_container)
        list_layout.addSpacing(15)
        
        cat_header.setProperty("container", grid_container)
        cat_header.setProperty("select_all_button", select_all_button)
        select_all_button.clicked.connect(partial(toggle_all_handler, grid_container, select_all_button))

def create_software_list_page(software_list: list, filter_type: str, source_edit_handler, toggle_all_handler, settings: dict, lang: str) -> QScrollArea:
    scroll_area = QScrollArea()
    scroll_area.setWidgetResizable(True)
    scroll_area.setObjectName("contentScroll")
    page_content_widget = QWidget()
    content_layout = QVBoxLayout(page_content_widget)
    content_layout.setContentsMargins(10, 0, 10, 10)
    content_layout.setSpacing(0)
    t = TRANSLATIONS[lang]

    list_container = QWidget()
    list_layout = QVBoxLayout(list_container)
    list_layout.setContentsMargins(0, 5, 0, 0)
    list_layout.setSpacing(5)

    use_detailed = settings.get("use_detailed_categories", False)
    apps = sorted([s for s in software_list if s['type'] == 'app'], key=lambda x: x['name'])
    games = sorted([s for s in software_list if s['type'] == 'game'], key=lambda x: x['name'])

    if filter_type == 'app':
        if use_detailed:
            _create_grid_view_for_apps(apps, list_layout, toggle_all_handler, lang, t)
        else:
            _create_list_view_for_items(apps, list_layout, source_edit_handler, toggle_all_handler, t, page_content_widget)

    elif filter_type == 'game':
        _create_list_view_for_items(games, list_layout, source_edit_handler, toggle_all_handler, t, page_content_widget)

    elif filter_type == 'all':
        if apps:
            app_header = QLabel(t['item_type_app'])
            app_header.setProperty("class", "ListHeader")
            list_layout.addWidget(app_header)
            
            app_container = QWidget()
            app_header.setProperty("container", app_container)
            app_header.setProperty("select_all_button", None)

            if use_detailed:
                _create_grid_view_for_apps(apps, list_layout, toggle_all_handler, lang, t)
            else:
                 _create_list_view_for_items(apps, list_layout, source_edit_handler, toggle_all_handler, t, page_content_widget)
        
        if apps and games:
            list_layout.addSpacing(20)

        if games:
            game_header = QLabel(t['item_type_game'])
            game_header.setProperty("class", "ListHeader")
            list_layout.addWidget(game_header)

            game_container = QWidget()
            game_header.setProperty("container", game_container)
            game_header.setProperty("select_all_button", None)
            
            _create_list_view_for_items(games, list_layout, source_edit_handler, toggle_all_handler, t, page_content_widget)

    list_layout.addStretch(1)
    content_layout.addWidget(list_container)
    scroll_area.setWidget(page_content_widget)
    return scroll_area