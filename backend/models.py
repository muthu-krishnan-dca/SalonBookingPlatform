from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(30), default="CUSTOMER", nullable=False)  # CUSTOMER, SALON_OWNER, ADMIN
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)

    salons = relationship("Salon", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="customer", cascade="all, delete-orphan")


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
    rating = Column(Float, default=4.9, nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)

    owner = relationship("User", back_populates="salons")
    services = relationship("Service", back_populates="salon", cascade="all, delete-orphan")
    staff_members = relationship("Staff", back_populates="salon", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="salon", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="salon", cascade="all, delete-orphan")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="Hair", nullable=False)  # Hair, Spa, Skin, Beard, Bridal
    price = Column(Float, nullable=False)
    duration_mins = Column(Integer, default=30, nullable=False)
    description = Column(Text, nullable=True)

    salon = relationship("Salon", back_populates="services")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)  # Master Stylist, Color Specialist, Spa Therapist, Groomer
    experience_years = Column(Integer, default=3, nullable=False)
    phone = Column(String(20), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    photo_url = Column(String(255), nullable=True)

    salon = relationship("Salon", back_populates="staff_members")
    leaves = relationship("StaffLeave", back_populates="staff", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="staff")


class StaffLeave(Base):
    __tablename__ = "staff_leaves"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    leave_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    reason = Column(String(200), nullable=True)

    staff = relationship("Staff", back_populates="leaves")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    booking_date = Column(String(20), nullable=False)
    booking_time = Column(String(20), nullable=False)
    service = Column(String(150), nullable=False)  # Kept for backward compatibility & display
    price = Column(Float, default=0.0, nullable=True)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, CONFIRMED, COMPLETED, CANCELLED

    customer = relationship("User", back_populates="bookings")
    salon = relationship("Salon", back_populates="bookings")
    staff = relationship("Staff", back_populates="bookings")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    rating = Column(Integer, default=5, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="reviews")
    salon = relationship("Salon", back_populates="reviews")