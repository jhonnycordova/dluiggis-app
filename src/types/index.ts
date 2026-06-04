export interface Order {
  id: string;
  fecha: string;
  plataforma: 'uber' | 'pedidosya' | 'whatsapp';
  referencia?: string;
  monto: number;
  comision?: number;
  monto_neto?: number;
  metodo_pago?: string;
  persona_entrega?: string;
  tipo_tarjeta?: 'debito' | 'credito';
  pagado_efectivo?: boolean;
}

export interface Expense {
  id: string;
  fecha: string;
  tipo: 'salario' | 'insumos' | 'otros' | 'gastos_personales';
  concepto: string;
  monto: number;
}

export interface DatabaseOrder {
  id: string;
  fecha: string;
  plataforma: 'uber' | 'pedidosya' | 'whatsapp';
  referencia?: string;
  monto: number;
  comision?: number;
  monto_neto?: number;
  metodo_pago?: string;
  persona_entrega?: string;
  tipo_tarjeta?: 'debito' | 'credito';
  pagado_efectivo?: boolean;
}

export interface DatabaseExpense {
  id: string;
  fecha: string;
  tipo: 'salario' | 'insumos' | 'otros' | 'gastos_personales';
  concepto: string;
  monto: number;
}

export interface WeeklyComment {
  id: string;
  plataforma: 'uber' | 'pedidosya' | 'whatsapp' | 'transbank';
  semana_inicio: string;
  comentario: string;
}
