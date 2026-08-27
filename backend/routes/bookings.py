from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Booking, Salon, Staff, StaffLeave
from schemas import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # 1. Verify Salon exists and is open
    salon = db.query(Salon).filter(Salon.id == booking.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    if not salon.is_open:
        raise HTTPException(status_code=400, detail="This salon has currently paused online bookings.")

    # 2. If staff_id is specified, perform Double-Booking and Leave checks
    if booking.staff_id:
        staff = db.query(Staff).filter(Staff.id == booking.staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Selected stylist/staff member not found")

        # Check Staff Leave
        leave = db.query(StaffLeave).filter(
            StaffLeave.staff_id == booking.staff_id,
            StaffLeave.leave_date == booking.booking_date
        ).first()
        if leave:
            raise HTTPException(
                status_code=400,
                detail=f"Stylist {staff.name} is on leave on {booking.booking_date} ({leave.reason}). Please select another stylist or date."
            )

        # Check Double-Booking conflict (overlapping appointments for same staff & slot)
        existing_conflict = db.query(Booking).filter(
            Booking.staff_id == booking.staff_id,
            Booking.booking_date == booking.booking_date,
            Booking.booking_time == booking.booking_time,
            Booking.status.in_(["PENDING", "CONFIRMED"])
        ).first()

        if existing_conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Stylist {staff.name} already has a booking at {booking.booking_time} on {booking.booking_date}. Please select a different time slot or stylist."
            )

    new_booking = Booking(
        customer_id=booking.customer_id,
        salon_id=booking.salon_id,
        service_id=booking.service_id,
        staff_id=booking.staff_id,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        service=booking.service,
        price=booking.price or 0.0,
        status=booking.status or "PENDING"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/", response_model=List[BookingResponse])
def get_bookings(db: Session = Depends(get_db)):
    return db.query(Booking).order_by(Booking.id.desc()).all()


@router.get("/customer/{customer_id}", response_model=List[BookingResponse])
def get_customer_bookings(customer_id: int, db: Session = Depends(get_db)):
    return db.query(Booking).filter(Booking.customer_id == customer_id).order_by(Booking.id.desc()).all()


@router.get("/salon/{salon_id}", response_model=List[BookingResponse])
def get_salon_bookings(salon_id: int, db: Session = Depends(get_db)):
    return db.query(Booking).filter(Booking.salon_id == salon_id).order_by(Booking.id.desc()).all()


@router.get("/owner/{owner_id}", response_model=List[BookingResponse])
def get_owner_bookings(owner_id: int, db: Session = Depends(get_db)):
    owner_salons = db.query(Salon.id).filter(Salon.owner_id == owner_id).all()
    salon_ids = [s[0] for s in owner_salons]
    if not salon_ids:
        return []
    return (
        db.query(Booking)
        .filter(Booking.salon_id.in_(salon_ids))
        .order_by(Booking.id.desc())
        .all()
    )


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_data: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = status_data.status
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "CANCELLED"
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted successfully"}
