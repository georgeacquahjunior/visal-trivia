from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    credential: str


class NameAuthRequest(BaseModel):
    name: str


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    role: str
    picture: str | None = None


class GoogleAuthResponse(BaseModel):
    user: AuthUser
