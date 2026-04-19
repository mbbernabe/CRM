import csv
import os

def generate_sample_data():
    # Carregar os nomes dos campos gerados no passo anterior
    field_names = []
    # Informações Básicas
    field_names.extend(["full_name", "email_primary", "email_secondary", "phone_fixed", "phone_mobile", "whatsapp", "gender", "birth_date", "cpf", "rg"])
    # Endereço
    field_names.extend(["zip_code", "address_street", "address_number", "address_complement", "address_neighborhood", "address_city", "address_state", "address_country", "lat", "lon"])
    # Profissional
    field_names.extend(["company_name", "job_title", "department", "seniority_level", "work_email", "work_phone", "hire_date", "expected_salary", "company_website", "industry"])
    # Redes Sociais
    field_names.extend(["linkedin_url", "twitter_handle", "instagram_handle", "facebook_url", "tiktok_handle", "youtube_channel", "github_username", "skype_id", "telegram_username", "personal_website"])
    # Vendas
    field_names.extend(["lead_source", "lead_temp", "lead_score", "origin_campaign", "signup_date", "newsletter_sub", "primary_interest", "estimated_budget", "purchase_frequency", "active_coupon"])
    
    # Extras
    for i in range(1, 101):
        field_names.append(f"extra_field_{i}")

    data = []
    # Gerar 5 contatos de exemplo
    for i in range(1, 6):
        row = {}
        for name in field_names:
            if "email" in name: row[name] = f"contato{i}@exemplo.com"
            elif "phone" in name or "whatsapp" in name: row[name] = f"+551199999000{i}"
            elif "date" in name: row[name] = "2024-04-19"
            elif "currency" in name or "salary" in name or "budget" in name: row[name] = 5000 + i*100
            elif "number" in name or "score" in name: row[name] = i * 10
            elif "boolean" in name: row[name] = "True" if i % 2 == 0 else "False"
            else: row[name] = f"Valor Exemplo {i} para {name}"
        
        # Ajustes manuais para campos específicos
        row["full_name"] = f"Usuário de Teste {i}"
        row["zip_code"] = "01001-000"
        row["cpf"] = f"123.456.789-0{i}"
        data.append(row)

    output_path = "dados_contatos_150_campos.csv"
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=field_names)
        writer.writeheader()
        writer.writerows(data)
    
    return output_path

if __name__ == "__main__":
    path = generate_sample_data()
    print(f"Planilha de dados gerada: {os.path.abspath(path)}")
