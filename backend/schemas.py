from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "CUSTOMER"
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
    target: str  # Email or Mobile number
    mode: Optional[str] = "mobile"  # "mobile" or "email"


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

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    customer_id: int
    salon_id: int
    booking_date: str
    booking_time: str
    service: str
    status: Optional[str] = "PENDING"


class BookingStatusUpdate(BaseModel):
    status: str


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    salon_id: int
    booking_date: str
    booking_time: str
    service: str
    status: str

    class Config:
        from_attributes = True