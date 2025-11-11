import { createClient } from './supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Servicio de autenticación para Cinalli Racing Team
 * Maneja todas las operaciones de autenticación con Supabase
 */
export class AuthService {
  private static getClient() {
    return createClient()
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(email: string, password: string): Promise<{ data: any | null; error: unknown }> {
    console.log('=== SIGN IN DEBUG ===')
    console.log('Email:', email)

    try {
      const supabase = this.getClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { data: null, error: this.mapAuthError(error) }
      }

      console.log('Sign in successful:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign in exception:', error)
      return { data: null, error: 'Error de conexión. Verifica tu conexión a internet.' }
    }
  }

  /**
   * Cerrar sesión del usuario actual
   */
  static async signOut(): Promise<{ success: boolean; error: unknown }> {
    console.log('=== SIGN OUT DEBUG ===')

    try {
      const supabase = this.getClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        return { success: false, error }
      }

      console.log('Sign out successful')
      return { success: true, error: null }
    } catch (error) {
      console.error('Sign out exception:', error)
      return { success: false, error }
    }
  }

  /**
   * Obtener el usuario autenticado actual
   */
  static async getCurrentUser(): Promise<{ data: User | null; error: unknown }> {
    try {
      const supabase = this.getClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Get user error:', error)
        return { data: null, error }
      }

      return { data: user, error: null }
    } catch (error) {
      console.error('Get user exception:', error)
      return { data: null, error }
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: user } = await this.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }

  /**
   * Obtener la sesión actual
   */
  static async getSession() {
    try {
      const supabase = this.getClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Get session error:', error)
        return { data: null, error }
      }

      return { data: session, error: null }
    } catch (error) {
      console.error('Get session exception:', error)
      return { data: null, error }
    }
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = this.getClient()
    return supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Mapear errores de autenticación a mensajes amigables
   */
  private static mapAuthError(error: { message?: string }): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Email o contraseña incorrectos'
      case 'Email not confirmed':
        return 'Debes confirmar tu email antes de iniciar sesión'
      case 'Too many requests':
        return 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente'
      case 'User not found':
        return 'No existe una cuenta con este email'
      default:
        return error.message || 'Error al iniciar sesión'
    }
  }
}