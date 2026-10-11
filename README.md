# 星尘山谷

像素风 2.5D 魔法肉鸽游戏。WASD 移动，鼠标瞄准施法，每层通关后三选一强化；击败首领后进入无尽回廊。

## 怎么玩

- **浏览器**：直接用浏览器打开 `starfall-crypt.html`（字体需要联网加载）。
- **Windows**：到 Releases 页面下载 `星尘山谷.exe`，双击即可，无需安装。

| 按键 | 作用 |
|---|---|
| WASD | 移动 |
| 鼠标左键 | 施法 |
| 右键 / E | 奥术新星 |
| 空格 / Shift | 冲刺 |
| Q | 大魔法（无尽回廊） |
| Esc | 暂停，查看已获得的强化 |
| M | 静音 |
| F11 | 全屏 |

## 目录

- `game/`：游戏源码。`p1.html` 是页面和样式，`p2.js`–`p14.js` 按顺序拼接成一个脚本。
- `desktop/`：Electron 打包工程。`build.js` 拼接源码并嵌入离线字体，`subset-fonts.py` 用 fontTools 裁剪字体。
- `bgm/music-room.html`：BGM 试听页。
- `starfall-crypt.html`：`build.js` 生成的浏览器版。

## 打包 exe

需要 Node.js 和 Python（`pip install fonttools brotli`）。

```bash
cd desktop
npm install
npm run dist
```

产物在 `release/星尘山谷.exe`。

## 字体

Press Start 2P、ZCOOL QingKe HuangYou、Noto Sans SC，均为 SIL Open Font License。
