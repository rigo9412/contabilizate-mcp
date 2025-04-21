import { z } from "zod";

 

export const fillBillSchema = z.object({
    rfc: z.string(),
    razonSocial: z.string(),
    codigoPostal: z.string(), // Could be z.number() if you want to enforce numeric type
    regimenFiscal: z.string(),
    usoCFDI: z.string(),
    concepto: z.array(z.object({
        descripcion: z.string(),
        producto: z.string(),
        unidad: z.string(),
        cantidad: z.number(), // Could be z.number() if you want to enforce numeric type
        valor: z.number(), // Could be z.number() if you want to enforce numeric type
        id: z.number(), // Could be z.number() if you want to enforce numeric type
        impuesto: z.string(),
        iva: z.number(), // Could be z.number() if you want to enforce numeric type
        retIva: z.number(),
        retIsr: z.number()
    })),
    total: z.number(), // Could be z.number() if you want to enforce numeric type
    subtotal: z.number(), // Could be z.number() if you want to enforce numeric type
    impuestosTrasladados: z.number(), // Could be z.number() if you want to enforce numeric type
    impuestosRetenidos: z.number()
});

export type bill = z.infer<typeof fillBillSchema>; // number
