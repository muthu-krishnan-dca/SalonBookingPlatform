from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Salon, User
from schemas import SalonCreate, SalonResponse, SalonStatusUpdate

router = APIRouter(
    prefix="/salons",
    tags=["Salons"]
)


@router.post("/", response_model=SalonResponse)
def create_salon(salon: SalonCreate, db: Session = Depends(get_db)):
    owner = db.query(User).filter(User.id == salon.owner_id).first()
    if not owner or owner.role.upper() not in ["SALON_OWNER", "OWNER"]:
        raise HTTPException(
            status_code=400,
            detail="Only registered salon owners can create a salon."
        )

    new_salon = Salon(
        name=salon.name,
        description=salon.description,
        address=salon.address,
        city=salon.city,
        phone=salon.phone,
        owner_id=salon.owner_id,
        is_open=salon.is_open if salon.is_open is not None else True,
        opening_time=salon.opening_time or "09:00 AM",
        closing_time=salon.closing_time or "09:00 PM"
    )

    db.add(new_salon)
    db.commit()
    db.refresh(new_salon)

    return new_salon


@router.get("/", response_model=List[SalonResponse])
def get_salons(db: Session = Depends(get_db)):
    salons = (
        db.query(Salon)
        .join(User, Salon.owner_id == User.id)
        .filter(User.role.in_(["SALON_OWNER", "OWNER", "salon_owner", "owner"]))
        .all()
    )
    return salons


@router.get("/owner/{owner_id}/all", response_model=List[SalonResponse])
@router.get("/owner/{owner_id}/branches", response_model=List[SalonResponse])
def get_all_salons_by_owner(owner_id: int, db: Session = Depends(get_db)):
    salons = db.query(Salon).filter(Salon.owner_id == owner_id).all()
    return salons


@router.get("/owner/{owner_id}", response_model=SalonResponse)
def get_salon_by_owner(owner_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.owner_id == owner_id).first()
    if not salon:
        raise HTTPException(
            status_code=404,
            detail="No salon found for this owner"
        )
    return salon


@router.get("/{salon_id}", response_model=SalonResponse)
def get_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()

    if not salon:
        raise HTTPException(
            status_code=404,
            detail="Salon not found"
        )

    return salon


@router.put("/{salon_id}", response_model=SalonResponse)
def update_salon(
    salon_id: int,
    salon_data: SalonCreate,
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()

    if not salon:
        raise HTTPException(
            status_code=404,
            detail="Salon not found"
        )

    salon.name = salon_data.name
    salon.description = salon_data.description
    salon.address = salon_data.address
    salon.city = salon_data.city
    salon.phone = salon_data.phone
    if salon_data.is_open is not None:
        salon.is_open = salon_data.is_open
    if salon_data.opening_time:
        salon.opening_time = salon_data.opening_time
    if salon_data.closing_time:
        salon.closing_time = salon_data.closing_time

    db.commit()
    db.refresh(salon)

    return salon


@router.patch("/{salon_id}/status", response_model=SalonResponse)
def update_salon_status(
    salon_id: int,
    status_data: SalonStatusUpdate,
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()

    if not salon:
        raise HTTPException(
            status_code=404,
            detail="Salon not found"
        )

    if status_data.is_open is not None:
        salon.is_open = status_data.is_open
    if status_data.opening_time is not None:
        salon.opening_time = status_data.opening_time
    if status_data.closing_time is not None:
        salon.closing_time = status_data.closing_time

    db.commit()
    db.refresh(salon)

    return salon


@router.delete("/{salon_id}")
def delete_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()

    if not salon:
        raise HTTPException(
            status_code=404,
            detail="Salon not found"
        )

    db.delete(salon)
    db.commit()

    return {
        "message": "Salon deleted successfully"
    }