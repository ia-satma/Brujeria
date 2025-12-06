interface PCloudAuthResponse {
  result: number;
  auth: string;
  userid: number;
  email: string;
  emailverified: boolean;
  error?: string;
}

interface PCloudFolderMetadata {
  folderid: number;
  name: string;
  path: string;
  created: string;
  modified: string;
  isshared: boolean;
  isfolder: true;
}

interface PCloudFileMetadata {
  fileid: number;
  name: string;
  path: string;
  contenttype: string;
  size: number;
  created: string;
  modified: string;
  hash: number;
  isfolder: false;
}

type PCloudMetadata = PCloudFolderMetadata | PCloudFileMetadata;

interface PCloudListFolderResponse {
  result: number;
  metadata: {
    folderid: number;
    name: string;
    path: string;
    contents?: PCloudMetadata[];
  };
  error?: string;
}

interface PCloudCreateFolderResponse {
  result: number;
  metadata: PCloudFolderMetadata;
  error?: string;
}

interface PCloudUploadResponse {
  result: number;
  metadata: PCloudFileMetadata[];
  error?: string;
}

interface PCloudGetFileLinkResponse {
  result: number;
  hosts: string[];
  path: string;
  error?: string;
}

export class PCloudClient {
  private authToken: string | null = null;
  private apiBase = 'https://api.pcloud.com';
  private tokenExpiry: number = 0;
  
  constructor(
    private email: string,
    private password: string,
    private useEuServer: boolean = false
  ) {
    if (useEuServer) {
      this.apiBase = 'https://eapi.pcloud.com';
    }
  }

  private async authenticate(): Promise<string> {
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    const params = new URLSearchParams({
      getauth: '1',
      logout: '1',
      username: this.email,
      password: this.password,
      authexpire: '86400',
    });

    const response = await fetch(`${this.apiBase}/userinfo?${params}`);
    const data = await response.json() as PCloudAuthResponse;

    if (data.result !== 0) {
      throw new Error(`pCloud authentication failed: ${data.error || 'Unknown error'} (code: ${data.result})`);
    }

    this.authToken = data.auth;
    this.tokenExpiry = Date.now() + 86400 * 1000 - 60000;
    
    return this.authToken;
  }

  async testConnection(): Promise<{ success: boolean; email: string; userid: number }> {
    const auth = await this.authenticate();
    
    const params = new URLSearchParams({ auth });
    const response = await fetch(`${this.apiBase}/userinfo?${params}`);
    const data = await response.json() as PCloudAuthResponse;

    if (data.result !== 0) {
      throw new Error(`pCloud connection test failed: ${data.error || 'Unknown error'}`);
    }

    return {
      success: true,
      email: data.email,
      userid: data.userid,
    };
  }

  async listFolder(path: string = '/'): Promise<PCloudMetadata[]> {
    const auth = await this.authenticate();
    
    const params = new URLSearchParams({
      auth,
      path,
      recursive: '0',
    });

    const response = await fetch(`${this.apiBase}/listfolder?${params}`);
    const data = await response.json() as PCloudListFolderResponse;

    if (data.result !== 0) {
      throw new Error(`Failed to list folder ${path}: ${data.error || 'Unknown error'}`);
    }

    return data.metadata.contents || [];
  }

  async createFolderIfNotExists(path: string): Promise<PCloudFolderMetadata> {
    const auth = await this.authenticate();
    
    const params = new URLSearchParams({
      auth,
      path,
    });

    const response = await fetch(`${this.apiBase}/createfolderifnotexists?${params}`);
    const data = await response.json() as PCloudCreateFolderResponse;

    if (data.result !== 0) {
      throw new Error(`Failed to create folder ${path}: ${data.error || 'Unknown error'}`);
    }

    return data.metadata;
  }

  async ensureFolderPath(fullPath: string): Promise<PCloudFolderMetadata> {
    const parts = fullPath.split('/').filter(Boolean);
    let currentPath = '';
    let lastFolder: PCloudFolderMetadata | null = null;

    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      lastFolder = await this.createFolderIfNotExists(currentPath);
    }

    if (!lastFolder) {
      throw new Error(`Failed to create folder path: ${fullPath}`);
    }

    return lastFolder;
  }

  async uploadJsonFile(
    folderPath: string,
    fileName: string,
    data: object
  ): Promise<PCloudFileMetadata> {
    const auth = await this.authenticate();
    
    await this.ensureFolderPath(folderPath);

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const params = new URLSearchParams({
      auth,
      path: folderPath,
      filename: fileName,
      nopartial: '1',
    });

    const response = await fetch(`${this.apiBase}/uploadfile?${params}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json() as PCloudUploadResponse;

    if (result.result !== 0) {
      throw new Error(`Failed to upload file ${fileName}: ${result.error || 'Unknown error'}`);
    }

    return result.metadata[0];
  }

  async uploadTextFile(
    folderPath: string,
    fileName: string,
    content: string,
    contentType: string = 'text/plain'
  ): Promise<PCloudFileMetadata> {
    const auth = await this.authenticate();
    
    await this.ensureFolderPath(folderPath);

    const blob = new Blob([content], { type: contentType });

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const params = new URLSearchParams({
      auth,
      path: folderPath,
      filename: fileName,
      nopartial: '1',
    });

    const response = await fetch(`${this.apiBase}/uploadfile?${params}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json() as PCloudUploadResponse;

    if (result.result !== 0) {
      throw new Error(`Failed to upload file ${fileName}: ${result.error || 'Unknown error'}`);
    }

    return result.metadata[0];
  }

  async getFileDownloadLink(filePath: string): Promise<string> {
    const auth = await this.authenticate();
    
    const params = new URLSearchParams({
      auth,
      path: filePath,
    });

    const response = await fetch(`${this.apiBase}/getfilelink?${params}`);
    const data = await response.json() as PCloudGetFileLinkResponse;

    if (data.result !== 0) {
      throw new Error(`Failed to get file link for ${filePath}: ${data.error || 'Unknown error'}`);
    }

    const host = data.hosts[0];
    return `https://${host}${data.path}`;
  }

  async downloadTextFile(filePath: string): Promise<string> {
    const downloadUrl = await this.getFileDownloadLink(filePath);
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file ${filePath}: ${response.statusText}`);
    }

    return await response.text();
  }

  async downloadJsonFile<T = unknown>(filePath: string): Promise<T> {
    const content = await this.downloadTextFile(filePath);
    return JSON.parse(content) as T;
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      
      const contents = await this.listFolder(parentPath);
      return contents.some(item => !item.isfolder && item.name === fileName);
    } catch {
      return false;
    }
  }

  async folderExists(folderPath: string): Promise<boolean> {
    try {
      await this.listFolder(folderPath);
      return true;
    } catch {
      return false;
    }
  }

  async listJsonFiles(folderPath: string): Promise<PCloudFileMetadata[]> {
    const contents = await this.listFolder(folderPath);
    return contents.filter(
      (item): item is PCloudFileMetadata => 
        !item.isfolder && item.name.endsWith('.json')
    );
  }

  async deleteFile(filePath: string): Promise<void> {
    const auth = await this.authenticate();
    
    const params = new URLSearchParams({
      auth,
      path: filePath,
    });

    const response = await fetch(`${this.apiBase}/deletefile?${params}`);
    const data = await response.json() as { result: number; error?: string };

    if (data.result !== 0) {
      throw new Error(`Failed to delete file ${filePath}: ${data.error || 'Unknown error'}`);
    }
  }
}

let pcloudClientInstance: PCloudClient | null = null;

export function getPCloudClient(): PCloudClient {
  if (!pcloudClientInstance) {
    const email = process.env.PCLOUD_EMAIL;
    const password = process.env.PCLOUD_PASSWORD;

    if (!email || !password) {
      throw new Error('pCloud credentials not configured. Set PCLOUD_EMAIL and PCLOUD_PASSWORD environment variables.');
    }

    pcloudClientInstance = new PCloudClient(email, password, false);
  }

  return pcloudClientInstance;
}

export function getCurrentMonthFolder(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getAgentFolderPath(agentName: string): string {
  const monthFolder = getCurrentMonthFolder();
  return `/BenchmarkingCouncil/${agentName}/${monthFolder}`;
}

export { 
  PCloudFileMetadata, 
  PCloudFolderMetadata, 
  PCloudMetadata 
};
