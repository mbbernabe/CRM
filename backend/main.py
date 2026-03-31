from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.api.routes.contacts import router as contacts_router
from src.infrastructure.database.db import init_db

app = FastAPI(title="CRM API", version="1.0.0")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Especificando a URL exata do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa o banco de dados (Cria tabelas se não existirem)
init_db()

# Inclui as rotas
app.include_router(contacts_router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao CRM API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
