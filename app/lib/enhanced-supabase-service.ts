import { createClient } from "@/lib/supabase/client"
import { Product } from "@/lib/types"

export const supabase = createClient()

// Product operations
export const productService = {
  /**
   * Get active products (with basic auth check)
   * @returns {Promise<Product[]>}
   */
  async getProducts(): Promise<Product[]> {
    // Verificación opcional para GET - puedes comentar si no la necesitas
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.warn("Usuario no autenticado para obtener productos")
    }

    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("name")

    if (error) throw error
    return data || []
  },

  /**
   * Get all products (with basic auth check)
   * @returns {Promise<Product[]>}
   */
  async getAllProducts() {
    // Verificación opcional para GET - puedes comentar si no la necesitas
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.warn("Usuario no autenticado para obtener todos los productos")
    }

    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) throw error
    return data || []
  },

  /**
   * Create a new product with authentication verification
   * @param {Omit<Product, 'id' | 'created_at' | 'updated_at'>} product
   * @returns {Promise<Product>}
   */
  async createProduct(product: { [s: string]: unknown } | ArrayLike<unknown>): Promise<Product> {
    console.log("=== CREATE PRODUCT DEBUG ===")
    console.log("Product data:", product)

    try {
      // Step 1: Verify user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Authentication error:", authError)
        throw authError
      }

      if (!user) {
        console.error("User not authenticated")
        throw new Error("Debes iniciar sesión para crear productos")
      }

      console.log("Authenticated user:", user.email, user.id)

      // Step 2: Clean the product object
      const cleanProduct = Object.fromEntries(
        Object.entries(product).filter(([_, value]) => value !== undefined && value !== null && value !== ""),
      )

      console.log("Clean product data:", cleanProduct)

      // Step 3: Create the product
      const { data, error } = await supabase.from("products").insert([cleanProduct]).select().single()

      if (error) {
        console.error("Insert error:", error)
        throw error
      }

      console.log("Product created successfully:", data)
      return data
    } catch (error) {
      console.error("Create product error:", error)
      throw error
    }
  },

  /**
   * Update a product with comprehensive debugging
   * @param {string} id
   * @param {Partial<Product>} updates
   * @returns {Promise<Product>}
   */
  async updateProduct(id: any, updates: ArrayLike<unknown> | { [s: string]: unknown }): Promise<Product> {
    console.log("=== UPDATE PRODUCT DEBUG ===")
    console.log("Product ID:", id)
    console.log("Updates:", updates)

    try {
      // Step 1: Check if product exists and get current user
      const [productResult, userResult] = await Promise.all([
        supabase.from("products").select("*").eq("id", id),
        supabase.auth.getUser(),
      ])

      console.log("Product query result:", productResult)
      console.log("Current user:", userResult.data?.user?.id)

      if (productResult.error) {
        console.error("Error fetching product:", productResult.error)
        throw productResult.error
      }

      if (!productResult.data || productResult.data.length === 0) {
        throw new Error(`Product with ID ${id} not found`)
      }

      console.log("Existing product:", productResult.data[0])

      // Step 2: Clean the updates object
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null),
      )

      console.log("Clean updates:", cleanUpdates)

      // Step 3: Try update without .single() first
      const { data: updateData, error: updateError } = await supabase
        .from("products")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()

      console.log("Update result:", { data: updateData, error: updateError })

      if (updateError) {
        console.error("Update failed:", updateError)
        throw updateError
      }

      if (!updateData || updateData.length === 0) {
        // This is likely an RLS policy issue
        console.error("Update succeeded but returned 0 rows - likely RLS policy issue")
        throw new Error(
          "Update failed: No rows returned. This is usually due to Row Level Security policies restricting access.",
        )
      }

      return updateData[0]
    } catch (error) {
      console.error("Full error details:", error)
      throw error
    }
  },

  /**
   * Alternative update method without .single() for debugging
   * @param {string} id
   * @param {Partial<Product>} updates
   * @returns {Promise<Product[]>}
   */
  async updateProductSafe(id: any, updates: ArrayLike<unknown> | { [s: string]: unknown }): Promise<Product[]> {
    console.log("Updating product with ID:", id)
    console.log("Updates:", updates)

    // Clean the updates object - remove undefined values
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))

    // Perform the update without .single()
    const { data, error } = await supabase
      .from("products")
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Update error:", error)
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error(`No product found with ID: ${id}`)
    }

    return data[0] // Return the first (and should be only) updated record
  },

  /**
   * Delete a product with authentication verification
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteProduct(id: any): Promise<void> {
    console.log("=== DELETE PRODUCT DEBUG ===")
    console.log("Product ID to delete:", id)

    try {
      // Step 1: Verify user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Authentication error:", authError)
        throw authError
      }

      if (!user) {
        console.error("User not authenticated")
        throw new Error("Debes iniciar sesión para eliminar productos")
      }

      console.log("Authenticated user:", user.email, user.id)

      // Step 2: Check if product exists before deleting
      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("Product not found:", fetchError)
        throw new Error(`Producto con ID ${id} no encontrado`)
      }

      console.log("Product to delete:", existingProduct)

      // Step 3: Delete the product
      const { error: deleteError } = await supabase.from("products").delete().eq("id", id)

      if (deleteError) {
        console.error("Delete error:", deleteError)
        throw deleteError
      }

      console.log("Product deleted successfully")
    } catch (error) {
      console.error("Delete product error:", error)
      throw error
    }
  },
}

// Auth operations
export const authService = {
  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   */
  async signIn(email: any, password: any) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log(data)

    if (error) throw error
    return data
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },
}
