from fastapi import APIRouter

from app.modules.testing.schemas import (
    MistakeListResponse,
    TestGenerateRequest,
    TestHistoryResponse,
    TestQuestionItem,
    TestResultResponse,
    TestSubmitRequest,
)
from app.modules.testing.service import TestingService

router = APIRouter(prefix="/api/testing", tags=["testing"])


@router.post("/generate", response_model=list[TestQuestionItem])
def generate_test(req: TestGenerateRequest) -> list[TestQuestionItem]:
    service = TestingService.get_instance()
    return service.generate_test(req)


@router.post("/submit", response_model=TestResultResponse)
def submit_test(req: TestSubmitRequest) -> TestResultResponse:
    service = TestingService.get_instance()
    return service.submit_test(req)


@router.get("/history", response_model=TestHistoryResponse)
def get_test_history() -> TestHistoryResponse:
    service = TestingService.get_instance()
    return service.get_test_history()


@router.get("/mistakes", response_model=MistakeListResponse)
def get_mistakes(limit: int = 30) -> MistakeListResponse:
    service = TestingService.get_instance()
    return service.get_mistakes(limit=limit)
