from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import Review, Salon, User
from schemas import ReviewCreate, ReviewResponse

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.get("/salon/{salon_id}", response_model=List[ReviewResponse])
def get_salon_reviews(salon_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.salon_id == salon_id).order_by(Review.created_at.desc()).all()
    return reviews


@router.post("/", response_model=ReviewResponse)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == review.salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    customer = db.query(User).filter(User.id == review.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars")

    new_review = Review(
        customer_id=review.customer_id,
        salon_id=review.salon_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()

    # Recalculate average rating for the salon
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.salon_id == review.salon_id).scalar()
    if avg_rating:
        salon.rating = round(float(avg_rating), 1)
        db.commit()

    db.refresh(new_review)
    return new_review


@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    salon_id = review.salon_id
    db.delete(review)
    db.commit()

    # Recalculate rating
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.salon_id == salon_id).scalar()
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if salon:
        salon.rating = round(float(avg_rating), 1) if avg_rating else 4.9
        db.commit()

    return {"message": "Review deleted successfully"}
