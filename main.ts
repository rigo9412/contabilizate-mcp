import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fillBillSchema } from "./types";
import { readFile } from "./services/file.service";
import { getConfig, saveConfig } from "./services/configuration.service";
import { SatFormService } from "./services/sat-form.service";
import { ErrorService } from "./services/error.service";
import { ConfigService } from "./services/config.service";
import { ValidationService } from "./services/validation.service";
import { BrowserService } from "./services/browser.service";
import { SatBillGenerator } from "./process/sat-fill-bill-with-efirma";
import { uint8ArrayToBase64 } from "./services/image.service";



// Create an MCP server
const server = new McpServer({
    name: "SAT Automation - Contabilizate",
    description: "A tool for automating SAT generation bills",
    version: "1.0.0"
});


// Add configuration management tool
server.tool("config-bill-settings", {
    privateKey: z.string().describe("The private key file path"),
    certificate: z.string().describe("The certificate file path"),
    password: z.string().describe("The password"),
    rfc: z.string().describe("The bill's RFC"),
},
    async (params) => {
        const currentConfig = await getConfig();
        const newConfig = { ...currentConfig };

        // Update only provided values
        if (params.privateKey) newConfig.privateKey = params.privateKey;
        if (params.certificate) newConfig.certificate = params.certificate;
        if (params.password) newConfig.password = params.password;
        if (params.rfc) newConfig.rfc = params.rfc;

        await saveConfig(newConfig);
        const { rfc } = await getConfig();
        // Validate the inputs


        return {
            content: [
                {
                    type: "text",
                    text: `Configuration saved successfully! ${rfc}`
                }
            ]
        };
    }
);



// Add an addition tool
server.tool("generate-bill-sat", {

    bill: fillBillSchema.describe("The bill data")
},
    async ({
        bill
    }) => {

        const { certificate, privateKey, password } = await getConfig();
        // Validate the inputs
        // const fileCertificateBuffer = await readFile(certificate);
        // const filePrivateKeyBuffer = await readFile(privateKey);
 

        if (!certificate) {
            throw new Error("Certificate file not found");
        }
        if (!privateKey) {
            throw new Error("Private key file not found");
        }
        if (!password) {
            throw new Error("Password not found");
        }


        const satBillGenerator = new SatBillGenerator();
        const screenshot = await satBillGenerator.generateBillWithEfirma(
            certificate,
            privateKey,
            password,
            bill);

        // Convert screenshot buffer to base64 string for the image
        const base64Image = uint8ArrayToBase64(screenshot);

        // Return the result wrapped in a content array
        return {
            content: [
                {
                    type: "image",
                    data: base64Image,
                    mimeType: "image/png",
                }
            ]
        };
    }
);



// Start receiving messages on stdin and sending messages on stdout
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
// Wrap await in an immediately-invoked async function to avoid top-level await
(async () => {
    await server.connect(transport);
})();