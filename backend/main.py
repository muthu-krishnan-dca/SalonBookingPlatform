from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
from models import User, Salon, Booking
from schemas import UserCreate, UserLogin, ForgotPasswordRequest
from auth import hash_password, verify_password, create_access_token
from routes.salons import router as salon_router
from routes.bookings import router as booking_router
from routes.customers import router as customer_router
from routes.services import router as service_router
from routes.staff import router as staff_router
from routes.reviews import router as review_router
from routes.admin import router as admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GlowSync Salon Booking API",
    description="Full-featured multi-tenant platform for Customers, Salon Owners, Stylists & Administrators",
    version="2.0.0"
)

from rate_limiter import RateLimiterMiddleware

# Rate Limiter Middleware: Protects endpoints from abuse and brute-force attacks
app.add_middleware(RateLimiterMiddleware, default_limit=120, window_seconds=60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(salon_router)
app.include_router(booking_router)
app.include_router(customer_router)
app.include_router(service_router)
app.include_router(staff_router)
app.include_router(review_router)
app.include_router(admin_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Salon Booking API is running"
    }


@app.get("/db-test")
def database_test():
    try:
        with engine.connect():
            return {
                "message": "Database connected successfully"
            }
    except Exception as e:
        return {
            "message": "Database connection failed",
            "error": str(e)
        }


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role or "CUSTOMER",
        phone=user.phone,
        address=user.address
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If registering as SALON_OWNER and salon details provided, create Salon record
    if (user.role or "").upper() == "SALON_OWNER" and user.salon_name:
        new_salon = Salon(
            name=user.salon_name,
            description=user.salon_description or "Haircuts, styling, spa, and beauty services.",
            address=user.salon_address or user.address or "Main Road",
            city=user.salon_city or "City",
            phone=user.salon_phone or user.phone,
            owner_id=new_user.id
        )
        db.add(new_salon)
        db.commit()

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "phone": new_user.phone,
        "address": new_user.address
    }


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        existing_user.id,
        existing_user.role
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": existing_user.id,
        "role": existing_user.role,
        "name": existing_user.name,
        "email": existing_user.email
    }


from schemas import (
    UserCreate,
    UserLogin,
    ForgotPasswordRequest,
    SendOtpRequest,
    VerifyOtpRequest,
    ResetPasswordWithOtpRequest,
)
import random
import time
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Active in-memory OTP store
# Key: normalized target (email or cleaned phone)
# Value: { "otp": str, "expires_at": float, "verified": bool }
OTP_STORE = {}


def normalize_target(target: str) -> str:
    target = target.strip()
    if "@" in target:
        return target.lower()
    # Normalize phone: extract only digits
    digits = "".join(filter(str.isdigit, target))
    return digits if digits else target


def find_user_by_target(target: str, db: Session):
    target = target.strip()
    if "@" in target:
        return db.query(User).filter(User.email == target).first()

    # Search by exact phone
    user = db.query(User).filter(User.phone == target).first()
    if not user:
        digits_target = "".join(filter(str.isdigit, target))
        if digits_target and len(digits_target) >= 7:
            all_users = db.query(User).filter(User.phone.isnot(None)).all()
            for u in all_users:
                u_digits = "".join(filter(str.isdigit, u.phone or ""))
                if u_digits and (u_digits == digits_target or u_digits.endswith(digits_target) or digits_target.endswith(u_digits)):
                    return u
    return user


def send_real_email_otp(to_email: str, otp_code: str):
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"Salon Booking Platform <{smtp_user}>"
            msg["To"] = to_email
            msg["Subject"] = f"🔑 Your Salon Booking Platform OTP: {otp_code}"

            body = f"Hello,\n\nYour One-Time Password (OTP) for password reset is: {otp_code}\n\nThis OTP is valid for 10 minutes.\n\nRegards,\nSalon Booking Platform Team"
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            return True, "Email OTP delivered to your inbox!"
        except Exception as e:
            print("SMTP delivery exception:", e)
            return False, str(e)
    return True, "OTP generated successfully."


from otp_service import send_real_email_otp, send_real_sms_otp


@app.post("/send-otp")
def send_otp(payload: SendOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    target = payload.target.strip()
    if not target:
        raise HTTPException(
            status_code=400,
            detail="Please enter your registered Email or Mobile Number."
        )

    # 1. Verify user exists in database
    user = find_user_by_target(target, db)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No account found with '{target}'. Please enter the registered email or mobile number."
        )

    # 2. Generate 6-digit real OTP
    otp_code = str(random.randint(100000, 999999))
    norm_key = normalize_target(target)

    # Store OTP valid for 10 minutes (600 seconds)
    OTP_STORE[norm_key] = {
        "otp": otp_code,
        "expires_at": time.time() + 600,
        "verified": False,
        "user_id": user.id,
    }

    # 3. Non-blocking asynchronous real dispatch (never blocks or freezes HTTP response)
    if "@" in target:
        background_tasks.add_task(send_real_email_otp, user.email, otp_code, user.name)
    else:
        phone_target = user.phone or target
        background_tasks.add_task(send_real_sms_otp, phone_target, otp_code)

    return {
        "message": f"Real OTP dispatched to your {payload.mode or 'registered credential'}!",
        "target": target,
        "user_name": user.name,
        "expires_in": 600
    }


@app.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    norm_key = normalize_target(payload.target)
    stored = OTP_STORE.get(norm_key)

    if not stored:
        raise HTTPException(
            status_code=400,
            detail="No OTP requested for this credential, or OTP has expired. Please request a new OTP."
        )

    if time.time() > stored["expires_at"]:
        del OTP_STORE[norm_key]
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP."
        )

    if str(payload.otp).strip() != stored["otp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP code. Please enter the correct 6-digit OTP."
        )

    # Mark as verified
    stored["verified"] = True

    return {
        "message": "OTP verified successfully! You can now set your new password.",
        "verified": True
    }


@app.post("/reset-password-with-otp")
def reset_password_with_otp(payload: ResetPasswordWithOtpRequest, db: Session = Depends(get_db)):
    norm_key = normalize_target(payload.target)
    stored = OTP_STORE.get(norm_key)

    if not stored or not stored.get("verified"):
        raise HTTPException(
            status_code=400,
            detail="OTP verification required. Please verify OTP first before resetting password."
        )

    if str(payload.otp).strip() != stored["otp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP code."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters long."
        )

    user = db.query(User).filter(User.id == stored["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User account not found."
        )

    # Update password in MySQL
    user.password = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)

    # Clean up OTP store
    if norm_key in OTP_STORE:
        del OTP_STORE[norm_key]

    return {
        "message": "Password reset successfully! You can now login with your new password.",
        "user_name": user.name,
        "email": user.email
    }


@app.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = None
    search_target = payload.identifier or payload.phone or payload.email

    if not search_target or not search_target.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide your registered Email or Mobile Number."
        )

    user = find_user_by_target(search_target, db)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found matching this Email or Mobile Number."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters long."
        )

    user.password = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successfully! You can now login with your new password.",
        "user_name": user.name,
        "email": user.email
    }