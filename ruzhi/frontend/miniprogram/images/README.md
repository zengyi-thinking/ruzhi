# 图片资源说明

这个目录包含小程序使用的图片资源。

## 目录结构
```
images/
├── tab/                    # tabBar图标
│   ├── home.png           # 首页图标
│   ├── home-active.png    # 首页选中图标
│   ├── ocr.png            # OCR图标
│   ├── ocr-active.png     # OCR选中图标
│   ├── chat.png           # 对话图标
│   ├── chat-active.png    # 对话选中图标
│   ├── book.png           # 经典库图标
│   ├── book-active.png    # 经典库选中图标
│   ├── profile.png        # 个人中心图标
│   └── profile-active.png # 个人中心选中图标
├── features/              # 功能模块图标
│   ├── ocr.png           # OCR功能图标
│   ├── chat.png          # 对话功能图标
│   ├── book.png          # 经典库功能图标
│   └── knowledge.png     # 知识图谱功能图标
├── classics/             # 经典文献封面
│   ├── lunyu.jpg         # 论语封面
│   └── mengzi.jpg        # 孟子封面
├── share/                # 分享图片
│   └── home.png          # 首页分享图
└── default-avatar.png    # 默认头像
```

## 图片规格要求

### tabBar图标
- 尺寸：40px × 40px
- 格式：PNG
- 背景：透明

### 功能图标
- 尺寸：60px × 60px
- 格式：PNG
- 背景：透明

### 封面图片
- 尺寸：300px × 200px
- 格式：JPG
- 质量：80%

### 头像图片
- 尺寸：120px × 120px
- 格式：PNG
- 背景：透明或白色

## 注意事项

1. 由于这是代码生成环境，无法直接创建图片文件
2. 在实际开发中，请准备相应的图片文件放置在对应目录
3. 建议使用矢量图标，确保在不同分辨率下显示清晰
4. 图片文件大小应控制在合理范围内，避免影响小程序性能

## 临时解决方案

在开发阶段，可以：
1. 使用在线图标库（如iconfont）
2. 使用Vant组件库的图标
3. 使用占位图片服务
4. 创建简单的纯色图片作为占位符
