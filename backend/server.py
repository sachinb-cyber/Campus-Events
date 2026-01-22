from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from openpyxl import Workbook
from io import BytesIO
import asyncio
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ===== ROLE-BASED ACCESS CONTROL (RBAC) =====
# Email-based role assignment at OAuth token exchange time
# Check hierarchy: SUPER_ADMIN_EMAILS -> ADMIN_EMAILS -> user
# CRITICAL: .strip() removes whitespace for proper email matching
ADMIN_EMAILS = [e.strip() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
SUPER_ADMIN_EMAILS = [e.strip() for e in os.environ.get('SUPER_ADMIN_EMAILS', '').split(',') if e.strip()]
ADMIN_LOGIN_EMAIL = os.environ.get('ADMIN_LOGIN_EMAIL', 'admin@rcpit.edu')
ADMIN_LOGIN_PASSWORD = os.environ.get('ADMIN_LOGIN_PASSWORD', 'Admin@123')
SUPER_ADMIN_EMAIL = os.environ.get('SUPER_ADMIN_EMAIL', 'superadmin@college.edu')
SUPER_ADMIN_PASSWORD = os.environ.get('SUPER_ADMIN_PASSWORD', 'SuperAdmin@123')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    prn: Optional[str] = None
    role: str = "user"
    is_blocked: bool = False
    password_hash: Optional[str] = None  # For admin/superadmin with password login
    created_at: datetime

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    prn: Optional[str] = None

    @validator('phone')
    def validate_phone(cls, v):
        if v and (not v.isdigit() or len(v) != 10):
            raise ValueError('Phone number must be exactly 10 digits')
        return v
    
    @validator('prn')
    def validate_prn(cls, v):
        if v and (not v.isdigit() or len(v) != 9):
            raise ValueError('PRN must be exactly 9 digits')
        return v

class HelpTicketCreate(BaseModel):
    subject: str
    message: str

class HelpTicketReply(BaseModel):
    message: str

class CertificateIssue(BaseModel):
    certificate_type: str  # "participant", "winner", "1st", "2nd", "3rd"

class AdminCreate(BaseModel):
    email: str
    name: str
    password: str

class SystemConfigUpdate(BaseModel):
    colleges: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    popup_enabled: Optional[bool] = None
    popup_type: Optional[str] = None  # "instagram", "whatsapp", "custom"
    popup_content: Optional[Dict[str, str]] = None
    required_fields: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None  # instagram, facebook, whatsapp, linkedin, twitter, youtube, website
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    help_link: Optional[str] = None
    terms_link: Optional[str] = None
    privacy_link: Optional[str] = None
    about_link: Optional[str] = None
    event_registration_enabled: Optional[bool] = None
    max_team_size: Optional[int] = None
    custom_footer_text: Optional[str] = None

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Event(BaseModel):
    event_id: str
    title: str
    description: str
    event_type: str  # "single" or "team"
    team_size: Optional[int] = None
    event_date: datetime
    deadline: datetime
    status: str = "active"  # "active" or "closed"
    category: str
    venue: str
    rules: Optional[str] = None
    organizer_info: Optional[str] = None
    is_paid: bool = False
    event_image: Optional[str] = None
    required_fields: List[str] = ["name", "email", "phone", "college"]
    created_at: datetime

class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str
    team_size: Optional[int] = None
    event_date: str
    deadline: str
    category: str
    venue: str
    rules: Optional[str] = None
    organizer_info: Optional[str] = None
    is_paid: bool = False

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    team_size: Optional[int] = None
    event_date: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    rules: Optional[str] = None
    organizer_info: Optional[str] = None
    is_paid: Optional[bool] = None

class TeamMember(BaseModel):
    name: str
    email: str
    phone: str
    college: str

class Registration(BaseModel):
    registration_id: str
    event_id: str
    user_id: str
    team_name: Optional[str] = None
    team_members: Optional[List[TeamMember]] = None
    payment_status: str = "pending"
    status: str = "active"  # "active", "cancelled", "cancellation_requested"
    certificate_type: Optional[str] = None  # "participant", "winner", "1st", "2nd", "3rd"
    created_at: datetime

class HelpTicket(BaseModel):
    ticket_id: str
    user_id: str
    subject: str
    message: str
    status: str = "open"  # "open", "in_progress", "closed"
    replies: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

class SystemConfig(BaseModel):
    config_key: str
    config_value: Any
    updated_at: datetime

class RegistrationCreate(BaseModel):
    event_id: str
    team_name: Optional[str] = None
    team_members: Optional[List[TeamMember]] = None

class SessionData(BaseModel):
    session_id: str

class SupabaseTokenExchange(BaseModel):
    access_token: str

class SuperAdminLogin(BaseModel):
    email: str
    password: str

# Authentication Helper
async def get_current_user(request: Request) -> User:
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check if user is blocked
    if user_doc.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Please contact admin.")
    
    return User(**user_doc)


def _is_localhost(host: str) -> bool:
    if not host:
        return False
    host_only = host.split(':')[0].lower()
    return host_only in ("localhost", "127.0.0.1", "[::1]")


def _set_session_cookie(response: Response, session_token: str, request: Request):
    """Set session_token cookie with Secure auto-detection.

    If DEV_DISABLE_SECURE_COOKIE env var is set to true, or the request host
    looks like localhost, set secure=False so cookies work on http://localhost
    for development.
    """
    dev_disable_secure = os.environ.get("DEV_DISABLE_SECURE_COOKIE", "false").lower() in ("1", "true", "yes")
    host = None
    try:
        host = request.headers.get("host")
    except Exception:
        host = None

    secure_flag = not (dev_disable_secure or _is_localhost(host))
    # Use SameSite=Lax for localhost (secure=False), SameSite=None for HTTPS
    samesite_value = "lax" if not secure_flag else "none"
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure_flag,
        samesite=samesite_value,
        max_age=7*24*60*60,
        path="/"
    )

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

# Auth Routes
@api_router.post("/auth/admin/login")
async def admin_login(data: SuperAdminLogin, response: Response, request: Request):
    # First check default admin credentials
    if data.email == ADMIN_LOGIN_EMAIL and data.password == ADMIN_LOGIN_PASSWORD:
        # Check if default admin user exists
        existing_user = await db.users.find_one({"email": ADMIN_LOGIN_EMAIL}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update role to admin
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"role": "admin"}}
            )
        else:
            # Create default admin user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": ADMIN_LOGIN_EMAIL,
                "name": "RCPIT Admin",
                "picture": None,
                "role": "admin",
                "is_blocked": False,
                "password_hash": pwd_context.hash(ADMIN_LOGIN_PASSWORD),
                "created_at": datetime.now(timezone.utc)
            })
    else:
        # Check if admin exists in database with password
        existing_user = await db.users.find_one(
            {"email": data.email, "role": "admin"},
            {"_id": 0}
        )
        
        if not existing_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not existing_user.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not pwd_context.verify(data.password, existing_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = existing_user["user_id"]
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie (secure flag auto-detected)
    _set_session_cookie(response, session_token, request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    # Don't send password hash to frontend
    if "password_hash" in user:
        del user["password_hash"]
    return user

@api_router.post("/auth/superadmin/login")
async def superadmin_login(data: SuperAdminLogin, response: Response, request: Request):
    if data.email != SUPER_ADMIN_EMAIL or data.password != SUPER_ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if super admin user exists
    existing_user = await db.users.find_one({"email": SUPER_ADMIN_EMAIL}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update role to superadmin
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"role": "superadmin"}}
        )
    else:
        # Create super admin user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": SUPER_ADMIN_EMAIL,
            "name": "Super Admin",
            "picture": None,
            "role": "superadmin",
            "created_at": datetime.now(timezone.utc)
        })
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie (secure flag auto-detected)
    _set_session_cookie(response, session_token, request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.post("/auth/session")
async def create_session(data: SessionData, response: Response, request: Request):
    # Exchange session_id for user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id},
                timeout=10.0
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to verify session: {str(e)}")
    
    # Check if user is admin
    role = "admin" if user_data["email"] in ADMIN_EMAILS else "user"
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"],
                "picture": user_data["picture"],
                "role": role
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": role,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie (secure flag auto-detected)
    _set_session_cookie(response, session_token, request)
    
    # Get user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api_router.post("/auth/exchange-supabase")
async def exchange_supabase(data: SupabaseTokenExchange, response: Response, request: Request):
    """Exchange a Supabase access token for a backend session cookie.

    Expects JSON: { "access_token": "..." }
    Calls Supabase `/auth/v1/user` with the provided token to get user info.
    Creates/updates the user in the DB, creates a session_token and sets the
    `session_token` cookie (httponly). For local development, set
    DEV_DISABLE_SECURE_COOKIE=true to allow the cookie to be set over HTTP.
    """
    logging.info(f"exchange_supabase called")
    access_token = data.access_token
    if not access_token:
        logging.error("access_token not provided in request")
        raise HTTPException(status_code=400, detail="access_token required")

    supabase_url = os.environ.get("SUPABASE_URL")
    if not supabase_url:
        logging.error("SUPABASE_URL not configured")
        raise HTTPException(status_code=500, detail="SUPABASE_URL not configured on server")

    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_anon_key:
        logging.error("SUPABASE_ANON_KEY not configured")
        raise HTTPException(status_code=500, detail="SUPABASE_ANON_KEY not configured on server")

    logging.info(f"Verifying token with Supabase: {supabase_url}")
    logging.info(f"Token preview: {access_token[:50]}...")
    # Verify token with Supabase
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "apikey": supabase_anon_key
                },
                timeout=10.0
            )
            logging.info(f"Supabase response status: {resp.status_code}")
            if resp.status_code != 200:
                response_text = resp.text[:500]
                logging.error(f"Supabase returned {resp.status_code}: {response_text}")
            resp.raise_for_status()
            supa_user = resp.json()
            logging.info(f"Supabase user info retrieved: {supa_user.get('email')}")
        except Exception as e:
            logging.error(f"Failed to verify supabase token: {str(e)}", exc_info=True)
            
            # Provide more helpful error message
            error_msg = str(e)
            if "401" in error_msg or "Unauthorized" in error_msg:
                raise HTTPException(
                    status_code=400, 
                    detail="Token verification failed with Supabase. This usually means: 1) Google OAuth isn't enabled in your Supabase project, 2) Client ID/Secret is incorrect, or 3) Token is invalid. Check https://app.supabase.com > Authentication > Providers > Google"
                )
            else:
                raise HTTPException(status_code=400, detail=f"Failed to verify supabase token: {str(e)}")

    email = supa_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Supabase user info missing email")

    # Derive name and picture from user_metadata if available
    user_metadata = supa_user.get("user_metadata") or {}
    name = user_metadata.get("full_name") or user_metadata.get("name") or email
    picture = user_metadata.get("avatar_url") or supa_user.get("picture")

    # ===== ROLE ASSIGNMENT LOGIC (CRITICAL) =====
    # Hierarchical check:
    # 1. If email in SUPER_ADMIN_EMAILS -> superadmin role
    # 2. Else if email in ADMIN_EMAILS -> admin role
    # 3. Else -> user role
    # This happens at every login, so changing ADMIN_EMAILS env var takes effect next login
    if email in SUPER_ADMIN_EMAILS:
        role = "superadmin"
    elif email in ADMIN_EMAILS:
        role = "admin"
    else:
        role = "user"

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "role": role}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc)
        })

    # Create backend session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })

    # Set cookie (secure flag auto-detected)
    _set_session_cookie(response, session_token, request)


    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

@api_router.put("/auth/profile")
async def update_profile(profile: UserProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/debug")
async def auth_debug():
    """Debug endpoint to check auth configuration."""
    return {
        "supabase_url": os.environ.get("SUPABASE_URL", "NOT SET"),
        "supabase_url_configured": bool(os.environ.get("SUPABASE_URL")),
        "admin_emails": ADMIN_EMAILS,
        "has_mongo": True if client else False,
        "dev_disable_secure_cookie": os.environ.get("DEV_DISABLE_SECURE_COOKIE", "false"),
        "cors_origins": os.environ.get('CORS_ORIGINS', '*').split(','),
    }

@api_router.post("/auth/test-login")
async def test_login(response: Response, request: Request):
    """Simple test endpoint: creates a user and session for testing.
    
    For development only. Removes the OAuth complexity so we can verify
    the session/cookie/navigation flow works.
    """
    test_email = "testuser@example.com"
    existing_user = await db.users.find_one({"email": test_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": test_email,
            "name": "Test User",
            "picture": None,
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        })
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    _set_session_cookie(response, session_token, request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.post("/auth/test-google-login")
async def test_google_login(response: Response, request: Request):
    """Test endpoint for Google OAuth without Supabase verification.
    
    For development only. Creates a user with fake Google data.
    """
    import uuid as uuid_module
    test_email = f"googletest_{uuid_module.uuid4().hex[:8]}@gmail.com"
    existing_user = await db.users.find_one({"email": test_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"user_{uuid_module.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": test_email,
            "name": "Google Test User",
            "picture": "https://lh3.googleusercontent.com/a/default-user",
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        })
    
    session_token = f"session_{uuid_module.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    _set_session_cookie(response, session_token, request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

# Event Routes
@api_router.get("/events")
async def get_events(
    event_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    query: Dict[str, Any] = {"status": "active"}
    
    if event_type:
        query["event_type"] = event_type
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    events = await db.events.find(query, {"_id": 0}).sort("event_date", 1).to_list(100)
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@api_router.post("/events")
async def create_event(event: EventCreate, admin: User = Depends(require_admin)):
    event_id = f"event_{uuid.uuid4().hex[:12]}"
    event_doc = {
        "event_id": event_id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "team_size": event.team_size,
        "event_date": datetime.fromisoformat(event.event_date),
        "deadline": datetime.fromisoformat(event.deadline),
        "status": "active",
        "category": event.category,
        "venue": event.venue,
        "rules": event.rules,
        "organizer_info": event.organizer_info,
        "is_paid": event.is_paid,
        "created_at": datetime.now(timezone.utc)
    }
    await db.events.insert_one(event_doc)
    return await db.events.find_one({"event_id": event_id}, {"_id": 0})

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, event: EventUpdate, admin: User = Depends(require_admin)):
    update_data = {k: v for k, v in event.model_dump().items() if v is not None}
    
    if "event_date" in update_data:
        update_data["event_date"] = datetime.fromisoformat(update_data["event_date"])
    if "deadline" in update_data:
        update_data["deadline"] = datetime.fromisoformat(update_data["deadline"])
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.events.update_one(
        {"event_id": event_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return await db.events.find_one({"event_id": event_id}, {"_id": 0})

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, admin: User = Depends(require_admin)):
    result = await db.events.delete_one({"event_id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Registration Routes
@api_router.post("/registrations")
async def create_registration(
    registration: RegistrationCreate,
    user: User = Depends(get_current_user)
):
    # Check if event exists
    event = await db.events.find_one({"event_id": registration.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = await db.registrations.find_one({
        "event_id": registration.event_id,
        "user_id": user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Create registration
    registration_id = f"reg_{uuid.uuid4().hex[:12]}"
    reg_doc = {
        "registration_id": registration_id,
        "event_id": registration.event_id,
        "user_id": user.user_id,
        "team_name": registration.team_name,
        "team_members": [m.model_dump() for m in registration.team_members] if registration.team_members else None,
        "payment_status": "pending",
        "status": "active",
        "certificate_type": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.registrations.insert_one(reg_doc)
    return await db.registrations.find_one({"registration_id": registration_id}, {"_id": 0})

@api_router.get("/registrations")
async def get_user_registrations(user: User = Depends(get_current_user)):
    registrations = await db.registrations.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Batch fetch events
    event_ids = list(set(r["event_id"] for r in registrations))
    if event_ids:
        events = await db.events.find(
            {"event_id": {"$in": event_ids}},
            {"_id": 0}
        ).to_list(len(event_ids))
        event_map = {e["event_id"]: e for e in events}
        
        for reg in registrations:
            reg["event"] = event_map.get(reg["event_id"])
    
    return registrations

@api_router.put("/registrations/{registration_id}/request-cancellation")
async def request_cancellation(registration_id: str, user: User = Depends(get_current_user)):
    # Check if registration belongs to user
    registration = await db.registrations.find_one({
        "registration_id": registration_id,
        "user_id": user.user_id
    }, {"_id": 0})
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if registration.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Registration already cancelled")
    
    if registration.get("status") == "cancellation_requested":
        raise HTTPException(status_code=400, detail="Cancellation already requested")
    
    # Update status
    await db.registrations.update_one(
        {"registration_id": registration_id},
        {"$set": {"status": "cancellation_requested"}}
    )
    
    return await db.registrations.find_one({"registration_id": registration_id}, {"_id": 0})

# Help Ticket Routes
@api_router.post("/tickets")
async def create_ticket(ticket: HelpTicketCreate, user: User = Depends(get_current_user)):
    ticket_id = f"ticket_{uuid.uuid4().hex[:12]}"
    ticket_doc = {
        "ticket_id": ticket_id,
        "user_id": user.user_id,
        "subject": ticket.subject,
        "message": ticket.message,
        "status": "open",
        "replies": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.help_tickets.insert_one(ticket_doc)
    return await db.help_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})

@api_router.get("/tickets")
async def get_user_tickets(user: User = Depends(get_current_user)):
    tickets = await db.help_tickets.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return tickets

@api_router.get("/admin/tickets")
async def get_all_tickets(admin: User = Depends(require_admin)):
    tickets = await db.help_tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Batch fetch users
    user_ids = list(set(t["user_id"] for t in tickets))
    if user_ids:
        users = await db.users.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 0}
        ).to_list(len(user_ids))
        user_map = {u["user_id"]: u for u in users}
        
        for ticket in tickets:
            ticket["user"] = user_map.get(ticket["user_id"])
    
    return tickets

@api_router.post("/admin/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    reply: HelpTicketReply,
    admin: User = Depends(require_admin)
):
    ticket = await db.help_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    reply_doc = {
        "reply_id": f"reply_{uuid.uuid4().hex[:8]}",
        "user_id": admin.user_id,
        "user_name": admin.name,
        "user_role": admin.role,
        "message": reply.message,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.help_tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"replies": reply_doc},
            "$set": {
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    return await db.help_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})

@api_router.put("/admin/tickets/{ticket_id}/close")
async def close_ticket(ticket_id: str, admin: User = Depends(require_admin)):
    result = await db.help_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await db.help_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})

# Admin Routes
@api_router.get("/admin/analytics")
async def get_analytics(admin: User = Depends(require_admin)):
    total_events = await db.events.count_documents({})
    total_registrations = await db.registrations.count_documents({})
    
    # Today's registrations
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_registrations = await db.registrations.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    # Single vs Team registrations
    all_registrations = await db.registrations.find({}, {"_id": 0}).to_list(1000)
    single_count = sum(1 for r in all_registrations if not r.get("team_name"))
    team_count = len(all_registrations) - single_count
    
    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "today_registrations": today_registrations,
        "single_registrations": single_count,
        "team_registrations": team_count
    }

@api_router.get("/admin/registrations")
async def get_all_registrations(
    admin: User = Depends(require_admin),
    event_id: Optional[str] = None
):
    query = {}
    if event_id:
        query["event_id"] = event_id
    
    registrations = await db.registrations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Batch fetch users and events
    user_ids = list(set(r["user_id"] for r in registrations))
    event_ids = list(set(r["event_id"] for r in registrations))
    
    async def get_users():
        if user_ids:
            return await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
        return []
    
    async def get_events():
        if event_ids:
            return await db.events.find({"event_id": {"$in": event_ids}}, {"_id": 0}).to_list(len(event_ids))
        return []
    
    users, events = await asyncio.gather(get_users(), get_events())
    
    user_map = {u["user_id"]: u for u in users} if users else {}
    event_map = {e["event_id"]: e for e in events} if events else {}
    
    for reg in registrations:
        reg["user"] = user_map.get(reg["user_id"])
        reg["event"] = event_map.get(reg["event_id"])
    
    return registrations

@api_router.get("/admin/registrations/export")
async def export_registrations(
    admin: User = Depends(require_admin),
    event_id: Optional[str] = None
):
    query = {}
    if event_id:
        query["event_id"] = event_id
    
    registrations = await db.registrations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Batch fetch users and events
    user_ids = list(set(r["user_id"] for r in registrations))
    event_ids = list(set(r["event_id"] for r in registrations))
    
    async def get_users():
        if user_ids:
            return await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
        return []
    
    async def get_events():
        if event_ids:
            return await db.events.find({"event_id": {"$in": event_ids}}, {"_id": 0}).to_list(len(event_ids))
        return []
    
    users, events = await asyncio.gather(get_users(), get_events())
    
    user_map = {u["user_id"]: u for u in users} if users else {}
    event_map = {e["event_id"]: e for e in events} if events else {}
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Registrations"
    
    # ===== EXCEL EXPORT WITH LOOKUPS =====
    # Uses user_map and event_map for efficient data retrieval
    # Headers
    headers = [
        "Registration ID", "Event Name", "Team Name", "Participant Name",
        "Email", "Phone", "College", "Date & Time", "Payment Status"
    ]
    ws.append(headers)
    
    # Data
    for reg in registrations:
        event = event_map.get(reg["event_id"])
        user = user_map.get(reg["user_id"])
        
        if reg.get("team_members"):
            # Team registration - one row per member
            for member in reg["team_members"]:
                ws.append([
                    reg["registration_id"],
                    event["title"] if event else "N/A",
                    reg.get("team_name", "N/A"),
                    member["name"],
                    member["email"],
                    member["phone"],
                    member["college"],
                    reg["created_at"].strftime("%Y-%m-%d %H:%M:%S") if isinstance(reg["created_at"], datetime) else str(reg["created_at"]),
                    reg["payment_status"]
                ])
        else:
            # Single registration
            ws.append([
                reg["registration_id"],
                event["title"] if event else "N/A",
                "N/A",
                user["name"] if user else "N/A",
                user["email"] if user else "N/A",
                "N/A",
                "N/A",
                reg["created_at"].strftime("%Y-%m-%d %H:%M:%S") if isinstance(reg["created_at"], datetime) else str(reg["created_at"]),
                reg["payment_status"]
            ])
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=registrations.xlsx"}
    )

# Super Admin Routes
@api_router.get("/superadmin/users")
async def get_all_users(superadmin: User = Depends(require_superadmin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/superadmin/users/{user_id}/block")
async def block_user(user_id: str, superadmin: User = Depends(require_superadmin)):
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_blocked": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Delete all active sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"message": "User blocked successfully"}

@api_router.put("/superadmin/users/{user_id}/unblock")
async def unblock_user(user_id: str, superadmin: User = Depends(require_superadmin)):
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_blocked": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User unblocked successfully"}

@api_router.post("/superadmin/admins")
async def add_admin(admin_data: AdminCreate, superadmin: User = Depends(require_superadmin)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": admin_data.email}, {"_id": 0})
    
    if existing_user:
        # Update role to admin
        await db.users.update_one(
            {"email": admin_data.email},
            {"$set": {"role": "admin"}}
        )
        return await db.users.find_one({"email": admin_data.email}, {"_id": 0})
    else:
        # Create new admin user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_data.email,
            "name": admin_data.name,
            "role": "admin",
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc)
        })
        return await db.users.find_one({"user_id": user_id}, {"_id": 0})

@api_router.delete("/superadmin/admins/{user_id}")
async def remove_admin(user_id: str, superadmin: User = Depends(require_superadmin)):
    # Change role back to user
    result = await db.users.update_one(
        {"user_id": user_id, "role": "admin"},
        {"$set": {"role": "user"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin removed successfully"}

@api_router.put("/superadmin/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any], superadmin: User = Depends(require_superadmin)):
    # Super admin can update any user field
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return await db.users.find_one({"user_id": user_id}, {"_id": 0})

@api_router.delete("/superadmin/users/{user_id}")
async def delete_user(user_id: str, superadmin: User = Depends(require_superadmin)):
    # Delete user sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    # Delete user registrations
    await db.registrations.delete_many({"user_id": user_id})
    # Delete user
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.put("/superadmin/registrations/{registration_id}/cancel")
async def cancel_registration(registration_id: str, superadmin: User = Depends(require_superadmin)):
    result = await db.registrations.update_one(
        {"registration_id": registration_id},
        {"$set": {"status": "cancelled"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return await db.registrations.find_one({"registration_id": registration_id}, {"_id": 0})

@api_router.delete("/superadmin/registrations/{registration_id}")
async def delete_registration(registration_id: str, superadmin: User = Depends(require_superadmin)):
    result = await db.registrations.delete_one({"registration_id": registration_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": "Registration deleted successfully"}

@api_router.put("/superadmin/registrations/{registration_id}/certificate")
async def issue_certificate(
    registration_id: str,
    cert_data: CertificateIssue,
    superadmin: User = Depends(require_superadmin)
):
    result = await db.registrations.update_one(
        {"registration_id": registration_id},
        {"$set": {"certificate_type": cert_data.certificate_type}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return await db.registrations.find_one({"registration_id": registration_id}, {"_id": 0})

@api_router.put("/superadmin/registrations/{registration_id}")
async def update_registration(
    registration_id: str,
    updates: Dict[str, Any],
    superadmin: User = Depends(require_superadmin)
):
    result = await db.registrations.update_one(
        {"registration_id": registration_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return await db.registrations.find_one({"registration_id": registration_id}, {"_id": 0})

# System Configuration Routes
@api_router.get("/config")
async def get_system_config():
    config = await db.system_config.find_one({"config_key": "system_settings"}, {"_id": 0})
    if not config:
        # Return default config
        return {
            "colleges": [],
            "departments": [],
            "popup_enabled": False,
            "popup_type": "instagram",
            "popup_content": {},
            "required_fields": ["name", "email", "phone", "college"],
            "social_links": {
                "instagram": "",
                "facebook": "",
                "whatsapp": "",
                "linkedin": "",
                "twitter": "",
                "youtube": "",
                "website": ""
            },
            "support_email": "",
            "support_phone": "",
            "help_link": "",
            "terms_link": "",
            "privacy_link": "",
            "about_link": "",
            "event_registration_enabled": True,
            "max_team_size": 5,
            "custom_footer_text": ""
        }
    return config.get("config_value", {})

@api_router.put("/superadmin/config")
async def update_system_config(
    config_update: SystemConfigUpdate,
    superadmin: User = Depends(require_superadmin)
):
    existing_config = await db.system_config.find_one({"config_key": "system_settings"}, {"_id": 0})
    
    if existing_config:
        current_value = existing_config.get("config_value", {})
    else:
        current_value = {
            "colleges": [],
            "departments": [],
            "popup_enabled": False,
            "popup_type": "instagram",
            "popup_content": {},
            "required_fields": ["name", "email", "phone", "college"],
            "social_links": {
                "instagram": "",
                "facebook": "",
                "whatsapp": "",
                "linkedin": "",
                "twitter": "",
                "youtube": "",
                "website": ""
            },
            "support_email": "",
            "support_phone": "",
            "help_link": "",
            "terms_link": "",
            "privacy_link": "",
            "about_link": "",
            "event_registration_enabled": True,
            "max_team_size": 5,
            "custom_footer_text": ""
        }
    
    # Update only provided fields
    update_data = config_update.model_dump(exclude_none=True)
    for key, value in update_data.items():
        current_value[key] = value
    
    # Upsert config
    await db.system_config.update_one(
        {"config_key": "system_settings"},
        {
            "$set": {
                "config_value": current_value,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return current_value

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()