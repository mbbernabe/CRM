/**
 * Valida formato de E-mail
 */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Valida CPF (Algoritmo oficial)
 */
export const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/[^\d]+/g, '');
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    let rev;
    for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
};

/**
 * Máscara de CPF: 000.000.000-00
 */
export const maskCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

/**
 * Máscara de Telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export const maskPhone = (value) => {
    let r = value.replace(/\D/g, '');
    if (r.length > 11) r = r.substring(0, 11);
    if (r.length > 10) {
        // Celular
        r = r.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (r.length > 5) {
        // Fixo ou parcial celular
        r = r.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (r.length > 2) {
        r = r.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (r.length > 0) {
        r = r.replace(/^(\d{0,2})/, '($1');
    }
    return r;
};

/**
 * Máscara de CEP: 00000-000
 */
export const maskCEP = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

/**
 * Validação básica de CEP
 */
export const validateCEP = (cep) => {
    const cleanCEP = cep.replace(/[^\d]+/g, '');
    return cleanCEP.length === 8;
};
