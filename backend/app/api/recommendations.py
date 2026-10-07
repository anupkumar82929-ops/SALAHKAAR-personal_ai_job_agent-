from fastapi import APIRouter, Depends, Query

from app.api.auth import get_current_user
from app.recommendations.service import get_recommendations


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"],
)


@router.get("")
def recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    results = get_recommendations(
        user_id=current_user["id"],
        limit=limit,
    )

    return {
        "count": len(results),
        "recommendations": results,
    }