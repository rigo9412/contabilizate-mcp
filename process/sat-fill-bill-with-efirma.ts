import { unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { BrowserService } from '../services/browser.service';
import { SatFormService } from '../services/sat-form.service';
import { ErrorService } from '../services/error.service';
import { ConfigService } from '../services/config.service';
import { ValidationService } from '../services/validation.service';
import { bill } from '../types';



export class ValidationError extends Error {
    constructor(public errors: string[]) {
        super(errors.join('; '));
        this.name = 'ValidationError';
    }
}

export class SatBillGenerator {
    private tempFiles: string[] = [];
    private errorService: ErrorService;
    private configService: ConfigService;
    private validationService: ValidationService;
    private formService?: SatFormService;

    constructor() {
        this.errorService = ErrorService.getInstance();
        this.configService = ConfigService.getInstance();
        this.validationService = ValidationService.getInstance();
    }

    async generateBillWithEfirma(
        certificateFile: string,
        privateKeyFile: string,
        password: string,
        billData: bill
    ) {
        try {
            //await this.validateAllInputs(certificateFile, privateKeyFile, password, billData);

            // const tempFilePathPrivateKey = await this.createTempFile(privateKeyFile);
            // const tempFilePathCertificate = await this.createTempFile(certificateFile);
            this.tempFiles.push(certificateFile, privateKeyFile);

            const browserService = BrowserService.getInstance();
            const page = await browserService.createPage();
            this.formService = new SatFormService(page);

            await this.errorService.handleError(
                new Error("Error en el proceso de inicio de sesión"),
                () => this.signIn(certificateFile, privateKeyFile, password)
            );

            // Return screenshot as buffer directly without saving to disk
            return await page.screenshot({ fullPage: true });

            // await this.errorService.handleError(
            //     new Error("Error en el llenado del formulario"),
            //     () => this.fillBillForm(billData)
            // );

            // await this.errorService.handleError(
            //     new Error("Error en la confirmación de la firma"),
            //     () => this.confirmBillSignature(tempFilePathCertificate, tempFilePathPrivateKey, password)
            //);
        } catch (error) {
            this.errorService.logError(error as Error, { billData });

            if (error instanceof ValidationError) {
                throw error;
            } else if (error instanceof Error) {
                throw new Error(`Error al generar la factura: ${error.message}`);
            } else {
                throw new Error('Error al generar la factura: Error desconocido');
            }
        } finally {
            this.cleanupTempFiles();
        }
    }

    private async validateAllInputs(
        certificateFile: File,
        privateKeyFile: File,
        password: string,
        billData: bill
    ) {
        const errors: string[] = [];

        // Validar archivos de e.firma
        const efirmaValidation = this.validationService.validateEfirmaFiles(certificateFile, privateKeyFile);
        if (!efirmaValidation.isValid) {
            errors.push(...efirmaValidation.errors);
        }

        // Validar contraseña
        const passwordValidation = this.validationService.validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }

        // Validar datos de la factura
        const billDataValidation = this.validationService.validateBillData(billData);
        if (!billDataValidation.isValid) {
            errors.push(...billDataValidation.errors);
        }

        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
    }

    private async signIn(
        certificatePath: string,
        privateKeyPath: string,
        password: string
    ) {
        if (!this.formService) throw new Error('FormService no inicializado');
        const config = this.configService.getConfig();

        await this.formService.page.goto(config.urls.portalFactura,
            { waitUntil: 'domcontentloaded' });

        await this.formService.clickElement(config.selectors.loginButton);
        await this.formService.setFileInput(config.selectors.certificateInput, certificatePath);
        await this.formService.setFileInput(config.selectors.privateKeyInput, privateKeyPath);
        await this.formService.setTextInput(config.selectors.passwordInput, password);
        //await this.formService.clickElement(config.selectors.submitButton);
    }

    private async fillBillForm(billData: bill) {
        if (!this.formService) throw new Error('FormService no inicializado');
        const config = this.configService.getConfig();

        await this.formService.waitForElement(config.selectors.titleElement, { visible: true });
        await this.formService.waitForPageLoad();

        // Llenar datos del receptor
        await this.fillRecipientData(billData);

        // Agregar concepto
        await this.addBillConcept(billData);

        // Verificar totales y confirmar
        await this.verifyTotals();
        await this.formService.clickElement(config.selectors.confirmButton);
    }

    private async fillRecipientData(billData: bill) {
        if (!this.formService) throw new Error('FormService no inicializado');

        await this.formService.setAutocompleteInput("rfc", billData.rfc);
        await this.formService.setTextInput("codigoPostal", billData.codigoPostal);
        await this.formService.setAutocompleteInput("regimenFiscal", billData.regimenFiscal);
        await this.formService.setAutocompleteInput("usoFactura", billData.usoCFDI);
    }

    private async addBillConcept(billData: bill) {
        if (!this.formService) throw new Error('FormService no inicializado');
        const config = this.configService.getConfig();

        await this.formService.clickElement(config.selectors.addItemButton);
        await this.formService.setAutocompleteInput("concepto_descripcion", billData.concepto[0].descripcion);
        await this.formService.setAutocompleteInput("concepto_productoServicio", billData.concepto[0].producto);
        await this.formService.setAutocompleteInput("concepto_unidadDeMedida", billData.concepto[0].unidad);

        await this.formService.setTextInput("concepto_cantidad", billData.concepto[0].cantidad.toString());
        await this.formService.setTextInput("concepto_valorUnitario", billData.concepto[0].valor.toString());
        await this.formService.setTextInput("concepto_noIdentificacion", billData.concepto[0].id.toString());

        await this.formService.setSelectInput("concepto_impuesto", "02");
        await this.formService.setCheckboxInput("concepto_no_impuesto");

        await this.formService.setTextInput("concepto_cobradoIVA", billData.concepto[0].iva.toString());
        await this.formService.setTextInput("concepto_retencionIVA", billData.concepto[0].retIva.toString());
        await this.formService.setTextInput("concepto_retencionISR", billData.concepto[0].retIsr.toString());

        await this.formService.clickElement(".btnAddItem[entidad='1350001']");
    }

    private async confirmBillSignature(
        certificatePath: string,
        privateKeyPath: string,
        password: string
    ) {
        if (!this.formService) throw new Error('FormService no inicializado');
        const config = this.configService.getConfig();

        await this.formService.waitForElement("#formCFD", { visible: true });
        await this.formService.waitForPageLoad();

        await this.formService.setTextInput(config.selectors.passwordInput, password);
        await this.formService.setFileInput(config.selectors.privateKeyInput, privateKeyPath);
        await this.formService.setFileInput(config.selectors.certificateInput, certificatePath);
        await this.formService.clickElement(config.selectors.validateOscpButton);

        await this.formService.waitForPageLoad();
        await this.formService.clickElement(config.selectors.signButton);
    }

    private async verifyTotals() {
        if (!this.formService) throw new Error('FormService no inicializado');

        const subtotalOk = await this.formService.checkResultInput("subtotal", "7,200.00");
        const impuestosTrasladadosOk = await this.formService.checkResultInput("impuestos_trasladados_total", "576.00");
        const impuestosRetenidosOk = await this.formService.checkResultInput("impuestos_retenidos_total", "473.76");
        const totalOk = await this.formService.checkResultInput("total", "7,302.24");

        if (!subtotalOk || !impuestosTrasladadosOk || !impuestosRetenidosOk || !totalOk) {
            throw new Error("Los totales no coinciden con los valores esperados");
        }
    }

    // private async createTempFile(file: File): Promise<string> {
    //     try {
    //         const tempFilePath = path.join(__dirname, file.name);
    //         const content = await file.arrayBuffer();
    //         writeFileSync(tempFilePath, Buffer.from(content));
    //         return tempFilePath;
    //     } catch (error) {
    //         this.errorService.logError(error as Error, { fileName: file.name });
    //         throw error;
    //     }
    // }

    private cleanupTempFiles() {
        for (const file of this.tempFiles) {
            try {
                unlinkSync(file);
            } catch (error) {
                this.errorService.logError(error as Error, { filePath: file });
            }
        }
        this.tempFiles = [];
    }
}

