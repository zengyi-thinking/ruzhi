# 儒智小程序图标资源

本目录包含儒智小程序所使用的功能图标资源。

## 图标列表

- `ocr.png` - 古籍识别功能图标
- `chat.png` - 人物对话功能图标
- `classics.png` - 经典库功能图标
- `knowledge.png` - 知识图谱功能图标
- `target.png` - AI 挑战功能图标
- `robot.png` - AI 推荐功能图标
- `star.png` - 创新功能图标
- `music.png` - 沉浸式阅读功能图标

## 注意事项

- 所有图标采用统一的 60x60 像素尺寸
- 图标需保持传统文化风格与现代 UI 设计的平衡
- 避免在代码中直接使用 emoji 字符，而是使用图像资源
- 图标应当支持夜间模式适配

## 图标规范

图标设计遵循以下规范：

1. 主色调：使用水墨风格的黑色、灰色系
2. 辅助色：适当使用传统文化元素的金色、红色等点缀
3. 线条风格：保持简洁清晰，适合小尺寸显示
4. 背景：透明背景，方便在不同 UI 场景下使用

## 使用方式

在 WXML 中引用图标：

```xml
<image src="/images/features/ocr.png" mode="aspectFit"></image>
```

在 JS 中引用图标路径：

```javascript
{
  id: 'ocr',
  icon: '/images/features/ocr.png',
  title: '古籍识别'
}
```
