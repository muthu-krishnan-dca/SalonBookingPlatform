from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Staff, StaffLeave, Salon, Booking
from schemas import StaffCreate, StaffUpdate, StaffResponse, StaffLeaveCreate, StaffLeaveResponse

router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)


@router.get("/salon/{salon_id}", response_model=List[StaffResponse])
def get_salon_staff(salon_id: int, db: Session = Depends(get_db)):
    staff_list = db.query(Staff).filter(Staff.salon_id == salon_id).all()

    # If no staff exists, auto-seed default master stylists
    if not staff_list:
        default_staff = [
            {"name": "Alex Rivera", "specialization": "Master Hair Stylist & Colorist", "experience_years": 7, "phone": "9876543210"},
            {"name": "Priya Sharma", "specialization": "Spa & Organic Skin Specialist", "experience_years": 5, "phone": "9876543211"},
            {"name": "David Miller", "specialization": "Executive Beard & Shaving Artist", "experience_years": 6, "phone": "9876543212"}
        ]
        for s in default_staff:
            new_s = Staff(
                salon_id=salon_id,
                name=s["name"],
                specialization=s["specialization"],
                experience_years=s["experience_years"],
                phone=s["phone"],
                is_available=True
            )
            db.add(new_s)
        db.commit()
        staff_list = db.query(Staff).filter(Staff.salon_id == salon_id).all()

    return staff_list


@router.post("/", response_model=StaffResponse)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == staff.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    new_staff = Staff(
        salon_id=staff.salon_id,
        name=staff.name,
        specialization=staff.specialization,
        experience_years=staff.experience_years or 3,
        phone=staff.phone,
        is_available=staff.is_available if staff.is_available is not None else True,
        photo_url=staff.photo_url
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff


@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(staff_id: int, staff_data: StaffUpdate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.specialization is not None:
        staff.specialization = staff_data.specialization
    if staff_data.experience_years is not None:
        staff.experience_years = staff_data.experience_years
    if staff_data.phone is not None:
        staff.phone = staff_data.phone
    if staff_data.is_available is not None:
        staff.is_available = staff_data.is_available
    if staff_data.photo_url is not None:
        staff.photo_url = staff_data.photo_url

    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    db.delete(staff)
    db.commit()
    return {"message": "Staff member deleted successfully"}


# ==========================================
# Staff Leave & Availability Management
# ==========================================
@router.post("/leave", response_model=StaffLeaveResponse)
def add_staff_leave(leave_data: StaffLeaveCreate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == leave_data.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Check if leave already marked for this date
    existing = db.query(StaffLeave).filter(
        StaffLeave.staff_id == leave_data.staff_id,
        StaffLeave.leave_date == leave_data.leave_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave already registered for this date")

    new_leave = StaffLeave(
        staff_id=leave_data.staff_id,
        leave_date=leave_data.leave_date,
        reason=leave_data.reason or "Scheduled Day Off"
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave


@router.get("/{staff_id}/leaves", response_model=List[StaffLeaveResponse])
def get_staff_leaves(staff_id: int, db: Session = Depends(get_db)):
    leaves = db.query(StaffLeave).filter(StaffLeave.staff_id == staff_id).all()
    return leaves


@router.delete("/leave/{leave_id}")
def delete_staff_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(StaffLeave).filter(StaffLeave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
    db.delete(leave)
    db.commit()
    return {"message": "Leave cancelled successfully"}


@router.get("/{staff_id}/check-availability")
def check_staff_availability(
    staff_id: int,
    date: str,
    time: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Check if staff is on leave on this date
    on_leave = db.query(StaffLeave).filter(
        StaffLeave.staff_id == staff_id,
        StaffLeave.leave_date == date
    ).first()

    if on_leave:
        return {
            "available": False,
            "reason": f"Stylist is on leave on {date} ({on_leave.reason})"
        }

    # 2. Check if staff already has a confirmed or pending booking at this specific time
    if time:
        conflict = db.query(Booking).filter(
            Booking.staff_id == staff_id,
            Booking.booking_date == date,
            Booking.booking_time == time,
            Booking.status.in_(["PENDING", "CONFIRMED"])
        ).first()

        if conflict:
            return {
                "available": False,
                "reason": "Stylist is already booked for this time slot"
            }

    return {"available": True, "reason": "Stylist is available"}
