// Função auxiliar para obter a data real da despesa fixa no mês/ano especificado
function getDataRealDespesaFixa(ano, mes, diaVencimento) {
    const anoInt = parseInt(ano);
    const mesInt = parseInt(mes) - 1; // Janeiro é 0 em JavaScript
    let diaVencimentoInt = parseInt(diaVencimento);
    
    // Verificar o último dia do mês para evitar problemas com meses diferentes
    const ultimoDiaMes = new Date(anoInt, mesInt + 1, 0).getDate();
    if (diaVencimentoInt > ultimoDiaMes) {
        diaVencimentoInt = ultimoDiaMes; // Usar o último dia do mês se o dia for inválido
    }
    
    const dataCalculada = new Date(anoInt, mesInt, diaVencimentoInt);
    return dataCalculada.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
}

module.exports = {
    getDataRealDespesaFixa
};