export const CATEGORY_LABEL: Record<string, string> = {
  ABANDONO: "Abandono",
  AGRESSAO: "Agressão",
  NEGLIGENCIA: "Negligência",
  FALTA_DE_AGUA: "Falta de água",
  FALTA_DE_ALIMENTO: "Falta de alimento",
  CONFINAMENTO_INADEQUADO: "Confinamento inadequado",
  ANIMAL_FERIDO: "Animal ferido",
  ATROPELAMENTO: "Atropelamento",
  SITUACAO_DE_RISCO: "Situação de risco",
  CRIACAO_IRREGULAR: "Criação irregular",
  ACUMULACAO: "Acumulação",
  ANIMAL_PRESO: "Animal preso",
  AUSENCIA_DE_ATENDIMENTO_VETERINARIO: "Sem atendimento veterinário",
  DESCARTE_IRREGULAR_DE_CARCACAS: "Descarte irregular de carcaças",
  OUTROS: "Outros",
};

export const URGENCY_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  MODERADA: "Moderada",
  ALTA: "Alta",
  URGENTE: "Urgente",
  CRITICA: "Crítica",
};

export const SPECIES_LABEL: Record<string, string> = {
  CACAO: "Cão",
  GATO: "Gato",
  EQUINO: "Equino",
  BOVINO: "Bovino",
  CAPRINO: "Caprino",
  OVINO: "Ovino",
  AVE: "Ave",
  ROEDOR: "Roedor",
  PEIXE: "Peixe",
  REPTIL: "Réptil",
  OUTRO: "Outro",
};

export const STATUS_LABEL: Record<string, string> = {
  RECEBIDA: "Recebida",
  AGUARDANDO_TRIAGEM: "Aguardando triagem",
  EM_TRIAGEM: "Em triagem",
  SOLICITANDO_INFORMACOES: "Solicitando informações",
  VALIDADA: "Validada",
  ENCAMINHADA: "Encaminhada",
  EM_ATENDIMENTO: "Em atendimento",
  EM_FISCALIZACAO: "Em fiscalização",
  EM_INVESTIGACAO: "Em investigação",
  AGUARDANDO_ORGAO_RESPONSAVEL: "Aguardando órgão responsável",
  ATENDIDA: "Atendida",
  PROCEDENTE: "Procedente",
  IMPROCEDENTE: "Improcedente",
  ARQUIVADA: "Arquivada",
  REABERTA: "Reaberta",
  FINALIZADA: "Finalizada",
};

export const URGENCY_STYLE: Record<string, string> = {
  BAIXA: "bg-neutro-100 text-neutro-700",
  MODERADA: "bg-amarelo/15 text-amber-800",
  ALTA: "bg-orange-100 text-orange-800",
  URGENTE: "bg-vermelho/15 text-red-800",
  CRITICA: "bg-red-800 text-white",
};

export const STATUS_STYLE: Record<string, string> = {
  RECEBIDA: "bg-azul-claro text-blue-900",
  AGUARDANDO_TRIAGEM: "bg-azul-claro text-blue-900",
  EM_TRIAGEM: "bg-azul-claro text-blue-900",
  SOLICITANDO_INFORMACOES: "bg-amarelo/20 text-amber-900",
  VALIDADA: "bg-verde-100 text-verde-900",
  ENCAMINHADA: "bg-verde-100 text-verde-900",
  EM_ATENDIMENTO: "bg-verde-100 text-verde-900",
  EM_FISCALIZACAO: "bg-verde-100 text-verde-900",
  EM_INVESTIGACAO: "bg-verde-100 text-verde-900",
  AGUARDANDO_ORGAO_RESPONSAVEL: "bg-amarelo/20 text-amber-900",
  ATENDIDA: "bg-verde-100 text-verde-900",
  PROCEDENTE: "bg-verde-700 text-white",
  IMPROCEDENTE: "bg-neutro-100 text-neutro-700",
  ARQUIVADA: "bg-neutro-100 text-neutro-700",
  REABERTA: "bg-orange-100 text-orange-900",
  FINALIZADA: "bg-neutro-200 text-neutro-900",
};