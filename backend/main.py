from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.api.routes.auth import router as auth_router
from src.infrastructure.api.routes.admin import router as admin_router
from src.infrastructure.api.routes.admin_settings import router as admin_settings_router
from src.infrastructure.api.routes.pipelines import router as pipelines_router
from src.infrastructure.api.routes.workspaces import router as workspaces_router
from src.infrastructure.api.routes.work_item_routes import router as work_items_router
from src.infrastructure.api.routes.invitations import router as invitations_router
from src.infrastructure.api.routes.teams import router as teams_router
from src.infrastructure.api.routes.leads import router as leads_router
from src.infrastructure.api.routes.analytics import router as analytics_router
from src.infrastructure.database.db import init_db

app = FastAPI(title="CRM API", version="1.0.0")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para rastrear última atividade do usuário
from datetime import datetime
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import UserModel

@app.middleware("http")
async def update_last_activity(request, call_next):
    user_id = request.headers.get("X-User-ID")
    if user_id and user_id.isdigit():
        db = SessionLocal()
        try:
            db.query(UserModel).filter(UserModel.id == int(user_id)).update({"last_activity": datetime.utcnow()})
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
    
    response = await call_next(request)
    return response

# Inicializa o banco de dados
init_db()

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"Erro de Validação 422: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Inclui as rotas
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(admin_settings_router)
app.include_router(pipelines_router)
app.include_router(workspaces_router)
app.include_router(work_items_router)
app.include_router(invitations_router)
app.include_router(teams_router)
app.include_router(leads_router)
app.include_router(analytics_router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao CRM API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

