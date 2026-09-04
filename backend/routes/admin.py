from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import User, Salon, Booking, Service, Staff, Review
from schemas import (
    AdminStatsResponse,
    UserResponse,
    SalonResponse,
    BookingResponse,
    ReviewResponse,
    AdminStaffResponse,
    AdminServiceResponse
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_statistics(db: Session = Depends(get_db)):
    total_customers = db.query(User).filter(User.role == "CUSTOMER").count()
    total_salons = db.query(Salon).count()
    total_owners = db.query(User).filter(User.role == "SALON_OWNER").count()
    total_staff = db.query(Staff).count()
    total_services = db.query(Service).count()
    total_bookings = db.query(Booking).count()
    
    pending_bookings = db.query(Booking).filter(Booking.status == "PENDING").count()
    confirmed_bookings = db.query(Booking).filter(Booking.status == "CONFIRMED").count()
    completed_bookings = db.query(Booking).filter(Booking.status == "COMPLETED").count()

    total_revenue = db.query(func.sum(Booking.price)).filter(Booking.status == "COMPLETED").scalar() or 0.0
    avg_rating = db.query(func.avg(Salon.rating)).scalar() or 4.9

    return {
        "total_customers": total_customers,
        "total_salons": total_salons,
        "total_owners": total_owners,
        "total_staff": total_staff,
        "total_services": total_services,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": round(float(total_revenue), 2),
        "average_rating": round(float(avg_rating), 1)
    }


@router.get("/users", response_model=List[UserResponse])
def get_all_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role and role != "ALL":
        query = query.filter(User.role == role)
    return query.order_by(User.id.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role not in ["CUSTOMER", "SALON_OWNER", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user.role = role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully from platform"}


@router.get("/salons", response_model=List[SalonResponse])
def get_all_salons_admin(db: Session = Depends(get_db)):
    return db.query(Salon).order_by(Salon.id.desc()).all()


@router.patch("/salons/{salon_id}/verify", response_model=SalonResponse)
def toggle_salon_verification(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    salon.is_verified = not salon.is_verified
    db.commit()
    db.refresh(salon)
    return salon


@router.delete("/salons/{salon_id}")
def delete_salon_admin(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    db.delete(salon)
    db.commit()
    return {"message": "Salon removed successfully by administrator"}


@router.get("/bookings", response_model=List[BookingResponse])
def get_all_bookings_admin(db: Session = Depends(get_db)):
    return db.query(Booking).order_by(Booking.id.desc()).all()


@router.get("/reviews", response_model=List[ReviewResponse])
def get_all_reviews_admin(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.id.desc()).all()


# ==========================================
# Admin Staff Management Endpoints
# ==========================================
@router.get("/staff", response_model=List[AdminStaffResponse])
def get_all_staff_admin(db: Session = Depends(get_db)):
    staff_records = (
        db.query(
            Staff.id,
            Staff.salon_id,
            Salon.name.label("salon_name"),
            Staff.name,
            Staff.specialization,
            Staff.experience_years,
            Staff.phone,
            Staff.is_available,
            Staff.photo_url
        )
        .join(Salon, Staff.salon_id == Salon.id, isouter=True)
        .order_by(Staff.id.desc())
        .all()
    )
    result = []
    for s in staff_records:
        result.append(
            AdminStaffResponse(
                id=s.id,
                salon_id=s.salon_id,
                salon_name=s.salon_name or "Salon",
                name=s.name,
                specialization=s.specialization,
                experience_years=s.experience_years,
                phone=s.phone,
                is_available=s.is_available,
                photo_url=s.photo_url
            )
        )
    return result


@router.delete("/staff/{staff_id}")
def delete_staff_admin(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    db.delete(staff)
    db.commit()
    return {"message": "Staff member removed successfully by administrator"}


# ==========================================
# Admin Services & Categories Endpoints
# ==========================================
@router.get("/services", response_model=List[AdminServiceResponse])
def get_all_services_admin(db: Session = Depends(get_db)):
    service_records = (
        db.query(
            Service.id,
            Service.salon_id,
            Salon.name.label("salon_name"),
            Service.name,
            Service.category,
            Service.price,
            Service.duration_mins,
            Service.description
        )
        .join(Salon, Service.salon_id == Salon.id, isouter=True)
        .order_by(Service.id.desc())
        .all()
    )
    result = []
    for s in service_records:
        result.append(
            AdminServiceResponse(
                id=s.id,
                salon_id=s.salon_id,
                salon_name=s.salon_name or "Salon",
                name=s.name,
                category=s.category,
                price=s.price,
                duration_mins=s.duration_mins,
                description=s.description
            )
        )
    return result


@router.delete("/services/{service_id}")
def delete_service_admin(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return {"message": "Service removed successfully by administrator"}

