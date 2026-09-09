from fastapi import APIRouter, HTTPException

from app.modules.profile.schemas import (
    BackupDataPackage,
    ResetProgressRequest,
    UserGoalsUpdate,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.modules.profile.service import ProfileService

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=UserProfileResponse)
def get_profile() -> UserProfileResponse:
    service = ProfileService.get_instance()
    return service.get_profile()


@router.put("", response_model=UserProfileResponse)
def update_profile(req: UserProfileUpdate) -> UserProfileResponse:
    service = ProfileService.get_instance()
    return service.update_profile(req)


@router.put("/goals", response_model=UserProfileResponse)
def update_goals(req: UserGoalsUpdate) -> UserProfileResponse:
    service = ProfileService.get_instance()
    return service.update_goals(req)


@router.get("/export", response_model=BackupDataPackage)
def export_backup() -> BackupDataPackage:
    service = ProfileService.get_instance()
    return service.export_backup()


@router.post("/import")
def import_backup(pkg: BackupDataPackage) -> dict[str, str]:
    service = ProfileService.get_instance()
    service.import_backup(pkg)
    return {"message": "Dữ liệu học tập đã được khôi phục thành công"}


@router.post("/reset")
def reset_progress(req: ResetProgressRequest) -> dict[str, str]:
    if req.confirm_text.strip().upper() != "RESET":
        raise HTTPException(status_code=400, detail="Vui lòng nhập chính xác chữ 'RESET' để xác nhận")
    service = ProfileService.get_instance()
    service.reset_progress()
    return {"message": "Toàn bộ tiến độ học tập đã được đặt lại về mặc định"}
