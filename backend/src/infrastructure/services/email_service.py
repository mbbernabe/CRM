import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional
from src.infrastructure.utils.logger import get_logger, log_exception

logger = get_logger(__name__)

class EmailService:
    def __init__(self, smtp_settings: Dict[str, str]):
        self.host = smtp_settings.get("smtp_host", "").strip()
        self.port = int(smtp_settings.get("smtp_port", 587))
        self.user = smtp_settings.get("smtp_user", "").strip()
        self.password = smtp_settings.get("smtp_password", "").strip()
        self.from_email = smtp_settings.get("smtp_from", "").strip()
        
        # Modo de segurança: 'NONE', 'STARTTLS', 'SSL'
        # Legado: Mapeia smtp_use_tls='True' para 'STARTTLS' se não houver smtp_security
        self.security = smtp_settings.get("smtp_security", "STARTTLS").upper()
        
        # Mapeamento de legado caso smtp_security não exista ainda no banco
        if "smtp_security" not in smtp_settings:
            use_tls = smtp_settings.get("smtp_use_tls", "True").lower() == "true"
            self.security = "STARTTLS" if use_tls else "NONE"
            
        # Forçar SSL se a porta for 465 por padrão (comum em SMTP)
        if self.port == 465 and self.security != "NONE":
            self.security = "SSL"

        self.timeout = 15 # segundos para evitar hangs infinitos

    def send_reset_password_email(self, to_email: str, reset_link: str) -> bool:
        if not self.host or not self.user or not self.password:
            logger.warning("Configurações de SMTP incompletas para envio.")
            return False

        subject = "Recuperação de Senha - CRM"
        body = f"""
        <html>
            <body style="font-family: sans-serif; color: #2d3e50; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaf0f6; border-radius: 8px;">
                    <h2 style="color: #0091ae; margin-top: 0;">Recuperação de Senha</h2>
                    <p>Olá,</p>
                    <p>Você solicitou a redefinição de sua senha no sistema CRM.</p>
                    <p>Clique no botão abaixo para cadastrar uma nova senha (este link é válido por 60 minutos):</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #0091ae; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                            Redefinir Senha
                        </a>
                    </div>
                    <p style="font-size: 13px; color: #516f90;">Se o botão acima não funcionar, copie e cole o link no seu navegador:</p>
                    <p style="font-size: 11px; word-break: break-all; color: #809fb8;">{reset_link}</p>
                    <hr style="border: 0; border-top: 1px solid #eaf0f6; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #809fb8;">Se você não solicitou esta alteração, ignore este e-mail.</p>
                </div>
            </body>
        </html>
        """
        
        msg = MIMEText(body, 'html')
        msg['From'] = self.from_email or self.user
        msg['To'] = to_email
        msg['Subject'] = subject

        try:
            # Criar contexto SSL (Ajustado para maior compatibilidade com servidores empresariais)
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE # Permite certificados com erros de CA ou expiração para SMTP

            if self.security == "SSL":
                # Conexão segura desde o início (Porta 465)
                with smtplib.SMTP_SSL(self.host, self.port, context=context, timeout=self.timeout) as server:
                    server.login(self.user, self.password)
                    server.send_message(msg)
            else:
                # Conexão padrão ou STARTTLS (Porta 587 ou 25)
                with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as server:
                    if self.security == "STARTTLS":
                        server.starttls(context=context)
                    
                    if self.user and self.password:
                        server.login(self.user, self.password)
                    
                    server.send_message(msg)
            
            logger.info(f"E-mail de recuperação enviado com sucesso para {to_email}")
            return True
        except Exception as e:
            log_exception(logger, e, f"send_reset_password_email ({self.security})")
            return False
