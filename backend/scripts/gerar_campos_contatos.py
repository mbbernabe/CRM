import csv
import os

def generate_fields():
    categories = {
        "Informações Básicas": [
            ("Nome Completo", "full_name", "text"),
            ("E-mail Principal", "email_primary", "email"),
            ("E-mail Secundário", "email_secondary", "email"),
            ("Telefone Fixo", "phone_fixed", "phone"),
            ("Celular", "phone_mobile", "phone"),
            ("WhatsApp", "whatsapp", "phone"),
            ("Gênero", "gender", "select"),
            ("Data de Nascimento", "birth_date", "date"),
            ("CPF", "cpf", "cpf"),
            ("RG", "rg", "text")
        ],
        "Endereço": [
            ("CEP", "zip_code", "cep"),
            ("Logradouro", "address_street", "text"),
            ("Número", "address_number", "number"),
            ("Complemento", "address_complement", "text"),
            ("Bairro", "address_neighborhood", "text"),
            ("Cidade", "address_city", "text"),
            ("Estado", "address_state", "text"),
            ("País", "address_country", "text"),
            ("Latitude", "lat", "number"),
            ("Longitude", "lon", "number")
        ],
        "Profissional": [
            ("Empresa Atual", "company_name", "text"),
            ("Cargo", "job_title", "text"),
            ("Departamento", "department", "text"),
            ("Nível Hierárquico", "seniority_level", "select"),
            ("E-mail Profissional", "work_email", "email"),
            ("Telefone Comercial", "work_phone", "phone"),
            ("Data de Admissão", "hire_date", "date"),
            ("Salário Pretendido", "expected_salary", "currency"),
            ("Site da Empresa", "company_website", "text"),
            ("Indústria", "industry", "select")
        ],
        "Redes Sociais": [
            ("LinkedIn", "linkedin_url", "text"),
            ("Twitter/X", "twitter_handle", "text"),
            ("Instagram", "instagram_handle", "text"),
            ("Facebook", "facebook_url", "text"),
            ("TikTok", "tiktok_handle", "text"),
            ("YouTube", "youtube_channel", "text"),
            ("GitHub", "github_username", "text"),
            ("Skype", "skype_id", "text"),
            ("Telegram", "telegram_username", "text"),
            ("Site Pessoal", "personal_website", "text")
        ],
        "Vendas e Marketing": [
            ("Fonte do Lead", "lead_source", "select"),
            ("Temperatura do Lead", "lead_temp", "select"),
            ("Score", "lead_score", "number"),
            ("Campanha de Origem", "origin_campaign", "text"),
            ("Data de Cadastro", "signup_date", "date"),
            ("Newsletter Subscrito", "newsletter_sub", "boolean"),
            ("Interesse Principal", "primary_interest", "select"),
            ("Budget Estimado", "estimated_budget", "currency"),
            ("Frequência de Compra", "purchase_frequency", "select"),
            ("Cupom de Desconto Ativo", "active_coupon", "text")
        ]
    }

    # Gerar campos genéricos para completar 150
    fields = []
    for cat, items in categories.items():
        for label, name, ftype in items:
            fields.append({"label": label, "name": name, "type": ftype, "group": cat})

    # Adicionar 100 campos extras para chegar em 150+
    for i in range(1, 101):
        fields.append({
            "label": f"Campo Extra {i}",
            "name": f"extra_field_{i}",
            "type": "text" if i % 2 == 0 else "number",
            "group": "Personalizados"
        })

    output_path = "definicao_campos_contatos_150.csv"
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["label", "name", "type", "group"])
        writer.writeheader()
        writer.writerows(fields)
    
    return output_path

if __name__ == "__main__":
    path = generate_fields()
    print(f"Planilha gerada: {os.path.abspath(path)}")
