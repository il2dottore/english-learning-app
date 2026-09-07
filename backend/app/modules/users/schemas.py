from pydantic import BaseModel


class UserRead(BaseModel):
    id: int
    email: str
