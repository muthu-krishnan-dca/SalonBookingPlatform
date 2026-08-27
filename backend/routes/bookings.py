from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Booking, Salon
from schemas import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    new_booking = Booking(
        customer_id=booking.customer_id,
        salon_id=booking.salon_id,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        service=booking.service,
        status=booking.status or "PENDING"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/", response_model=List[BookingResponse])
def get_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    return bookings


@router.get("/salon/{salon_id}", response_model=List[BookingResponse])
def get_salon_bookings(salon_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.salon_id == salon_id).order_by(Booking.id.desc()).all()
    return bookings


@router.get("/owner/{owner_id}", response_model=List[BookingResponse])
def get_owner_bookings(owner_id: int, db: Session = Depends(get_db)):
    owner_salons = db.query(Salon.id).filter(Salon.owner_id == owner_id).all()
    salon_ids = [s[0] for s in owner_salons]
    if not salon_ids:
        return []
    bookings = (
        db.query(Booking)
        .filter(Booking.salon_id.in_(salon_ids))
        .order_by(Booking.id.desc())
        .all()
    )
    return bookings


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_data: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking.status = status_data.status
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking: BookingCreate,
    db: Session = Depends(get_db)
):
    existing_booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not existing_booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    existing_booking.customer_id = booking.customer_id
    existing_booking.salon_id = booking.salon_id
    existing_booking.booking_date = booking.booking_date
    existing_booking.booking_time = booking.booking_time
    existing_booking.service = booking.service
    existing_booking.status = booking.status or "PENDING"

    db.commit()
    db.refresh(existing_booking)

    return existing_booking


@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    db.delete(booking)
    db.commit()

    return {
        "message": "Booking deleted successfully"
    }
