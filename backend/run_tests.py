import subprocess
import sys
import os

def run_tests():
    """Executa todos os testes do backend usando pytest."""
    print("🚀 Iniciando suíte de testes de integração (SQLite em memória)...")
    
    # Adiciona o diretório atual ao PYTHONPATH para que os pacotes locais sejam encontrados
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.environ["PYTHONPATH"] = f"{current_dir};{os.environ.get('PYTHONPATH', '')}"
    
    # Comando para rodar testes com relatório de sucesso/falha
    command = [
        "pytest",
        "tests/integration",
        "-v",
        "--tb=short"
    ]
    
    try:
        result = subprocess.run(command, check=True)
        print("\n✅ Todos os testes passaram com sucesso!")
        sys.exit(0)
    except subprocess.CalledProcessError:
        print("\n❌ Alguns testes falharam. Verifique o log acima.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
