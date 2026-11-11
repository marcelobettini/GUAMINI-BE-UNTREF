import { z } from 'zod';
const nullableInt = z.number().int().min(0).nullable().optional();

export const productSchema = z.strictObject({
    // VARCHAR(40) NOT NULL, sin default: es el único campo obligatorio.
    ProductName: z.string({ required_error: 'El nombre del producto es obligatorio' }).trim().min(2, "El nombre del producto debe tener al menos 2 caracteres").max(40, 'El nombre del producto no puede exceder los 40 caracteres'),
    SupplierID: nullableInt,
    CategoryID: nullableInt,
    // VARCHAR(20) nullable, sin default.
    QuantityPerUnit: z.string({ error: 'La cantidad por unidad no puede exceder los 20 caracteres' }).trim().max(20).nullable().optional(),
    // DOUBLE nullable, default 0.
    UnitPrice: z.number().nonnegative("Precio unitario no puede ser negativo").nullable().optional(),
    UnitsInStock: nullableInt,
    UnitsOnOrder: nullableInt,
    ReorderLevel: nullableInt,
    // BOOLEAN NOT NULL, default false: se puede omitir, pero no enviar null.
    Discontinued: z.boolean().optional(),
});

