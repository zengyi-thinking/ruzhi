// TabBar图标生成工具
// 由于无法直接创建PNG文件，这里提供SVG代码，可以手动转换为PNG

const iconSVGs = {
  // 首页图标 - 正常状态
  'home': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <path d="M40.5 15L15 35v30h15V50h21v15h15V35L40.5 15z" 
            stroke="#7f8c8d" stroke-width="2" fill="none" stroke-linejoin="round"/>
    </svg>
  `,
  
  // 首页图标 - 选中状态
  'home-active': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <path d="M40.5 15L15 35v30h15V50h21v15h15V35L40.5 15z" 
            fill="#667eea" stroke="#667eea" stroke-width="1"/>
    </svg>
  `,
  
  // OCR图标 - 正常状态
  'ocr': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="41" height="31" rx="4" 
            stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <circle cx="40.5" cy="40.5" r="8" 
              stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <path d="M25 20v-3a2 2 0 012-2h25a2 2 0 012 2v3M35 60v6M46 60v6" 
            stroke="#7f8c8d" stroke-width="2"/>
    </svg>
  `,
  
  // OCR图标 - 选中状态
  'ocr-active': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="41" height="31" rx="4" fill="#667eea"/>
      <circle cx="40.5" cy="40.5" r="8" fill="white"/>
      <path d="M25 20v-3a2 2 0 012-2h25a2 2 0 012 2v3M35 60v6M46 60v6" 
            stroke="#667eea" stroke-width="2" fill="#667eea"/>
    </svg>
  `,
  
  // 对话图标 - 正常状态
  'chat': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 25a5 5 0 015-5h31a5 5 0 015 5v20a5 5 0 01-5 5H35l-10 8v-8h-5a5 5 0 01-5-5V25z" 
            stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <circle cx="32" cy="35" r="2" fill="#7f8c8d"/>
      <circle cx="40.5" cy="35" r="2" fill="#7f8c8d"/>
      <circle cx="49" cy="35" r="2" fill="#7f8c8d"/>
    </svg>
  `,
  
  // 对话图标 - 选中状态
  'chat-active': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 25a5 5 0 015-5h31a5 5 0 015 5v20a5 5 0 01-5 5H35l-10 8v-8h-5a5 5 0 01-5-5V25z" 
            fill="#667eea"/>
      <circle cx="32" cy="35" r="2" fill="white"/>
      <circle cx="40.5" cy="35" r="2" fill="white"/>
      <circle cx="49" cy="35" r="2" fill="white"/>
    </svg>
  `,
  
  // 知识图谱图标 - 正常状态
  'knowledge': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="6" stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <circle cx="56" cy="25" r="6" stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <circle cx="40.5" cy="50" r="6" stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <circle cx="25" cy="56" r="6" stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <line x1="31" y1="25" x2="50" y2="25" stroke="#7f8c8d" stroke-width="2"/>
      <line x1="50" y1="31" x2="46" y2="44" stroke="#7f8c8d" stroke-width="2"/>
      <line x1="34.5" y1="50" x2="31" y2="56" stroke="#7f8c8d" stroke-width="2"/>
      <line x1="31" y1="31" x2="34.5" y2="44" stroke="#7f8c8d" stroke-width="2"/>
    </svg>
  `,
  
  // 知识图谱图标 - 选中状态
  'knowledge-active': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="6" fill="#667eea"/>
      <circle cx="56" cy="25" r="6" fill="#667eea"/>
      <circle cx="40.5" cy="50" r="6" fill="#667eea"/>
      <circle cx="25" cy="56" r="6" fill="#667eea"/>
      <line x1="31" y1="25" x2="50" y2="25" stroke="#667eea" stroke-width="3"/>
      <line x1="50" y1="31" x2="46" y2="44" stroke="#667eea" stroke-width="3"/>
      <line x1="34.5" y1="50" x2="31" y2="56" stroke="#667eea" stroke-width="3"/>
      <line x1="31" y1="31" x2="34.5" y2="44" stroke="#667eea" stroke-width="3"/>
    </svg>
  `,
  
  // 个人中心图标 - 正常状态
  'profile': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40.5" cy="30" r="12" stroke="#7f8c8d" stroke-width="2" fill="none"/>
      <path d="M20 65a20.5 20.5 0 0141 0" stroke="#7f8c8d" stroke-width="2" fill="none"/>
    </svg>
  `,
  
  // 个人中心图标 - 选中状态
  'profile-active': `
    <svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40.5" cy="30" r="12" fill="#667eea"/>
      <path d="M20 65a20.5 20.5 0 0141 0" fill="#667eea"/>
    </svg>
  `
}

// 使用说明：
// 1. 将上述SVG代码复制到在线SVG转PNG工具（如 https://convertio.co/svg-png/）
// 2. 设置输出尺寸为 81x81px
// 3. 下载PNG文件并重命名为对应的文件名
// 4. 将文件放置到 images/tab/ 目录下

console.log('TabBar图标SVG代码已生成，请手动转换为PNG文件')

module.exports = iconSVGs
