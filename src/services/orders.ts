import { supabase } from '@/lib/supabase'
import { DatabaseOrder, Order } from '@/types'

export const ordersService = {
  async create(order: Omit<DatabaseOrder, 'id'>): Promise<Order> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([order])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByDate(date: string): Promise<Order[]> {
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('fecha', startDate.toISOString())
      .lte('fecha', endDate.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByMonth(year: number, month: number): Promise<Order[]> {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('fecha', startDate.toISOString())
      .lte('fecha', endDate.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  }
}
