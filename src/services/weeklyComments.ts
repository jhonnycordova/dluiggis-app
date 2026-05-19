import { supabase } from '@/lib/supabase'
import { WeeklyComment } from '@/types'

type Platform = 'uber' | 'pedidosya' | 'whatsapp'

export const weeklyCommentsService = {
  async getByRange(
    plataforma: Platform,
    firstWeekStart: string,
    lastWeekStart: string
  ): Promise<WeeklyComment[]> {
    const { data, error } = await supabase
      .from('comentarios_semanales')
      .select('*')
      .eq('plataforma', plataforma)
      .gte('semana_inicio', firstWeekStart)
      .lte('semana_inicio', lastWeekStart)

    if (error) throw error
    return data || []
  },

  async upsert(
    plataforma: Platform,
    semana_inicio: string,
    comentario: string
  ): Promise<WeeklyComment> {
    const { data, error } = await supabase
      .from('comentarios_semanales')
      .upsert(
        {
          plataforma,
          semana_inicio,
          comentario,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'plataforma,semana_inicio' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(plataforma: Platform, semana_inicio: string): Promise<void> {
    const { error } = await supabase
      .from('comentarios_semanales')
      .delete()
      .eq('plataforma', plataforma)
      .eq('semana_inicio', semana_inicio)

    if (error) throw error
  }
}
