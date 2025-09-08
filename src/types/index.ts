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
}

export interface Expense {
  id: string;
  fecha: string;
  tipo: 'salario' | 'insumos' | 'otros';
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
}

export interface DatabaseExpense {
  id: string;
  fecha: string;
  tipo: 'salario' | 'insumos' | 'otros';
  concepto: string;
  monto: number;
}
