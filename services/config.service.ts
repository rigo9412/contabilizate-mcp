export interface SatBotConfig {
    timeouts: {
        page: number;
        element: number;
        navigation: number;
    };
    retries: {
        maxAttempts: number;
        baseDelay: number;
    };
    urls: {
        portalFactura: string;
    };
    selectors: {
        loginButton: string;
        certificateInput: string;
        privateKeyInput: string;
        passwordInput: string;
        submitButton: string;
        titleElement: string;
        addItemButton: string;
        confirmButton: string;
        validateOscpButton: string;
        signButton: string;
    };
}

export class ConfigService {
    private static instance: ConfigService;
    private config: SatBotConfig;

    private constructor() {
        this.config = {
            timeouts: {
                page: 30000,
                element: 10000,
                navigation: 15000
            },
            retries: {
                maxAttempts: 3,
                baseDelay: 1000
            },
            urls: {
                portalFactura: 'https://portal.facturaelectronica.sat.gob.mx/'
            },
            selectors: {
                loginButton: '#buttonFiel',
                certificateInput: '#fileCertificate',
                privateKeyInput: '#filePrivateKey',
                passwordInput: '#privateKeyPassword',
                submitButton: '#submit',
                titleElement: '#tituloFI',
                addItemButton: '.btnNewItem[entidad="1350001"]',
                confirmButton: '.btn-sellar-factura[tabindex="2002"]',
                validateOscpButton: '#btnValidaOSCP',
                signButton: '#btnFirmar'
            }
        };
    }

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    getConfig(): SatBotConfig {
        return { ...this.config };
    }

    updateConfig(partialConfig: Partial<SatBotConfig>) {
        this.config = {
            ...this.config,
            ...partialConfig
        };
    }
}