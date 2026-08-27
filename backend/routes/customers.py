from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Booking
from schemas import CustomerCreate, CustomerUpdate, UserResponse, BookingResponse
from auth import hash_password

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.post("/", response_model=UserResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == customer.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists"
        )

    raw_password = customer.password or "customer123"
    new_customer = User(
        name=customer.name,
        email=customer.email,
        password=hash_password(raw_password),
        role="CUSTOMER",
        phone=customer.phone,
        address=customer.address
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


@router.get("/", response_model=List[UserResponse])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(User).filter(User.role == "CUSTOMER").all()
    # If no users with role=CUSTOMER exist, return all users for developer convenience
    if not customers:
        customers = db.query(User).all()
    return customers


@router.get("/{customer_id}", response_model=UserResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    return customer


@router.put("/{customer_id}", response_model=UserResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # Check if new email is used by another user
    if customer_data.email != customer.email:
        email_exists = db.query(User).filter(
            User.email == customer_data.email,
            User.id != customer_id
        ).first()
        if email_exists:
            raise HTTPException(
                status_code=400,
                detail="Email is already in use by another user"
            )

    customer.name = customer_data.name
    customer.email = customer_data.email
    customer.phone = customer_data.phone
    customer.address = customer_data.address

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # Delete related bookings first to maintain foreign key integrity
    db.query(Booking).filter(Booking.customer_id == customer_id).delete()

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer and associated bookings deleted successfully"
    }


@router.get("/{customer_id}/bookings", response_model=List[BookingResponse])
def get_customer_bookings(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    bookings = db.query(Booking).filter(Booking.customer_id == customer_id).all()
    return bookings
