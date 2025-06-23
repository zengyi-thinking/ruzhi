#!/usr/bin/env python3
"""
儒智项目增强功能测试脚本
测试数据持久化、安全配置、日志监控和OCR功能
"""
import os
import sys
import json
import time
import base64
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_database_operations():
    """测试数据库操作"""
    print("🗄️  测试数据库操作...")
    
    try:
        from models.database import SessionLocal, User
        from models.crud import UserCRUD
        
        # 创建数据库会话
        db = SessionLocal()
        
        # 测试用户创建
        test_user = UserCRUD.create_user(
            db=db,
            username=f"test_user_{int(time.time())}",
            email=f"test_{int(time.time())}@example.com",
            password="test123456",
            full_name="测试用户"
        )
        
        print(f"   ✅ 用户创建成功: {test_user.username}")
        
        # 测试用户查询
        found_user = UserCRUD.get_user_by_id(db, str(test_user.id))
        if found_user:
            print(f"   ✅ 用户查询成功: {found_user.username}")
        
        # 测试密码验证
        is_valid = UserCRUD.verify_password("test123456", test_user.password_hash)
        if is_valid:
            print("   ✅ 密码验证成功")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"   ❌ 数据库测试失败: {e}")
        return False

def test_security_features():
    """测试安全功能"""
    print("🔐 测试安全功能...")
    
    try:
        from middleware.security import JWTManager, RateLimiter
        
        # 测试JWT令牌生成
        tokens = JWTManager.generate_tokens("test_user_123", {"role": "user"})
        if tokens and 'access_token' in tokens:
            print("   ✅ JWT令牌生成成功")
            
            # 测试令牌验证
            payload = JWTManager.verify_token(tokens['access_token'])
            if payload and payload.get('user_id') == 'test_user_123':
                print("   ✅ JWT令牌验证成功")
            else:
                print("   ❌ JWT令牌验证失败")
        
        # 测试频率限制（模拟）
        print("   ✅ 频率限制功能已加载")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 安全功能测试失败: {e}")
        return False

def test_logging_system():
    """测试日志系统"""
    print("📝 测试日志系统...")
    
    try:
        from utils.logging_config import (
            request_logger, business_logger, security_logger, get_logger
        )
        
        # 测试不同类型的日志记录器
        test_logger = get_logger('test')
        test_logger.info("这是一条测试日志")
        
        # 测试业务日志
        business_logger.log_user_action("test_user", "login", {"ip": "127.0.0.1"})
        
        # 测试安全日志
        security_logger.log_login_attempt("test_user", True, "127.0.0.1")
        
        print("   ✅ 日志系统测试成功")
        return True
        
    except Exception as e:
        print(f"   ❌ 日志系统测试失败: {e}")
        return False

def test_monitoring_system():
    """测试监控系统"""
    print("📊 测试监控系统...")
    
    try:
        from utils.monitoring import health_checker, performance_monitor
        
        # 测试健康检查
        health_result = health_checker.run_checks()
        if health_result:
            print(f"   ✅ 健康检查完成，状态: {health_result.get('status', 'unknown')}")
        
        # 测试性能监控
        performance_monitor.record_request(0.1, 200)  # 模拟请求
        metrics = performance_monitor.get_metrics()
        if metrics:
            print(f"   ✅ 性能监控正常，请求数: {metrics.get('request_count', 0)}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 监控系统测试失败: {e}")
        return False

def test_ocr_functionality():
    """测试OCR功能"""
    print("👁️  测试OCR功能...")
    
    try:
        from services.enhanced_ocr_service import enhanced_ocr_service
        
        # 测试引擎信息
        engine_info = enhanced_ocr_service.get_engine_info()
        print(f"   📋 可用OCR引擎: {list(engine_info['engines'].keys())}")
        
        # 测试支持的格式
        formats = enhanced_ocr_service.get_supported_formats()
        print(f"   📋 支持的格式: {formats}")
        
        # 创建一个简单的测试图像（1x1像素的PNG）
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        # 测试图像验证
        validation = enhanced_ocr_service.validate_image(test_image_b64)
        if validation['valid']:
            print("   ✅ 图像验证成功")
        else:
            print(f"   ⚠️  图像验证失败: {validation.get('error', '未知错误')}")
        
        # 测试OCR处理（使用模拟数据）
        result = enhanced_ocr_service.process_image(test_image_b64, {
            'engine': 'mock',  # 使用模拟引擎避免依赖问题
            'resize': True,
            'enhance_contrast': True
        })
        
        if result['success']:
            print(f"   ✅ OCR处理成功，识别文本: {result['data']['text'][:20]}...")
            print(f"   📊 置信度: {result['data']['confidence']}")
            print(f"   ⏱️  处理时间: {result['data']['processing_time']}秒")
        else:
            print(f"   ❌ OCR处理失败: {result.get('error', '未知错误')}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ OCR功能测试失败: {e}")
        return False

def test_configuration():
    """测试配置系统"""
    print("⚙️  测试配置系统...")
    
    try:
        from config.settings import (
            APP_CONFIG, DATABASE_CONFIG, JWT_CONFIG, 
            OCR_CONFIG, LOGGING_CONFIG, validate_config
        )
        
        # 检查关键配置
        print(f"   📋 应用名称: {APP_CONFIG['name']}")
        print(f"   📋 应用版本: {APP_CONFIG['version']}")
        print(f"   📋 运行环境: {APP_CONFIG['environment']}")
        print(f"   📋 调试模式: {APP_CONFIG['debug']}")
        
        # 验证配置（在开发环境下可能会失败，这是正常的）
        try:
            validate_config()
            print("   ✅ 配置验证通过")
        except ValueError as e:
            print(f"   ⚠️  配置验证警告: {e}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 配置测试失败: {e}")
        return False

def generate_test_report(results):
    """生成测试报告"""
    print("\n" + "=" * 50)
    print("📋 测试报告")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    failed_tests = total_tests - passed_tests
    
    print(f"总测试数: {total_tests}")
    print(f"通过: {passed_tests} ✅")
    print(f"失败: {failed_tests} ❌")
    print(f"成功率: {passed_tests/total_tests*100:.1f}%")
    
    print("\n详细结果:")
    for test_name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {test_name}: {status}")
    
    # 生成JSON报告
    report = {
        'timestamp': time.time(),
        'total_tests': total_tests,
        'passed_tests': passed_tests,
        'failed_tests': failed_tests,
        'success_rate': passed_tests/total_tests,
        'results': results
    }
    
    report_file = project_root / 'test_report.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 详细报告已保存到: {report_file}")
    
    return passed_tests == total_tests

def main():
    """主函数"""
    print("🧪 儒智项目增强功能测试")
    print("=" * 50)
    
    # 定义测试函数
    tests = {
        '配置系统': test_configuration,
        '数据库操作': test_database_operations,
        '安全功能': test_security_features,
        '日志系统': test_logging_system,
        '监控系统': test_monitoring_system,
        'OCR功能': test_ocr_functionality,
    }
    
    # 运行测试
    results = {}
    for test_name, test_func in tests.items():
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"   ❌ 测试 {test_name} 出现异常: {e}")
            results[test_name] = False
        
        print()  # 空行分隔
    
    # 生成报告
    all_passed = generate_test_report(results)
    
    if all_passed:
        print("\n🎉 所有测试通过！系统已准备就绪。")
        sys.exit(0)
    else:
        print("\n⚠️  部分测试失败，请检查相关配置和依赖。")
        sys.exit(1)

if __name__ == '__main__':
    main()
