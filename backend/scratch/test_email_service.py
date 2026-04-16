import sys
import os

# Adiciona o diretório backend ao path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from src.infrastructure.services.email_service import EmailService
import inspect

def test_signature():
    service = EmailService({})
    spec = inspect.getfullargspec(service.send_invitation_email)
    print(f"Args: {spec.args}")
    print(f"Defaults: {spec.defaults}")
    
    if "custom_message" in spec.args:
        print("SUCCESS: custom_message found in arguments.")
    else:
        print("FAILURE: custom_message NOT found in arguments.")

if __name__ == "__main__":
    test_signature()
