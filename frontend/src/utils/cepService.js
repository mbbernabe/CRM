/**
 * Serviço para consulta de endereços via API do ViaCEP
 */
export const fetchAddressFromCEP = async (cep) => {
    // Remove tudo que não for dígito
    const cleanCEP = cep.replace(/\D/g, '');
    
    // ViaCEP exige exatamente 8 dígitos numéricos
    if (cleanCEP.length !== 8) {
        return null;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        if (!response.ok) {
            throw new Error('Erro na consulta do CEP');
        }
        
        const data = await response.json();
        
        if (data.erro) {
            return null; // CEP não encontrado
        }

        return data; // { cep, logradouro, complemento, bairro, localidade, uf, ibge, gia, ddd, siafi }
    } catch (error) {
        console.error("ViaCEP Fetch Error:", error);
        return null;
    }
};
