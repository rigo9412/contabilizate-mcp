import * as fs from 'fs/promises';
 
export const BASE_PATH = process.env.BASE_PATH_STORAGE!;


export const readFile = async (path: string | undefined): Promise<Buffer> => {
    if (!path) {
        throw new Error('Path is undefined');
    }
    return await fs.readFile(path);
}

export const writeFile = async (path: string, data: File): Promise<void> => {
    try {
    const bytes = await data.arrayBuffer();
    await fs.writeFile(path, new Uint8Array(bytes), );
    console.log('It\'s saved!');
    
    } catch (error) {
        console.error('Error saving file:', error);
    }
    finally {
        return;
    }
}