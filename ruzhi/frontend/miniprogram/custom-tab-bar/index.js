// 自定义tabBar组件
Component({
  data: {
    selected: 0,
    color: "#666666",
    selectedColor: "#1890ff",
    list: [
      {
        pagePath: "/pages/home/home",
        text: "首页",
        icon: "🏠",
        selectedIcon: "🏠"
      },
      {
        pagePath: "/pages/ocr/ocr",
        text: "古籍识别",
        icon: "📷",
        selectedIcon: "📷"
      },
      {
        pagePath: "/pages/chat/chat",
        text: "人物对话",
        icon: "💬",
        selectedIcon: "💬"
      },
      {
        pagePath: "/pages/classics/classics",
        text: "经典库",
        icon: "📚",
        selectedIcon: "📚"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        icon: "👤",
        selectedIcon: "👤"
      }
    ]
  },
  
  attached() {
    // 获取当前页面路径，设置选中状态
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route
    
    const selected = this.data.list.findIndex(item => item.pagePath === currentPath)
    this.setData({
      selected: selected >= 0 ? selected : 0
    })
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      
      wx.switchTab({
        url,
        success: () => {
          this.setData({
            selected: data.index
          })
        }
      })
    }
  }
})
