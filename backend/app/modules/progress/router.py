from fastapi import APIRouter

from app.modules.progress.schemas import DashboardSummaryResponse
from app.modules.progress.service import ProgressService

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary() -> DashboardSummaryResponse:
    service = ProgressService.get_instance()
    return service.get_dashboard_summary()
