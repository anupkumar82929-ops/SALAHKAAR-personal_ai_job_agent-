from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

# from fastapi import Depends
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.dependencies import get_current_user
from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


@router.post("/register")
def register_user(request: RegisterRequest):

    # Basic password validation
    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    # Hash password before storing it
    password_hash = hash_password(request.password)

    try:

        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO users
                    (
                        email,
                        password_hash,
                        full_name
                    )
                    VALUES (%s, %s, %s)
                    RETURNING id, email, full_name, created_at;
                    """,
                    (
                        request.email,
                        password_hash,
                        request.full_name,
                    ),
                )

                user = cursor.fetchone()

        return {
            "message": "User registered successfully.",
            "user": {
                "id": user[0],
                "email": user[1],
                "full_name": user[2],
                "created_at": user[3],
            },
        }

    except Exception as error:

        if "unique" in str(error).lower():
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists.",
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to create account.",
        )

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login_user(request: LoginRequest):

    try:

        with get_connection() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id, email, password_hash, full_name
                    FROM users
                    WHERE email = %s;
                    """,
                    (request.email,),
                )

                user = cursor.fetchone()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        user_id = user[0]
        email = user[1]
        password_hash = user[2]
        full_name = user[3]

        if not verify_password(request.password, password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        access_token = create_access_token(user_id)

        return {
            "message": "Login successful.",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
            },
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to process login.",
        )

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):

    return {
        "user": current_user
    }
