cmake_minimum_required(VERSION 3.16)
project(NexLauncher VERSION 1.5 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable Qt's automatic MOC, UIC, and RCC
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Set Qt6 path explicitly
set(CMAKE_PREFIX_PATH "C:/Qt/6.11.1/msvc2022_64" ${CMAKE_PREFIX_PATH})

# Find Qt6 modules
find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets Network Svg)

# Source files
set(SOURCES
    src/main.cpp
    src/Cau_Hinh.cpp
    src/Gioi_Thieu.cpp
    src/Chay_Nex.cpp
    src/Cai_Dat_Chung.cpp
    src/NexMessageBox.cpp
    src/Installer/Cau_Hinh_Cai_Dat.cpp
    src/Installer/Tac_Vu_Cai_Dat.cpp
    src/Installer/Trinh_Cai_Dat.cpp
    src/Installer/Cong_Cu_Cai_Dat.cpp
    src/Installer/Hop_Thoai_Cai_Dat.cpp
    src/Uninstaller/Cau_Hinh_Go_Cai_Dat.cpp
    src/Uninstaller/Hop_Thoai_Go_Cai_Dat.cpp
    src/Uninstaller/Cong_Cu_Go_Cai_Dat.cpp
    src/Uninstaller/Trinh_Go_Cai_Dat.cpp
    resources.qrc
    app_icon.rc
)

# Header files
set(HEADERS
    src/Cau_Hinh.h
    src/Gioi_Thieu.h
    src/Chay_Nex.h
    src/Cai_Dat_Chung.h
    src/NexMessageBox.h
    src/Installer/Cau_Hinh_Cai_Dat.h
    src/Installer/Tac_Vu_Cai_Dat.h
    src/Installer/Trinh_Cai_Dat.h
    src/Installer/Cong_Cu_Cai_Dat.h
    src/Installer/Hop_Thoai_Cai_Dat.h
    src/Uninstaller/Cau_Hinh_Go_Cai_Dat.h
    src/Uninstaller/Hop_Thoai_Go_Cai_Dat.h
    src/Uninstaller/Cong_Cu_Go_Cai_Dat.h
    src/Uninstaller/Trinh_Go_Cai_Dat.h
)

# Executable target
if(WIN32)
    add_executable(NexLauncher WIN32 ${SOURCES} ${HEADERS})
else()
    add_executable(NexLauncher ${SOURCES} ${HEADERS})
endif()

# Link libraries
target_link_libraries(NexLauncher PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Network
    Qt6::Svg
)

# Add Advapi32 for Windows registry operations (winreg) and Shell32
if(WIN32)
    target_link_libraries(NexLauncher PRIVATE advapi32 shell32)
endif()
