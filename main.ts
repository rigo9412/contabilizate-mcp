import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// import { fillBillSchema } from "./types";
import { readFile } from "./services/file.service";
import { getConfig, saveConfig } from "./services/configuration.service";
 


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
        const {rfc} = await getConfig();
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


/*
// Add an addition tool
server.tool("generate-bill-sat", {
  
    bill: fillBillSchema.describe("The bill data")
},
    async ({
        //bill
    }) => {
      
        const {certificate,privateKey} = await getConfig();
          // Validate the inputs
          const fileCertificate = await readFile(certificate);
          const filePrivateKey = await readFile(privateKey);
          
          if (!fileCertificate) {
              throw new Error("Certificate file not found");
          }
          if (!filePrivateKey) {
              throw new Error("Private key file not found");
          }

    
        // Return the result wrapped in a content array
        return {
            content: [
                {
                    type: "text",
                    text: `Congratulation! The bill was generated successfully!`
                }
            ]
        };
    }
);
*/


// Start receiving messages on stdin and sending messages on stdout
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
// Wrap await in an immediately-invoked async function to avoid top-level await
(async () => {
    await server.connect(transport);
})();