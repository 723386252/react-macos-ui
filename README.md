# React macOS UI

一个模仿 macOS 界面风格的 React 组件库。

## 特性

- 🎨 macOS 风格的 UI 组件
- 🚀 基于 React 和 TypeScript 开发
- 📦 支持按需引入
- 🎯 完整的类型定义
- 💪 使用 styled-components 实现样式

## 安装

```bash
npm install react-macos-ui
```
## 组件

### Window 窗口

macOS 风格的窗口组件,支持:
- 拖拽移动
- 调整大小
- 最大化/最小化
- 关闭按钮
- 毛玻璃标题栏

### Dock 程序坞

macOS 风格的 Dock 栏,支持:
- 底部/左侧/右侧停靠
- 自动隐藏
- 图标缩放动画
- 工具提示

### AppDisplay 应用图标

用于显示应用图标,支持:
- 自定义图标
- 点击事件
- 悬停缩放
- 活动状态

## 主题

支持亮色和暗色两种主题模式:
```tsx
// 设置暗色主题
<div data-theme="dark">
<App />
</div>
```

## 许可证

MIT © [Will Jay]
