/**
 * Gera um código único para chat baseado no nome do usuário
 * Formato: Iniciais + # + Ano atual
 * Exemplo: Gabriel Bruno -> GB#2024
 */
export function generateChatCode(name: string): string {
  // Remove acentos e caracteres especiais
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  // Extrai as iniciais (primeira letra de cada palavra)
  const words = cleanName.split(' ').filter(word => word.length > 0);
  const initials = words.map(word => word.charAt(0)).join('');
  
  // Pega o ano atual
  const currentYear = new Date().getFullYear();
  
  // Retorna o código no formato: INICIAIS#ANO
  return `${initials}#${currentYear}`;
}

/**
 * Valida se um código de chat tem o formato correto
 * Formato esperado: 2-4 letras + # + 4 dígitos
 */
export function isValidChatCode(code: string): boolean {
  const codeRegex = /^[A-Z]{2,4}#\d{4}$/;
  return codeRegex.test(code);
}

/**
 * Gera um código único verificando se já existe no banco
 */
export async function generateUniqueChatCode(name: string, prisma: any): Promise<string> {
  let baseCode = generateChatCode(name);
  let finalCode = baseCode;
  let counter = 1;
  
  // Verifica se o código já existe
  while (await prisma.user.findFirst({ where: { chatCode: finalCode } })) {
    finalCode = `${baseCode.split('#')[0]}${counter}#${baseCode.split('#')[1]}`;
    counter++;
  }
  
  return finalCode;
} 