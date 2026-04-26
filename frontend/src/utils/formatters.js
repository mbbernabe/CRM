/**
 * Utilitários para formatação e máscaras de entrada (RF007)
 */

export const maskCPF = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 primeiros dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 segundos dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen após os 3 terceiros dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Limita o tamanho
  };
  
  export const maskCNPJ = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{2})(\d)/, '$1.$2') // Coloca ponto após os 2 primeiros dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 dígitos
      .replace(/(\d{3})(\d)/, '$1/$2') // Coloca barra após os 3 dígitos
      .replace(/(\d{4})(\d{1,2})/, '$1-$2') // Coloca hífen após os 4 dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Limita o tamanho
  };
  
  export const maskPhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 10) {
      // (00) 0000-0000
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    } else {
      // (00) 00000-0000
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
  };
  
  export const maskCEP = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };
  
  export const maskCurrency = (value) => {
    if (!value && value !== 0) return '';
    
    // Se for string, limpa e converte pra número
    let cleanValue = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString().replace(/\D/g, '');
    
    if (!cleanValue) return 'R$ 0,00';
    
    const amount = (parseFloat(cleanValue) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  export const unmask = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };
  
  export const formatters = {
    cpf: maskCPF,
    cnpj: maskCNPJ,
    phone: maskPhone,
    cep: maskCEP,
    currency: maskCurrency
  };
