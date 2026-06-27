import { supabase } from './supabase'

export async function getCenters() {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCenterById(id: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*, inventory_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getInventory(centerId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('center_id', centerId)
  if (error) throw error
  return data
}

export async function getActivityLog() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}
