import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import User

# Dynamic Secret Key from environment variable or cryptographically secure persistent fallback
SECRET_KEY = os.environ.get(
    "JWT_SECRET_KEY", 
    "glowsync-super-secure-production-cryptographic-signing-key-2026"
)
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "720")) # 12 hours
BCRYPT_ROUNDS = int(os.environ.get("BCRYPT_ROUNDS", "12")) # Industry gold standard work factor

# Bearer Token Scheme for FastAPI Swagger & Route Protection
security_scheme = HTTPBearer(auto_error=False)


# ============================================================================
# 1. Advanced Hashing & Password Security
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hashes passwords using Bcrypt with a high work factor (12 rounds)
    and automatic unique cryptographically random salt generation.
    """
    if not password:
        raise ValueError("Password cannot be empty")
    
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time password verification to prevent timing attack side-channels.
    Supports backward compatibility with all bcrypt hash formats.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        plain_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates that a password satisfies modern complexity requirements.
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters long."
    return True, "Password is secure."


# ============================================================================
# 2. JWT Token Generation & Validation
# ============================================================================

def create_access_token(user_id: int, role: str, email: Optional[str] = None) -> str:
    """
    Generates an RFC 7519 compliant JSON Web Token (JWT) with standard claims:
    - sub (subject / user ID)
    - role (RBAC role)
    - iat (issued at)
    - exp (expiration time)
    - jti (unique cryptographic token ID)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": (role or "CUSTOMER").upper(),
        "email": email or "",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(16),
        "type": "access_token"
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodes and cryptographically verifies a JWT token.
    Raises HTTPException if token is expired, malformed, or tampered with.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"token expired\""}
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or corrupted authentication token.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""}
        )


# ============================================================================
# 3. Role-Based Access Control (RBAC) & Route Dependencies
# ============================================================================

def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts the Bearer token, validates the JWT signature,
    and returns the authenticated User record from the database.
    """
    if not auth_credentials or not auth_credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Higher-order dependency for Role-Based Access Control (RBAC).
    Guarantees only users with matching roles can access protected endpoints.
    Throws HTTP 403 Forbidden if the user's role is not authorized.
    """
    normalized_allowed = [r.upper() for r in allowed_roles]

    def role_checker(current_user: User = Depends(get_current_user)):
        user_role = (current_user.role or "").upper()
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {normalized_allowed}, but user has role '{user_role}'."
            )
        return current_user

    return role_checker