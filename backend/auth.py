from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt

SECRET_KEY = "salon-booking-secret-key"
ALGORITHM = "HS256"


def hash_password(password: str):
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(
        password_bytes[:72],
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(
        plain_password.encode("utf-8")[:72],
        hashed_password.encode("utf-8")
    )


def create_access_token(user_id: int, role: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=2)

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)