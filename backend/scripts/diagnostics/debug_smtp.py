import smtplib
import ssl
import sys
import os

# Configurações fornecidas pelo usuário
smtp_settings = {
    "smtp_host": "smtp.titan.email",
    "smtp_port": 465,
    "smtp_user": "no-reply@asamorim.com.br",
    "smtp_password": "Noreply#2026",
    "smtp_from": "no-reply@asamorim.com.br",
    "smtp_security": "SSL"
}

host = smtp_settings["smtp_host"]
port = smtp_settings["smtp_port"]
user = smtp_settings["smtp_user"]
password = smtp_settings["smtp_password"]
from_email = smtp_settings["smtp_from"]
to_email = "contato@asamorim.com.br"
timeout = 20

print("--- DIAGNÓSTICO PROFUNDO SMTP ---")
print(f"Alvo: {user} -> {to_email} via {host}:{port}")

try:
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    print("Iniciando SMTP_SSL...")
    server = smtplib.SMTP_SSL(host, port, context=context, timeout=timeout)
    server.set_debuglevel(1) # Habilita log detalhado no stdout
    
    print("Tentando login...")
    server.login(user, password)
    print("Login OK!")
    
    print("Enviando e-mail de teste...")
    msg = f"Subject: Teste CRM\n\nEste e um teste de conexao SMTP."
    server.sendmail(from_email, to_email, msg)
    print("Envio concluído!")
    
    server.quit()
    print("--- SUCESSO TOTAL ---")
except Exception as e:
    print(f"--- FALHA ---")
    print(f"Erro: {str(e)}")
    import traceback
    traceback.print_exc()
