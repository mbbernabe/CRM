import smtplib
import ssl
import sys

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
security = smtp_settings["smtp_security"]
timeout = 15

print(f"--- Iniciando Teste de SMTP ---")
print(f"Host: {host}")
print(f"Porta: {port}")
print(f"Segurança: {security}")
print(f"Usuário: {user}")

try:
    context = ssl.create_default_context()
    # Descomente a linha abaixo se houver erro de certificado SSL no Windows
    # context.check_hostname = False
    # context.verify_mode = ssl.CERT_NONE

    if security == "SSL":
        print("Tentando conexão SMTP_SSL...")
        with smtplib.SMTP_SSL(host, port, context=context, timeout=timeout) as server:
            print("Conectado! Tentando login...")
            server.login(user, password)
            print("Login bem-sucedido!")
    else:
        print(f"Tentando conexão SMTP (Modo {security})...")
        with smtplib.SMTP(host, port, timeout=timeout) as server:
            if security == "STARTTLS":
                server.starttls(context=context)
            print("Conectado! Tentando login...")
            server.login(user, password)
            print("Login bem-sucedido!")
            
    print("--- Teste Concluído com SUCESSO ---")
except Exception as e:
    print(f"--- ERRO NO TESTE ---")
    print(f"Tipo do Erro: {type(e).__name__}")
    print(f"Mensagem: {str(e)}")
    import traceback
    traceback.print_exc()
