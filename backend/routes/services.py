from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Service, Salon
from schemas import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)


@router.get("/salon/{salon_id}", response_model=List[ServiceResponse])
def get_salon_services(salon_id: int, db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.salon_id == salon_id).all()
    
    # If no custom services exist yet, auto-seed default popular services
    if not services:
        default_services = [
            {"name": "Precision Haircut & Style", "category": "Hair", "price": 150.0, "duration_mins": 30, "description": "Expert scissor cut and wash"},
            {"name": "Executive Beard Trim & Shaping", "category": "Beard", "price": 80.0, "duration_mins": 20, "description": "Crisp razor line-up and beard oil"},
            {"name": "Moroccan Scalp & Hair Spa", "category": "Spa", "price": 600.0, "duration_mins": 45, "description": "Deep nourishing botanical steam therapy"},
            {"name": "Radiant Gold Glow Facial", "category": "Skin", "price": 450.0, "duration_mins": 50, "description": "Ultrasonic detox and skin rejuvenation"},
            {"name": "Organic Hair Coloring", "category": "Hair", "price": 800.0, "duration_mins": 60, "description": "Ammonia-free global color and streaks"},
            {"name": "Bridal & Grooming Package", "category": "Bridal", "price": 1500.0, "duration_mins": 90, "description": "Complete head-to-toe styling treatment"}
        ]
        for s in default_services:
            new_s = Service(
                salon_id=salon_id,
                name=s["name"],
                category=s["category"],
                price=s["price"],
                duration_mins=s["duration_mins"],
                description=s["description"]
            )
            db.add(new_s)
        db.commit()
        services = db.query(Service).filter(Service.salon_id == salon_id).all()

    return services


@router.post("/", response_model=ServiceResponse)
def create_service(service: ServiceCreate, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == service.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    new_service = Service(
        salon_id=service.salon_id,
        name=service.name,
        category=service.category or "Hair",
        price=service.price,
        duration_mins=service.duration_mins or 30,
        description=service.description
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, service_data: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if service_data.name is not None:
        service.name = service_data.name
    if service_data.category is not None:
        service.category = service_data.category
    if service_data.price is not None:
        service.price = service_data.price
    if service_data.duration_mins is not None:
        service.duration_mins = service_data.duration_mins
    if service_data.description is not None:
        service.description = service_data.description

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return {"message": "Service deleted successfully"}
