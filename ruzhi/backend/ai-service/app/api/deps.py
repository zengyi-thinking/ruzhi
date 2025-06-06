"""
儒智AI服务 - API依赖
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
import jwt
from jwt.exceptions import PyJWTError

from app.config.settings import settings

# 为了简化示例，我们这里只做简单的JWT验证
# 实际项目中可能需要调用用户服务进行更复杂的验证

async def get_current_user_id(
    authorization: Optional[str] = Header(None, description="JWT Token")
) -> str:
    """
    从JWT获取当前用户ID
    
    简化版实现，实际项目中应调用用户服务进行验证
    """
    # 如果处于开发环境且没有提供授权头，则返回测试用户ID
    if settings.DEBUG and not authorization:
        return "test-user-id"
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要认证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # 分割Bearer和token
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证方式",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 解码token
        # 注意：实际项目中应该使用环境变量或配置文件中的密钥
        payload = jwt.decode(token, "your_jwt_secret_key_here", algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_id
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息",
            headers={"WWW-Authenticate": "Bearer"},
        ) 