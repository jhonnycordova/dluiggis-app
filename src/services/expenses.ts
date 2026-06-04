import { supabase } from '@/lib/supabase'
import { DatabaseExpense, Expense } from '@/types'

export const expensesService = {
  async create(expense: Omit<DatabaseExpense, 'id'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('gastos')
      .insert([expense])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByMonth(year: number, month: number): Promise<Expense[]> {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', startDate.toISOString())
      .lte('fecha', endDate.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByDate(date: string): Promise<Expense[]> {
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59.999')

    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', startDate.toISOString())
      .lte('fecha', endDate.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  async update(id: string, data: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
    const { data: updated, error } = await supabase
      .from('gastos')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
