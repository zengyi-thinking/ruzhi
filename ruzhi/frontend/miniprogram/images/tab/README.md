# TabBar图标说明

这个目录包含小程序底部导航栏的图标文件。

## 图标规格
- 尺寸：40px × 40px (推荐)
- 格式：PNG
- 颜色：灰色（未选中）和蓝色（选中）

## 图标列表
- home.png / home-active.png - 首页图标
- ocr.png / ocr-active.png - OCR识别图标  
- chat.png / chat-active.png - 人物对话图标
- book.png / book-active.png - 经典库图标
- profile.png / profile-active.png - 个人中心图标

## 注意事项
由于这是代码生成环境，无法直接创建图片文件。
在实际开发中，请准备相应的图标文件放置在此目录下。

## 临时解决方案
可以暂时使用Vant组件库的图标，修改app.json中的tabBar配置：

```json
"tabBar": {
  "custom": true,
  "color": "#666666",
  "selectedColor": "#1890ff",
  "backgroundColor": "#ffffff",
  "list": [...]
}
```

然后创建自定义tabBar组件来使用图标字体。
