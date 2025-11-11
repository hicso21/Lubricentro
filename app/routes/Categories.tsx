import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductService } from "@/lib/product-service";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string }>({
    name: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await ProductService.getAllCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await ProductService.createCategory({
        name: newCategoryName,
      });
      toast({ title: "Categoría agregada", description: newCategoryName });
      setNewCategoryName("");
      loadCategories();
    } catch (error) {
      console.error("Error creando categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await ProductService.deleteCategory(id);
      toast({ title: "Categoría eliminada" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditValues({ name: category.name });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await ProductService.updateCategory(id, editValues);
      toast({ title: "Categoría actualizada" });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error("Error actualizando categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Categorías
          </h2>
          <p className="text-muted-foreground">
            Gestión de categorías de productos
          </p>
        </div>
      </div>

      {/* Formulario para agregar categoría */}
      <Card className="racing-shadow mt-6">
        <CardHeader>
          <CardTitle>Nueva Categoría</CardTitle>
          <CardDescription>Agregá una categoría al inventario</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nombre"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button
            className="cursor-pointer"
            onClick={handleAddCategory}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </CardContent>
      </Card>

      {/* Listado de categorías */}
      <Card className="racing-shadow mt-6">
        <CardHeader>
          <CardTitle>Listado de Categorías</CardTitle>
          <CardDescription>
            Editá o eliminá categorías existentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              {editingCategory === category.id ? (
                <div className="flex flex-1 gap-2">
                  <Input
                    value={editValues.name}
                    onChange={(e) =>
                      setEditValues({ ...editValues, name: e.target.value })
                    }
                    onKeyUp={(e) =>
                      e.key === "Enter" && handleSaveEdit(category.id)
                    }
                  />
                </div>
              ) : (
                <div>
                  <div className="font-medium">{category.name}</div>
                </div>
              )}

              <div className="flex gap-2">
                {editingCategory === category.id ? (
                  <>
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => handleSaveEdit(category.id)}
                    >
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(null)}
                    >
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Borrar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-muted-foreground">No hay categorías aún.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}