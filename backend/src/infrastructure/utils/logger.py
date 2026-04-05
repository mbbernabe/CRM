import logging
import os
from datetime import datetime

# Garantir que a pasta de logs existe
LOG_DIR = os.path.join(os.getcwd(), "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "app.log")

# Configuração básica do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

def get_logger(name):
    return logging.getLogger(name)

def log_exception(logger, e, context=""):
    """Loga uma exceção com detalhes e stack trace no arquivo."""
    msg = f"EXCEÇÃO EM {context}: {str(e)}"
    logger.exception(msg)
