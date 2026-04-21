#!/usr/bin/env python3
"""
Mochi 桌面宠物 - 跨平台版本 (macOS & Windows)
"""

import sys
import os
import platform

# 检测操作系统
IS_MAC = platform.system() == 'Darwin'
IS_WINDOWS = platform.system() == 'Windows'


def get_resource_path():
    """获取资源路径（支持开发和打包后）"""
    if getattr(sys, 'frozen', False):
        # PyInstaller 打包后的路径
        exe_path = sys.executable
        # 在 macOS app bundle 中，可执行文件在 Contents/MacOS/ 下
        if IS_MAC and 'Mochi.app' in exe_path:
            # 找到 Mochi.app 的路径
            parts = exe_path.split('Mochi.app')
            app_path = parts[0] + 'Mochi.app'
            resources_path = os.path.join(app_path, 'Contents', 'Resources')
            print(f"资源路径: {resources_path}")
            return resources_path
        # Windows 打包后，资源在 exe 同级目录
        return os.path.dirname(exe_path)
    # 开发环境
    return os.path.dirname(os.path.abspath(__file__))


def get_icon_path():
    """获取图标路径（根据平台选择不同格式）"""
    resource_path = get_resource_path()
    if IS_MAC:
        icon_path = os.path.join(resource_path, 'icon.icns')
        if os.path.exists(icon_path):
            return icon_path
    elif IS_WINDOWS:
        icon_path = os.path.join(resource_path, 'icon.ico')
        if os.path.exists(icon_path):
            return icon_path
    # 默认使用 png
    return os.path.join(resource_path, 'icon_preview_v7.png')


from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QSystemTrayIcon, QMenu, QAction
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage
from PyQt5.QtCore import QUrl, Qt, QPoint
from PyQt5.QtGui import QIcon, QColor


class TransparentPage(QWebEnginePage):
    """自定义页面，设置透明背景"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setBackgroundColor(QColor(0, 0, 0, 0))
    
    def createWindow(self, window_type):
        """处理新窗口请求（如 target='_blank' 的链接）"""
        # 创建一个新的页面来处理链接
        new_page = TransparentPage(self.parent())
        new_page.urlChanged.connect(self._on_new_window_url_changed)
        return new_page
    
    def _on_new_window_url_changed(self, url):
        """当新窗口 URL 改变时，用系统浏览器打开"""
        import webbrowser
        webbrowser.open(url.toString())
        # 关闭新创建的页面（因为我们用系统浏览器打开了）
        self.parent().close()


class MochiPet(QWidget):
    def __init__(self):
        super().__init__()
        self.dragging = False
        self.drag_pos = QPoint()
        self.click_through_mode = False
        self.init_ui()
        self.init_tray()

    def init_ui(self):
        # 窗口标志：无边框 + 始终置顶 + 工具窗口 + 不接受焦点
        flags = Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool | Qt.WindowDoesNotAcceptFocus
        self.setWindowFlags(flags)
        
        # 设置窗口属性
        self.setAttribute(Qt.WA_ShowWithoutActivating, True)
        self.setAttribute(Qt.WA_TransparentForMouseEvents, False)
        
        # macOS 关键属性：让 Tool 窗口在应用失去焦点时也不隐藏
        if IS_MAC:
            self.setAttribute(Qt.WA_MacAlwaysShowToolWindow, True)
        
        # 设置透明背景
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        
        # 设置平台特定的窗口属性
        self.setup_platform_window()
        
        # 启动定时器，定期检查窗口
        from PyQt5.QtCore import QTimer
        self.keep_on_top_timer = QTimer(self)
        self.keep_on_top_timer.timeout.connect(self.keep_on_top)
        self.keep_on_top_timer.start(500)  # 每500毫秒检查一次

        # 获取屏幕尺寸
        screen = QApplication.primaryScreen().geometry()

        # 窗口大小
        window_width = 400
        window_height = 600
        self.setFixedSize(window_width, window_height)

        # 屏幕右下角位置
        x = screen.width() - window_width - 20
        y = screen.height() - window_height - 20
        self.move(x, y)

        # 创建 WebView
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self.webview = QWebEngineView()

        # 使用自定义页面
        self.page = TransparentPage(self.webview)
        self.webview.setPage(self.page)

        # 加载 HTML 内容
        resource_path = get_resource_path()
        html_path = os.path.join(resource_path, 'index.html')
        
        print(f"HTML 路径: {html_path}")
        print(f"HTML 存在: {os.path.exists(html_path)}")

        try:
            if os.path.exists(html_path):
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                print(f"HTML 大小: {len(html_content)} 字节")

                # 修改 HTML：透明背景
                html_content = html_content.replace(
                    '</head>',
                    '''<style>
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: transparent !important;
                            width: 100% !important;
                            height: 100% !important;
                            overflow: hidden !important;
                        }
                        #pet-container {
                            position: fixed !important;
                            bottom: 0 !important;
                            right: 0 !important;
                        }
                    </style></head>'''
                )

                self.webview.setHtml(html_content, QUrl.fromLocalFile(html_path))
                print("✅ HTML 加载成功")
            else:
                error_html = f"<h1>错误</h1><p>找不到 HTML 文件</p><p>路径: {html_path}</p>"
                self.webview.setHtml(error_html)
                print(f"❌ HTML 文件不存在: {html_path}")

        except Exception as e:
            print(f"❌ 读取 HTML 失败: {e}")
            self.webview.setHtml(f"<h1>错误</h1><p>{e}</p>")

        layout.addWidget(self.webview)
        self.setLayout(layout)

    def init_tray(self):
        """初始化系统托盘"""
        icon_path = get_icon_path()
        
        # 创建托盘图标
        self.tray_icon = QSystemTrayIcon(self)
        if os.path.exists(icon_path):
            self.tray_icon.setIcon(QIcon(icon_path))
            print(f"✅ 托盘图标已设置: {icon_path}")
        else:
            print(f"⚠️ 图标不存在: {icon_path}")
        
        self.tray_icon.setToolTip("Mochi 桌面宠物")
        
        # 创建右键菜单
        tray_menu = QMenu()
        
        # 显示/隐藏
        show_action = QAction("显示/隐藏", self)
        show_action.triggered.connect(self.toggle_visibility)
        tray_menu.addAction(show_action)
        
        # 鼠标穿透模式
        tray_menu.addSeparator()
        self.click_through_action = QAction("鼠标穿透模式", self)
        self.click_through_action.setCheckable(True)
        self.click_through_action.triggered.connect(self.toggle_click_through)
        tray_menu.addAction(self.click_through_action)
        
        tray_menu.addSeparator()
        
        # 退出
        quit_action = QAction("退出", self)
        quit_action.triggered.connect(self.quit_app)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.on_tray_activated)
        self.tray_icon.show()

    def toggle_visibility(self):
        """切换窗口显示/隐藏"""
        if self.isVisible():
            self.hide()
        else:
            self.show()
            self.raise_()

    def on_tray_activated(self, reason):
        """托盘图标被点击"""
        if reason == QSystemTrayIcon.DoubleClick:
            self.toggle_visibility()

    def toggle_click_through(self):
        """切换鼠标穿透模式"""
        self.click_through_mode = not self.click_through_mode
        if self.click_through_mode:
            self.setAttribute(Qt.WA_TransparentForMouseEvents, True)
            self.click_through_action.setChecked(True)
            print("✅ 鼠标穿透模式已开启")
        else:
            self.setAttribute(Qt.WA_TransparentForMouseEvents, False)
            self.click_through_action.setChecked(False)
            print("✅ 鼠标穿透模式已关闭")

    def quit_app(self):
        """退出应用"""
        self.tray_icon.hide()
        QApplication.quit()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.dragging = True
            self.drag_pos = event.globalPos() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if self.dragging:
            self.move(event.globalPos() - self.drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        self.dragging = False

    def setup_platform_window(self):
        """设置平台特定的窗口属性"""
        if IS_MAC:
            self._setup_macos_window()
        elif IS_WINDOWS:
            self._setup_windows_window()

    def _setup_macos_window(self):
        """设置 macOS 原生窗口属性"""
        try:
            from PyQt5.QtCore import QTimer
            QTimer.singleShot(500, self._do_setup_macos_window)
        except Exception as e:
            print(f"⚠️ macOS 设置失败: {e}")
    
    def _do_setup_macos_window(self):
        """实际设置 macOS 窗口属性"""
        try:
            from AppKit import NSApplication
            from AppKit import (
                NSWindowCollectionBehaviorCanJoinAllSpaces,
                NSWindowCollectionBehaviorStationary,
                NSWindowCollectionBehaviorIgnoresCycle
            )
            from Quartz import CGWindowLevelForKey, kCGDesktopWindowLevelKey
            
            desktop_level = CGWindowLevelForKey(kCGDesktopWindowLevelKey)
            ns_app = NSApplication.sharedApplication()
            
            for window in ns_app.windows():
                if window.title() == '':
                    window.setLevel_(desktop_level)
                    behavior = (
                        NSWindowCollectionBehaviorCanJoinAllSpaces | 
                        NSWindowCollectionBehaviorStationary | 
                        NSWindowCollectionBehaviorIgnoresCycle
                    )
                    window.setCollectionBehavior_(behavior)
                    window.setHidesOnDeactivate_(False)
                    print("✅ macOS 窗口设置完成")
                    break
        except ImportError:
            print("⚠️ AppKit/Quartz 未安装")
        except Exception as e:
            print(f"⚠️ macOS 窗口设置失败: {e}")

    def _setup_windows_window(self):
        """设置 Windows 窗口属性"""
        try:
            from PyQt5.QtCore import QTimer
            QTimer.singleShot(500, self._do_setup_windows_window)
        except Exception as e:
            print(f"⚠️ Windows 设置失败: {e}")
    
    def _do_setup_windows_window(self):
        """实际设置 Windows 窗口属性"""
        try:
            import ctypes
            from ctypes import wintypes
            
            # 获取窗口句柄
            hwnd = self.winId()
            
            # 设置窗口为工具窗口（不在任务栏显示）
            GWL_EXSTYLE = -20
            WS_EX_TOOLWINDOW = 0x00000080
            WS_EX_NOACTIVATE = 0x08000000
            
            ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, 
                WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE)
            
            # 设置窗口置顶
            HWND_TOPMOST = -1
            SWP_NOSIZE = 0x0001
            SWP_NOMOVE = 0x0002
            SWP_NOACTIVATE = 0x0010
            
            ctypes.windll.user32.SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0,
                SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE)
            
            print("✅ Windows 窗口设置完成")
        except Exception as e:
            print(f"⚠️ Windows 窗口设置失败: {e}")

    def keep_on_top(self):
        """保持窗口在最前面"""
        if not self.isVisible():
            self.show()
            self.raise_()


def main():
    app = QApplication(sys.argv)
    app.setAttribute(Qt.AA_UseHighDpiPixmaps)
    app.setQuitOnLastWindowClosed(False)

    # 设置应用图标
    icon_path = get_icon_path()
    if os.path.exists(icon_path):
        app.setWindowIcon(QIcon(icon_path))
        print(f"✅ 应用图标已设置: {icon_path}")

    pet = MochiPet()
    pet.show()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
