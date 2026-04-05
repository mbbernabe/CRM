from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.api.routes.contacts import router as contacts_router
from src.infrastructure.api.routes.properties import router as properties_router
from src.infrastructure.api.routes.companies import router as companies_router
from src.infrastructure.api.routes.auth import router as auth_router
from src.infrastructure.api.routes.admin import router as admin_router
from src.infrastructure.api.routes.admin_settings import router as admin_settings_router
from src.infrastructure.api.routes.pipelines import router as pipelines_router
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

# Inicializa o banco de dados
init_db()

# Inclui as rotas
app.include_router(contacts_router)
app.include_router(properties_router)
app.include_router(companies_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(admin_settings_router)
app.include_router(pipelines_router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao CRM API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

