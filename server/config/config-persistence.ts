import { getPCloudClient } from "../pcloud-client";
import { 
  AgentConfig, 
  AgentConfigSchema, 
  EvolutionProposal,
  IndustryTemplate,
  IndustryTemplateSchema
} from "./agent-config-schema";
import type { RegisteredAgentName } from "./agent-config-registry";

interface ConfigVersion {
  version: string;
  timestamp: string;
  changes: string[];
  author: string;
}

interface StoredConfig {
  config: AgentConfig;
  metadata: {
    savedAt: string;
    version: string;
    previousVersions: ConfigVersion[];
  };
}

interface EvolutionProposalRecord {
  proposal: EvolutionProposal;
  createdAt: string;
  agentName: string;
  analysisContext?: {
    url: string;
    industry?: string;
  };
}

const BASE_PATH = "/BenchmarkingCouncil";

export class ConfigPersistenceService {
  private pcloud = getPCloudClient();

  private getConfigFolderPath(agentName: string): string {
    return `${BASE_PATH}/${agentName}/config`;
  }

  private getEvolutionFolderPath(agentName: string): string {
    return `${BASE_PATH}/${agentName}/config/evolution`;
  }

  private getIndustryConfigPath(): string {
    return `${BASE_PATH}/_shared/industries`;
  }

  async saveAgentConfig(
    agentName: RegisteredAgentName,
    config: AgentConfig,
    changeDescription: string[] = []
  ): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const folderPath = this.getConfigFolderPath(agentName);
      const fileName = "current_config.json";

      let previousVersions: ConfigVersion[] = [];
      try {
        const existing = await this.loadAgentConfig(agentName);
        if (existing) {
          previousVersions = [
            {
              version: existing.metadata.version,
              timestamp: existing.metadata.savedAt,
              changes: [],
              author: "system"
            },
            ...existing.metadata.previousVersions.slice(0, 9)
          ];
        }
      } catch {
      }

      const newVersion = this.generateVersion();
      const storedConfig: StoredConfig = {
        config,
        metadata: {
          savedAt: new Date().toISOString(),
          version: newVersion,
          previousVersions
        }
      };

      await this.pcloud.uploadJsonFile(folderPath, fileName, storedConfig);

      console.log(`[ConfigPersistence] Saved config for ${agentName} v${newVersion}`);
      
      return {
        success: true,
        path: `${folderPath}/${fileName}`
      };
    } catch (error: any) {
      console.error(`[ConfigPersistence] Failed to save config for ${agentName}:`, error);
      return {
        success: false,
        path: "",
        error: error.message
      };
    }
  }

  async loadAgentConfig(agentName: RegisteredAgentName): Promise<StoredConfig | null> {
    try {
      const folderPath = this.getConfigFolderPath(agentName);
      const fileName = "current_config.json";
      
      const content = await this.pcloud.downloadTextFile(`${folderPath}/${fileName}`);
      if (!content) {
        return null;
      }

      const parsed = JSON.parse(content);
      
      const validatedConfig = AgentConfigSchema.parse(parsed.config);
      
      return {
        config: validatedConfig,
        metadata: parsed.metadata
      };
    } catch (error: any) {
      if (error.message?.includes("not found") || error.message?.includes("2009")) {
        return null;
      }
      console.error(`[ConfigPersistence] Failed to load config for ${agentName}:`, error);
      return null;
    }
  }

  async saveEvolutionProposal(
    agentName: RegisteredAgentName,
    proposal: EvolutionProposal,
    context?: { url: string; industry?: string }
  ): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const folderPath = this.getEvolutionFolderPath(agentName);
      const fileName = `proposal_${proposal.proposalId}_${Date.now()}.json`;

      const record: EvolutionProposalRecord = {
        proposal,
        createdAt: new Date().toISOString(),
        agentName,
        analysisContext: context
      };

      await this.pcloud.uploadJsonFile(folderPath, fileName, record);

      console.log(`[ConfigPersistence] Saved evolution proposal ${proposal.proposalId} for ${agentName}`);

      return {
        success: true,
        path: `${folderPath}/${fileName}`
      };
    } catch (error: any) {
      console.error(`[ConfigPersistence] Failed to save evolution proposal:`, error);
      return {
        success: false,
        path: "",
        error: error.message
      };
    }
  }

  async listEvolutionProposals(agentName: RegisteredAgentName): Promise<EvolutionProposalRecord[]> {
    try {
      const folderPath = this.getEvolutionFolderPath(agentName);
      const files = await this.pcloud.listFolder(folderPath);
      
      if (!files || files.length === 0) {
        return [];
      }

      const proposals: EvolutionProposalRecord[] = [];
      
      for (const file of files) {
        if (file.name.startsWith("proposal_") && file.name.endsWith(".json")) {
          try {
            const content = await this.pcloud.downloadTextFile(`${folderPath}/${file.name}`);
            if (content) {
              proposals.push(JSON.parse(content));
            }
          } catch {
          }
        }
      }

      return proposals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error: any) {
      console.error(`[ConfigPersistence] Failed to list evolution proposals:`, error);
      return [];
    }
  }

  async saveIndustryTemplate(template: IndustryTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      IndustryTemplateSchema.parse(template);

      const folderPath = this.getIndustryConfigPath();
      const fileName = `${template.industryId}.json`;

      await this.pcloud.uploadJsonFile(folderPath, fileName, {
        template,
        savedAt: new Date().toISOString()
      });

      console.log(`[ConfigPersistence] Saved industry template: ${template.industryName}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[ConfigPersistence] Failed to save industry template:`, error);
      return { success: false, error: error.message };
    }
  }

  async loadIndustryTemplates(): Promise<IndustryTemplate[]> {
    try {
      const folderPath = this.getIndustryConfigPath();
      const files = await this.pcloud.listFolder(folderPath);

      if (!files || files.length === 0) {
        return [];
      }

      const templates: IndustryTemplate[] = [];

      for (const file of files) {
        if (file.name.endsWith(".json")) {
          try {
            const content = await this.pcloud.downloadTextFile(`${folderPath}/${file.name}`);
            if (content) {
              const parsed = JSON.parse(content);
              const validated = IndustryTemplateSchema.parse(parsed.template);
              templates.push(validated);
            }
          } catch {
          }
        }
      }

      return templates;
    } catch (error: any) {
      console.error(`[ConfigPersistence] Failed to load industry templates:`, error);
      return [];
    }
  }

  async syncAllConfigs(configs: Map<RegisteredAgentName, AgentConfig>): Promise<{
    synced: string[];
    failed: string[];
  }> {
    const synced: string[] = [];
    const failed: string[] = [];

    for (const [agentName, config] of Array.from(configs.entries())) {
      const result = await this.saveAgentConfig(agentName, config, ["Initial sync"]);
      if (result.success) {
        synced.push(agentName);
      } else {
        failed.push(agentName);
      }
    }

    console.log(`[ConfigPersistence] Sync complete: ${synced.length} synced, ${failed.length} failed`);

    return { synced, failed };
  }

  async getConfigHistory(agentName: RegisteredAgentName): Promise<ConfigVersion[]> {
    const stored = await this.loadAgentConfig(agentName);
    if (!stored) {
      return [];
    }
    
    return [
      {
        version: stored.metadata.version,
        timestamp: stored.metadata.savedAt,
        changes: [],
        author: "current"
      },
      ...stored.metadata.previousVersions
    ];
  }

  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getDate().toString().padStart(2, "0")}-${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  }
}

let persistenceInstance: ConfigPersistenceService | null = null;

export function getConfigPersistenceService(): ConfigPersistenceService {
  if (!persistenceInstance) {
    persistenceInstance = new ConfigPersistenceService();
  }
  return persistenceInstance;
}
