from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Booking, Salon, Staff, StaffLeave
from schemas import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.get("/booked-slots")
def get_booked_slots(
    salon_id: int,
    date: str,
    staff_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Returns the list of time slots that are ALREADY booked on a given date.
    - If staff_id is provided: returns slots where THAT specific stylist is busy.
    - If staff_id is NOT provided (Any Stylist): returns slots only if ALL active stylists are busy.
    """
    if staff_id:
        booked_rows = db.query(Booking.booking_time).filter(
            Booking.salon_id == salon_id,
            Booking.staff_id == staff_id,
            Booking.booking_date == date,
            Booking.status.in_(["PENDING", "CONFIRMED"])
        ).all()
        booked = [row[0] for row in booked_rows]
        return {
            "salon_id": salon_id,
            "date": date,
            "staff_id": staff_id,
            "booked_slots": list(set(booked))
        }

    # If NO specific staff_id is passed ("Any Stylist" / general check):
    salon_staff = db.query(Staff).filter(
        Staff.salon_id == salon_id,
        Staff.is_available == True
    ).all()

    if not salon_staff:
        # Salon without staff configured in DB
        booked_rows = db.query(Booking.booking_time).filter(
            Booking.salon_id == salon_id,
            Booking.booking_date == date,
            Booking.status.in_(["PENDING", "CONFIRMED"])
        ).all()
        return {
            "salon_id": salon_id,
            "date": date,
            "staff_id": None,
            "booked_slots": list(set([row[0] for row in booked_rows]))
        }

    # Identify working stylists who are NOT on leave on this date
    working_staff_ids = []
    for st in salon_staff:
        is_on_leave = db.query(StaffLeave).filter(
            StaffLeave.staff_id == st.id,
            StaffLeave.leave_date == date
        ).first()
        if not is_on_leave:
            working_staff_ids.append(st.id)

    if not working_staff_ids:
        # All stylists are on leave!
        return {
            "salon_id": salon_id,
            "date": date,
            "staff_id": None,
            "booked_slots": [],
            "all_on_leave": True
        }

    # Find active bookings for this salon on this date
    active_bookings = db.query(Booking.booking_time, Booking.staff_id).filter(
        Booking.salon_id == salon_id,
        Booking.booking_date == date,
        Booking.status.in_(["PENDING", "CONFIRMED"])
    ).all()

    # Count how many stylists are booked for each slot
    slot_busy_counts = {}
    for b_time, b_staff in active_bookings:
        slot_busy_counts[b_time] = slot_busy_counts.get(b_time, 0) + 1

    # A slot is fully booked ONLY if ALL working stylists are occupied at that time slot!
    fully_booked_slots = [
        slot for slot, count in slot_busy_counts.items()
        if count >= len(working_staff_ids)
    ]

    return {
        "salon_id": salon_id,
        "date": date,
        "staff_id": None,
        "booked_slots": fully_booked_slots
    }


@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # 1. Verify Salon exists and is open
    salon = db.query(Salon).filter(Salon.id == booking.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    if not salon.is_open:
        raise HTTPException(status_code=400, detail="This salon has currently paused online bookings.")

    # 2. Check Customer Self Double-Booking conflict:
    # Same customer cannot book 2 appointments at the same date and time slot
    customer_conflict = db.query(Booking).filter(
        Booking.customer_id == booking.customer_id,
        Booking.booking_date == booking.booking_date,
        Booking.booking_time == booking.booking_time,
        Booking.status.in_(["PENDING", "CONFIRMED"])
    ).first()

    if customer_conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Already another booked. You already have an active appointment scheduled on {booking.booking_date} at {booking.booking_time}."
        )

    # 3. Stylist & Slot Conflict Checks
    final_staff_id = booking.staff_id

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

        # Check if THIS specific stylist already has a booking at this date & time
        staff_conflict = db.query(Booking).filter(
            Booking.staff_id == booking.staff_id,
            Booking.booking_date == booking.booking_date,
            Booking.booking_time == booking.booking_time,
            Booking.status.in_(["PENDING", "CONFIRMED"])
        ).first()

        if staff_conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Already another booked. Stylist {staff.name} is already booked on {booking.booking_date} at {booking.booking_time}. Please select another stylist or time slot."
            )
    else:
        # If staff_id is NOT specified (Customer chose "Any Available Stylist"):
        salon_staff = db.query(Staff).filter(
            Staff.salon_id == booking.salon_id,
            Staff.is_available == True
        ).all()

        if salon_staff:
            # Find an available stylist who is NOT on leave and has NO booking at this slot
            available_stylist = None
            for st in salon_staff:
                is_on_leave = db.query(StaffLeave).filter(
                    StaffLeave.staff_id == st.id,
                    StaffLeave.leave_date == booking.booking_date
                ).first()
                if is_on_leave:
                    continue

                has_booking = db.query(Booking).filter(
                    Booking.staff_id == st.id,
                    Booking.booking_date == booking.booking_date,
                    Booking.booking_time == booking.booking_time,
                    Booking.status.in_(["PENDING", "CONFIRMED"])
                ).first()
                if not has_booking:
                    available_stylist = st
                    break

            if available_stylist:
                final_staff_id = available_stylist.id
            else:
                # ALL stylists at this salon are booked at this time slot!
                raise HTTPException(
                    status_code=409,
                    detail=f"Already another booked. All stylists at {salon.name} are already booked on {booking.booking_date} at {booking.booking_time}. Please select another time slot or date."
                )
        else:
            # If no staff configured in DB, single-slot check for salon
            existing_slot = db.query(Booking).filter(
                Booking.salon_id == booking.salon_id,
                Booking.booking_date == booking.booking_date,
                Booking.booking_time == booking.booking_time,
                Booking.status.in_(["PENDING", "CONFIRMED"])
            ).first()
            if existing_slot:
                raise HTTPException(
                    status_code=409,
                    detail=f"Already another booked. This time slot ({booking.booking_time} on {booking.booking_date}) is already booked at {salon.name}. Please select another time slot."
                )

    new_booking = Booking(
        customer_id=booking.customer_id,
        salon_id=booking.salon_id,
        service_id=booking.service_id,
        staff_id=final_staff_id,
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
