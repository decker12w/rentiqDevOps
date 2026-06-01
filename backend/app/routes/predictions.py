from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models.neighborhood import Neighborhood
from app.models.prediction import Prediction
from app.models.user import User
from app.services.auth import decode_token
from app.services.predictor import predict

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _get_user_optional(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        user_id = decode_token(authorization.split(" ", 1)[1])
        return session.get(User, user_id)
    except Exception:
        return None


def _get_user_required(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    user = _get_user_optional(authorization, session)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return user


class PredictionRequest(BaseModel):
    type: str
    neighborhood_id: str
    area: float
    bedrooms: int
    bathrooms: int
    parking: int


class ImpactFactor(BaseModel):
    label: str
    value: float
    weight: float


class PredictionResponse(BaseModel):
    price: float
    min: float
    max: float
    margin_pct: float
    factors: list[ImpactFactor]


class PredictionHistoryItem(BaseModel):
    id: str
    type: str
    neighborhood: str
    area: float
    bedrooms: int
    bathrooms: int
    parking: int
    estimated_price: float
    price_min: float
    price_max: float
    created_at: datetime


@router.post("", response_model=PredictionResponse, status_code=201)
def create_prediction(
    body: PredictionRequest,
    session: Session = Depends(get_session),
    user: Optional[User] = Depends(_get_user_optional),
):
    neighborhood = session.exec(
        select(Neighborhood).where(Neighborhood.id == body.neighborhood_id)
    ).first()

    if not neighborhood:
        raise HTTPException(status_code=404, detail="Neighborhood not found")

    result = predict(
        type=body.type,
        neighborhood_name=neighborhood.name,
        area=body.area,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        parking=body.parking,
        latitude=neighborhood.latitude,
        longitude=neighborhood.longitude,
    )

    session.add(Prediction(
        type=body.type,
        neighborhood=neighborhood.name,
        area=body.area,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        parking=body.parking,
        estimated_price=result["price"],
        price_min=result["min"],
        price_max=result["max"],
        user_id=user.id if user else None,
    ))
    session.commit()

    return result


@router.get("", response_model=list[PredictionHistoryItem])
def list_predictions(
    user: User = Depends(_get_user_required),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Prediction)
        .where(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
    ).all()
