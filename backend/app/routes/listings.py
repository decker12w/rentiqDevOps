from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

from app.database import get_session
from app.models.listing import Listing
from app.models.neighborhood import Neighborhood
from app.models.user import User
from app.services.auth import decode_token
from app.services.predictor import predict

router = APIRouter(prefix="/listings", tags=["listings"])


def _get_user_required(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    try:
        user_id = decode_token(authorization.split(" ", 1)[1])
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Autenticação necessária")
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Autenticação necessária")


class ListingItem(BaseModel):
    id: str
    type: str
    neighborhood: str
    useful_area: Optional[float]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    parking: Optional[int]
    rent_price: Optional[float]


class ListingRequest(BaseModel):
    type: str
    neighborhood_id: str
    area: float
    bedrooms: int
    bathrooms: int
    parking: int
    rent_price: float


class ImpactFactor(BaseModel):
    label: str
    value: float
    weight: float


class ListingResponse(BaseModel):
    id: str
    neighborhood: str
    estimated_price: float
    price_min: float
    price_max: float
    margin_pct: float
    factors: list[ImpactFactor]


@router.get("", response_model=list[ListingItem])
def list_my_listings(
    user: User = Depends(_get_user_required),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Listing)
        .where(Listing.source_code == f"user:{user.id}")
        .order_by(Listing.scraped_at.desc())
    ).all()


@router.post("", response_model=ListingResponse, status_code=201)
def create_listing(
    body: ListingRequest,
    session: Session = Depends(get_session),
    user: User = Depends(_get_user_required),
):
    neighborhood = session.exec(
        select(Neighborhood).where(Neighborhood.id == body.neighborhood_id)
    ).first()

    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")

    listing = Listing(
        source="usuario",
        source_code=f"user:{user.id}",
        type=body.type,
        purpose="rent",
        rent_price=body.rent_price,
        neighborhood=neighborhood.name,
        latitude=neighborhood.latitude,
        longitude=neighborhood.longitude,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        parking=body.parking,
        useful_area=body.area,
    )
    session.add(listing)
    session.commit()
    session.refresh(listing)

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

    return ListingResponse(
        id=listing.id,
        neighborhood=neighborhood.name,
        estimated_price=result["price"],
        price_min=result["min"],
        price_max=result["max"],
        margin_pct=result["margin_pct"],
        factors=result["factors"],
    )
