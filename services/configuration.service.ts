import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface BillConfig {
  privateKey?: string;
  certificate?: string;
  password?: string;
  rfc?: string;
}

const CONFIG_PATH = path.join(os.homedir(), '.contabilizate-config.json');

export async function getConfig(): Promise<BillConfig> {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    // Return empty config if file doesn't exist
    return {};
  }
}

export async function saveConfig(config: BillConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}