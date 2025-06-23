#!/usr/bin/env python3
"""
儒智项目结构修正脚本
自动化执行项目文件重新组织
"""
import os
import shutil
import json
from pathlib import Path

class ProjectStructureFixer:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "backup_before_restructure"
        
    def create_backup(self):
        """创建备份"""
        print("🔄 创建备份...")
        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)
        self.backup_dir.mkdir()
        
        # 备份重要的重复目录
        backup_items = [
            "web",
            "miniprogram", 
            "frontend/src"
        ]
        
        for item in backup_items:
            src = self.project_root / item
            if src.exists():
                dst = self.backup_dir / item
                dst.parent.mkdir(parents=True, exist_ok=True)
                if src.is_dir():
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
                print(f"  ✅ 备份: {item}")
    
    def create_directory_structure(self):
        """创建标准目录结构"""
        print("📁 创建标准目录结构...")
        
        directories = [
            "docs/guides",
            "docs/reports", 
            "docs/deployment",
            "docs/planning",
            "scripts",
            "tests/manual",
            "tests/integration",
            "tests/e2e"
        ]
        
        for dir_path in directories:
            full_path = self.project_root / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ 创建目录: {dir_path}")
    
    def move_documentation(self):
        """移动文档文件"""
        print("📚 重新组织文档文件...")
        
        # 文档文件映射
        doc_mappings = {
            # 指南文档
            "AI_DIALOGUE_FEATURE_GUIDE.md": "docs/guides/",
            "AI_INTEGRATION_GUIDE.md": "docs/guides/",
            "LEARNING_CENTER_GUIDE.md": "docs/guides/",
            "OCR_FEATURE_GUIDE.md": "docs/guides/",
            "QUICK_START_GUIDE.md": "docs/guides/",
            
            # 报告文档
            "AI_INTELLIGENCE_COMPLETION_REPORT.md": "docs/reports/",
            "PHASE_1_COMPLETION_REPORT.md": "docs/reports/",
            "PHASE_2_COMPLETION_REPORT.md": "docs/reports/",
            "PHASE_3_COMPLETION_REPORT.md": "docs/reports/",
            "PROJECT_COMPLETION_SUMMARY.md": "docs/reports/",
            "PROJECT_PROGRESS_REPORT.md": "docs/reports/",
            
            # 部署文档
            "CROSS_PLATFORM_DEPLOYMENT.md": "docs/deployment/",
            "START_NETWORK_SETUP.md": "docs/deployment/",
            
            # 规划文档
            "PHASE_3_IMPLEMENTATION_PLAN.md": "docs/planning/"
        }
        
        for filename, target_dir in doc_mappings.items():
            src = self.project_root / filename
            if src.exists():
                dst = self.project_root / target_dir / filename
                shutil.move(str(src), str(dst))
                print(f"  ✅ 移动: {filename} -> {target_dir}")
    
    def move_scripts(self):
        """移动脚本文件"""
        print("🔧 移动脚本文件...")
        
        script_files = [
            "install_dependencies.bat",
            "start_all_services.bat", 
            "start_browser_test.bat",
            "start_direct_test.bat"
        ]
        
        for script in script_files:
            src = self.project_root / script
            if src.exists():
                dst = self.project_root / "scripts" / script
                shutil.move(str(src), str(dst))
                print(f"  ✅ 移动: {script}")
    
    def move_test_files(self):
        """移动测试文件"""
        print("🧪 移动测试文件...")
        
        test_files = [
            "chat_standalone.html",
            "test_chat.html"
        ]
        
        for test_file in test_files:
            src = self.project_root / test_file
            if src.exists():
                dst = self.project_root / "tests/manual" / test_file
                shutil.move(str(src), str(dst))
                print(f"  ✅ 移动: {test_file}")
    
    def analyze_duplicate_projects(self):
        """分析重复项目"""
        print("🔍 分析重复项目...")
        
        # 检查web项目
        web_root = self.project_root / "web"
        web_frontend = self.project_root / "frontend/web"
        
        if web_root.exists() and web_frontend.exists():
            print("  ⚠️  发现重复的web项目:")
            print(f"    - {web_root} (Vite + React)")
            print(f"    - {web_frontend} (配置混乱)")
            
            # 检查哪个更完整
            web_root_package = web_root / "package.json"
            web_frontend_package = web_frontend / "package.json"
            
            if web_root_package.exists():
                with open(web_root_package) as f:
                    web_root_config = json.load(f)
                print(f"    - 根目录web项目版本: {web_root_config.get('version', 'unknown')}")
            
            if web_frontend_package.exists():
                with open(web_frontend_package) as f:
                    web_frontend_config = json.load(f)
                print(f"    - frontend/web项目版本: {web_frontend_config.get('version', 'unknown')}")
        
        # 检查小程序项目
        miniprogram_root = self.project_root / "miniprogram"
        miniprogram_frontend = self.project_root / "frontend/miniprogram"
        
        if miniprogram_root.exists() and miniprogram_frontend.exists():
            print("  ⚠️  发现重复的小程序项目:")
            print(f"    - {miniprogram_root} (错误位置)")
            print(f"    - {miniprogram_frontend} (正确位置)")
    
    def fix_web_project_confusion(self):
        """修复web项目配置混乱"""
        print("🔧 修复web项目配置...")
        
        web_frontend = self.project_root / "frontend/web"
        
        # 检查package.json和next.config.js的不匹配
        package_json = web_frontend / "package.json"
        next_config = web_frontend / "next.config.js"
        
        if package_json.exists() and next_config.exists():
            with open(package_json) as f:
                package_data = json.load(f)
            
            # 如果package.json显示是React项目但有Next.js配置
            if "react-scripts" in package_data.get("dependencies", {}) and next_config.exists():
                print("  ⚠️  发现配置不匹配: package.json是React项目但有Next.js配置")
                
                # 创建正确的Next.js package.json
                next_package = {
                    "name": "ruzhi-web",
                    "version": "1.0.0",
                    "private": True,
                    "scripts": {
                        "dev": "next dev",
                        "build": "next build",
                        "start": "next start",
                        "lint": "next lint",
                        "test": "jest",
                        "test:coverage": "jest --coverage",
                        "test:e2e": "cypress run",
                        "test:e2e:headless": "cypress run --headless",
                        "format:check": "prettier --check .",
                        "format": "prettier --write ."
                    },
                    "dependencies": {
                        "next": "^14.0.0",
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0",
                        "@mui/material": "^5.14.9",
                        "@mui/icons-material": "^5.14.9",
                        "@emotion/react": "^11.11.1",
                        "@emotion/styled": "^11.11.0",
                        "axios": "^1.5.0",
                        "recharts": "^2.8.0"
                    },
                    "devDependencies": {
                        "@types/node": "^20.0.0",
                        "@types/react": "^18.2.0",
                        "@types/react-dom": "^18.2.0",
                        "typescript": "^5.0.0",
                        "eslint": "^8.0.0",
                        "eslint-config-next": "^14.0.0",
                        "prettier": "^3.0.0",
                        "jest": "^29.0.0",
                        "cypress": "^13.0.0"
                    }
                }
                
                # 备份原文件
                shutil.copy2(package_json, package_json.with_suffix('.json.backup'))
                
                # 写入新的package.json
                with open(package_json, 'w', encoding='utf-8') as f:
                    json.dump(next_package, f, indent=2, ensure_ascii=False)
                
                print("  ✅ 修复package.json配置")
    
    def remove_duplicate_projects(self):
        """删除重复项目"""
        print("🗑️  删除重复项目...")
        
        # 删除根目录的web项目（保留frontend/web）
        web_root = self.project_root / "web"
        if web_root.exists():
            shutil.rmtree(web_root)
            print("  ✅ 删除重复的根目录web项目")
        
        # 删除根目录的小程序项目（保留frontend/miniprogram）
        miniprogram_root = self.project_root / "miniprogram"
        if miniprogram_root.exists():
            shutil.rmtree(miniprogram_root)
            print("  ✅ 删除重复的根目录小程序项目")
        
        # 删除零散的frontend/src
        frontend_src = self.project_root / "frontend/src"
        if frontend_src.exists():
            shutil.rmtree(frontend_src)
            print("  ✅ 删除零散的frontend/src目录")
    
    def update_readme(self):
        """更新README文件"""
        print("📝 更新README文件...")
        
        readme_content = """# 儒智(RuZhi) - 传统文化智能学习平台

## 📁 项目结构

```
ruzhi/
├── README.md                    # 项目主文档
├── docs/                        # 文档目录
│   ├── guides/                  # 使用指南
│   ├── reports/                 # 项目报告
│   ├── deployment/              # 部署文档
│   └── planning/                # 规划文档
├── scripts/                     # 脚本文件
├── tests/                       # 测试文件
│   ├── integration/             # 集成测试
│   ├── e2e/                     # 端到端测试
│   └── manual/                  # 手动测试
├── frontend/                    # 前端项目
│   ├── web/                     # Web应用 (Next.js)
│   ├── miniprogram/             # 微信小程序
│   ├── android/                 # Android应用
│   └── ios/                     # iOS应用
├── backend/                     # 后端服务
├── data/                        # 数据文件
├── models/                      # AI模型
├── monitoring/                  # 监控配置
├── deployment/                  # 部署配置
└── tools/                       # 工具脚本
```

## 🚀 快速开始

### 前端开发
```bash
cd frontend/web
npm install
npm run dev
```

### 后端开发
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 小程序开发
```bash
cd frontend/miniprogram
# 使用微信开发者工具打开此目录
```

## 📚 文档

- [快速开始指南](docs/guides/QUICK_START_GUIDE.md)
- [AI对话功能指南](docs/guides/AI_DIALOGUE_FEATURE_GUIDE.md)
- [部署指南](docs/deployment/CROSS_PLATFORM_DEPLOYMENT.md)
- [项目完成报告](docs/reports/PROJECT_COMPLETION_SUMMARY.md)

## 🛠️ 开发工具

- [安装依赖](scripts/install_dependencies.bat)
- [启动所有服务](scripts/start_all_services.bat)
- [浏览器测试](scripts/start_browser_test.bat)

## 📊 项目状态

项目已完成第三阶段开发，具备完整的商业化能力。详见[第三阶段完成报告](docs/reports/PHASE_3_COMPLETION_REPORT.md)。
"""
        
        readme_path = self.project_root / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print("  ✅ 更新README.md")
    
    def run_fix(self):
        """执行完整的修复流程"""
        print("🚀 开始修复项目结构...")
        print("=" * 50)
        
        try:
            self.create_backup()
            self.analyze_duplicate_projects()
            self.create_directory_structure()
            self.move_documentation()
            self.move_scripts()
            self.move_test_files()
            self.fix_web_project_confusion()
            self.remove_duplicate_projects()
            self.update_readme()
            
            print("=" * 50)
            print("✅ 项目结构修复完成!")
            print(f"📁 备份位置: {self.backup_dir}")
            print("🔍 请检查修复结果并测试项目功能")
            
        except Exception as e:
            print(f"❌ 修复过程中出现错误: {e}")
            print("💡 请检查备份并手动修复")

if __name__ == "__main__":
    # 获取项目根目录
    current_dir = Path(__file__).parent.parent
    
    fixer = ProjectStructureFixer(current_dir)
    fixer.run_fix()
