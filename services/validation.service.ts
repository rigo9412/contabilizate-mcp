import { bill } from "../types";

 

export class ValidationService {
    private static instance: ValidationService;

    private constructor() {}

    static getInstance(): ValidationService {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }

    validateRFC(rfc: string): boolean {
        const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
        return rfcPattern.test(rfc);
    }

    validateCodigoPostal(cp: string): boolean {
        return /^\d{5}$/.test(cp);
    }

    validateCurrency(amount: string): boolean {
        const currencyPattern = /^\d{1,3}(,\d{3})*(\.\d{2})?$/;
        return currencyPattern.test(amount);
    }

    validateQuantity(quantity: string): boolean {
        const parsedQuantity = parseFloat(quantity.replace(',', ''));
        return !isNaN(parsedQuantity) && parsedQuantity > 0;
    }

    validateBillData(billData: bill): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validar RFC
        if (!this.validateRFC(billData.rfc)) {
            errors.push('RFC inválido');
        }

        // Validar Código Postal
        if (!this.validateCodigoPostal(billData.codigoPostal)) {
            errors.push('Código postal inválido');
        }

        // Validar campos requeridos
        const requiredFields: (keyof bill)[] = [
            'rfc', 'codigoPostal', 'regimenFiscal', 'usoCFDI',
            'concepto'
        ];

        requiredFields.forEach(field => {
            if (!billData[field] || billData[field].toString().trim() === '') {
                errors.push(`Campo ${field.toString()} es requerido`);
            }
        });

        // Validar cantidades y montos
        if (billData.concepto[0].cantidad && !this.validateQuantity(billData.concepto[0].cantidad.toString())) {
            errors.push('Cantidad inválida');
        }

        if (billData.concepto[0].valor && !this.validateCurrency(billData.concepto[0].valor.toString())) {
            errors.push('Valor unitario inválido');
        }

        if (billData.concepto[0].iva && !this.validateCurrency(billData.concepto[0].iva.toString())) {
            errors.push('IVA cobrado inválido');
        }

        if (billData.concepto[0].retIva && !this.validateCurrency(billData.concepto[0].retIva.toString())) {
            errors.push('Retención IVA inválida');
        }

        if (billData.concepto[0].retIsr && !this.validateCurrency(billData.concepto[0].retIsr.toString())) {
            errors.push('Retención ISR inválida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateEfirmaFiles(certificateFile: File, privateKeyFile: File): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validar archivo de certificado
        if (!certificateFile) {
            errors.push('Archivo de certificado es requerido');
        } else {
            if (!certificateFile.name.toLowerCase().endsWith('.cer')) {
                errors.push('El archivo de certificado debe tener extensión .cer');
            }
            if (certificateFile.size > 10 * 1024 * 1024) { // 10MB máximo
                errors.push('El archivo de certificado es demasiado grande');
            }
        }

        // Validar archivo de llave privada
        if (!privateKeyFile) {
            errors.push('Archivo de llave privada es requerido');
        } else {
            if (!privateKeyFile.name.toLowerCase().endsWith('.key')) {
                errors.push('El archivo de llave privada debe tener extensión .key');
            }
            if (privateKeyFile.size > 10 * 1024 * 1024) { // 10MB máximo
                errors.push('El archivo de llave privada es demasiado grande');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validatePassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!password) {
            errors.push('La contraseña es requerida');
        } else if (password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        // Verificar que no contenga caracteres especiales no permitidos
        if (/[<>'"\\]/.test(password)) {
            errors.push('La contraseña contiene caracteres no permitidos');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}