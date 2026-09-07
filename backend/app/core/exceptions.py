class AppException(Exception):
    status_code = 400
    detail = "Application error"


class ResourceNotFoundError(AppException):
    status_code = 404

    def __init__(self, detail: str = "Resource not found") -> None:
        self.detail = detail
