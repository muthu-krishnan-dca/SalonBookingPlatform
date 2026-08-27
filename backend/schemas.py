from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "CUSTOMER"  # CUSTOMER, SALON_OWNER, ADMIN
    phone: Optional[str] = None
    address: Optional[str] = None


class UserCreate(UserBase):
    password: str
    salon_name: Optional[str] = None
    salon_description: Optional[str] = None
    salon_address: Optional[str] = None
    salon_city: Optional[str] = None
    salon_phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    new_password: str


class SendOtpRequest(BaseModel):
    target: str
    mode: Optional[str] = "mobile"


class VerifyOtpRequest(BaseModel):
    target: str
    otp: str


class ResetPasswordWithOtpRequest(BaseModel):
    target: str
    otp: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = "customer123"
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = "CUSTOMER"


class CustomerUpdate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


# ==========================================
# Service Schemas
# ==========================================
class ServiceCreate(BaseModel):
    salon_id: int
    name: str
    category: Optional[str] = "Hair"
    price: float
    duration_mins: Optional[int] = 30
    description: Optional[str] = None


class ServiceUpdate(BaseModel):
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
class StaffCreate(BaseModel):
    salon_id: int
    name: str
    specialization: str
    experience_years: Optional[int] = 3
    phone: Optional[str] = None
    is_available: Optional[bool] = True
    photo_url: Optional[str] = None


class StaffUpdate(BaseModel):
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


class StaffLeaveCreate(BaseModel):
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
class SalonCreate(BaseModel):
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


class SalonStatusUpdate(BaseModel):
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
class BookingCreate(BaseModel):
    customer_id: int
    salon_id: int
    service_id: Optional[int] = None
    staff_id: Optional[int] = None
    booking_date: str
    booking_time: str
    service: str
    price: Optional[float] = 0.0
    status: Optional[str] = "PENDING"


class BookingStatusUpdate(BaseModel):
    status: str


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    salon_id: int
    service_id: Optional[int] = None
    staff_id: Optional[int] = None
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
class ReviewCreate(BaseModel):
    customer_id: int
    salon_id: int
    rating: int  # 1-5
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
# Admin Stats Schemas
# ==========================================
class AdminStatsResponse(BaseModel):
    total_customers: int
    total_salons: int
    total_owners: int
    total_staff: int
    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    total_revenue: float
    average_rating: float