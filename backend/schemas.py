from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from sanitizer import sanitize_input


class SanitizedBaseModel(BaseModel):
    """
    Automatic Input Sanitization Base Model.
    All string inputs are automatically stripped of control characters,
    excessive whitespace, and sanitized against Cross-Site Scripting (XSS).
    """
    @model_validator(mode="before")
    @classmethod
    def sanitize_fields(cls, data):
        if isinstance(data, dict):
            sanitized = {}
            for k, v in data.items():
                if "password" in k.lower() and isinstance(v, str):
                    sanitized[k] = v.replace("\x00", "")
                else:
                    sanitized[k] = sanitize_input(v)
            return sanitized
        return data


class UserBase(SanitizedBaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name (min 2 chars)")
    email: EmailStr = Field(..., description="Valid email address")
    role: Optional[str] = "CUSTOMER"  # CUSTOMER, SALON_OWNER, ADMIN
    phone: Optional[str] = None
    address: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v:
            v_upper = v.upper().strip()
            if v_upper not in ["CUSTOMER", "SALON_OWNER", "ADMIN"]:
                raise ValueError("Role must be CUSTOMER, SALON_OWNER, or ADMIN")
            return v_upper
        return "CUSTOMER"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    salon_name: Optional[str] = None
    salon_description: Optional[str] = None
    salon_address: Optional[str] = None
    salon_city: Optional[str] = None
    salon_phone: Optional[str] = None


class UserLogin(SanitizedBaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(SanitizedBaseModel):
    identifier: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    new_password: str = Field(..., min_length=6)


class SendOtpRequest(SanitizedBaseModel):
    target: str
    mode: Optional[str] = "mobile"


class VerifyOtpRequest(SanitizedBaseModel):
    target: str
    otp: str


class ResetPasswordWithOtpRequest(SanitizedBaseModel):
    target: str
    otp: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerCreate(SanitizedBaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = "customer123"
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = "CUSTOMER"


class CustomerUpdate(SanitizedBaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


# ==========================================
# Service Schemas
# ==========================================
class ServiceCreate(SanitizedBaseModel):
    salon_id: int
    name: str = Field(..., min_length=2)
    category: Optional[str] = "Hair"
    price: float = Field(..., ge=0.0)
    duration_mins: Optional[int] = Field(30, gt=0)
    description: Optional[str] = None


class ServiceUpdate(SanitizedBaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    duration_mins: Optional[int] = None
    description: Optional[str] = None


class ServiceResponse(BaseModel):
    id: int
    salon_id: int
    name: str
    category: str
    price: float
    duration_mins: int
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# Staff / Stylist Schemas
# ==========================================
class StaffCreate(SanitizedBaseModel):
    salon_id: int
    name: str = Field(..., min_length=2)
    specialization: str
    experience_years: Optional[int] = Field(3, ge=0)
    phone: Optional[str] = None
    is_available: Optional[bool] = True
    photo_url: Optional[str] = None


class StaffUpdate(SanitizedBaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    is_available: Optional[bool] = None
    photo_url: Optional[str] = None


class StaffResponse(BaseModel):
    id: int
    salon_id: int
    name: str
    specialization: str
    experience_years: int
    phone: Optional[str] = None
    is_available: bool
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class StaffLeaveCreate(SanitizedBaseModel):
    staff_id: int
    leave_date: str
    reason: Optional[str] = None


class StaffLeaveResponse(BaseModel):
    id: int
    staff_id: int
    leave_date: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# Salon Schemas
# ==========================================
class SalonCreate(SanitizedBaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    address: str
    city: str
    phone: Optional[str] = None
    owner_id: int
    is_open: Optional[bool] = True
    opening_time: Optional[str] = "09:00 AM"
    closing_time: Optional[str] = "09:00 PM"
    rating: Optional[float] = 4.9
    is_verified: Optional[bool] = True


class SalonStatusUpdate(SanitizedBaseModel):
    is_open: Optional[bool] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None


class SalonResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    address: str
    city: str
    phone: Optional[str] = None
    owner_id: int
    is_open: Optional[bool] = True
    opening_time: Optional[str] = "09:00 AM"
    closing_time: Optional[str] = "09:00 PM"
    rating: Optional[float] = 4.9
    is_verified: Optional[bool] = True

    class Config:
        from_attributes = True


# ==========================================
# Booking Schemas with Double-Booking Prevention
# ==========================================
class BookingCreate(SanitizedBaseModel):
    customer_id: int
    salon_id: int
    service_id: Optional[int] = None
    staff_id: Optional[int] = None
    booking_date: str = Field(..., min_length=8, description="Date in YYYY-MM-DD format")
    booking_time: str = Field(..., min_length=4, description="Slot time e.g. 10:00 AM")
    service: str = Field(..., min_length=2)
    price: Optional[float] = Field(0.0, ge=0.0)
    status: Optional[str] = "PENDING"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v:
            v_upper = v.upper().strip()
            if v_upper not in ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]:
                raise ValueError("Status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED")
            return v_upper
        return "PENDING"


class BookingStatusUpdate(SanitizedBaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        v_upper = v.upper().strip()
        if v_upper not in ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]:
            raise ValueError("Status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED")
        return v_upper


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    salon_id: int
    service_id: Optional[int] = None
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    booking_date: str
    booking_time: str
    service: str
    price: Optional[float] = 0.0
    status: str

    class Config:
        from_attributes = True


# ==========================================
# Review & Rating Schemas
# ==========================================
class ReviewCreate(SanitizedBaseModel):
    customer_id: int
    salon_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating must be an integer between 1 and 5 stars")
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    customer_id: int
    salon_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Admin Stats & Management Schemas
# ==========================================
class AdminStatsResponse(BaseModel):
    total_customers: int
    total_salons: int
    total_owners: int
    total_staff: int
    total_services: int
    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    total_revenue: float
    average_rating: float


class AdminStaffResponse(BaseModel):
    id: int
    salon_id: int
    salon_name: Optional[str] = "Salon"
    name: str
    specialization: str
    experience_years: int
    phone: Optional[str] = None
    is_available: bool
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class AdminServiceResponse(BaseModel):
    id: int
    salon_id: int
    salon_name: Optional[str] = "Salon"
    name: str
    category: str
    price: float
    duration_mins: int
    description: Optional[str] = None

    class Config:
        from_attributes = True