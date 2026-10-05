from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.services.llm_provider import provider_options, public_config
from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.schemas.chat import ChatRequest
from backend.app.services.chat_service import chat

router = APIRouter(prefix='/api/chat', tags=['Ask GrowthSync'])


@router.post('')
def ask_growthsync(payload: ChatRequest, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers['Cache-Control'] = 'no-store'
    try:
        return chat(db, user.id, payload, **provider_options(settings))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get('/config')
def chat_config(response: Response, user: User = Depends(get_current_user)):
    response.headers['Cache-Control'] = 'no-store'
    return public_config(settings)
