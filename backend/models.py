from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(30), default="CUSTOMER", nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)


class Salon(Base):
    __tablename__ = "salons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    opening_time = Column(String(30), default="09:00 AM", nullable=True)
    closing_time = Column(String(30), default="09:00 PM", nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    booking_date = Column(String(20), nullable=False)
    booking_time = Column(String(20), nullable=False)
    service = Column(String(150), nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)