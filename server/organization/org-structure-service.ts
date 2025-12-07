import { z } from "zod";
import { getPCloudClient, PCloudFileMetadata } from "../pcloud-client";
import {
  ORGANIZATIONAL_STRUCTURE,
  AGENCY_NAME,
  AGENCY_TAGLINE,
  AGENCY_VISION,
  AGENCY_MISSION,
  AgencyRole,
  EmployeeProfile,
  EmployeeProfileSchema,
  ServiceCanvas,
  LearningAgenda,
  LearningAgendaSchema,
  PerformanceMetrics,
  PerformanceMetricsSchema,
  Department,
  getAgentsByDepartment,
  getReportingChain
} from "./org-architecture";

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

function deepMerge<T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (sourceValue === undefined) {
      continue;
    }
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as DeepPartial<Record<string, unknown>>
      ) as T[keyof T];
    } else {
      result[key] = sourceValue as T[keyof T];
    }
  }
  
  return result;
}

interface DepartmentEmployeeIndex {
  departmentId: Department;
  departmentName: string;
  employees: Array<{
    employeeId: string;
    agentName: string;
    displayName: string;
    displayNameEs: string;
    level: string;
    profilePath: string;
  }>;
  lastUpdated: string;
}

const BASE_PATH = "/BenchmarkingCouncil";

const FOLDER_STRUCTURE = {
  council: `${BASE_PATH}/Council`,
  governance: `${BASE_PATH}/Council/Governance`,
  decisions: `${BASE_PATH}/Council/Decisions`,
  departments: `${BASE_PATH}/Departments`,
  proposals: `${BASE_PATH}/Council/RoleProposals`,
} as const;

const DEPARTMENT_NAMES: Record<Department, string> = {
  creative_direction: "CreativeDirection",
  experience_design: "ExperienceDesign",
  content_strategy: "ContentStrategy",
  digital_engineering: "DigitalEngineering",
  operations: "Operations",
  governance: "Governance"
};

function getEmployeeFolders(agentName: string) {
  const basePath = `${BASE_PATH}/${agentName}`;
  return {
    root: basePath,
    profile: `${basePath}/Profile`,
    operations: `${basePath}/Operations`,
    learning: `${basePath}/Learning`,
    performance: `${basePath}/Performance`,
    briefs: `${basePath}/Operations/Briefs`,
    reports: `${basePath}/Operations/Reports`,
    skills: `${basePath}/Skills`,
    subagents: `${basePath}/Subagents`
  };
}

function getDepartmentPath(department: Department): string {
  return `${FOLDER_STRUCTURE.departments}/${DEPARTMENT_NAMES[department]}`;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateEmployeeId(role: AgencyRole): string {
  return `emp_${role.roleId}_${Date.now().toString(36)}`;
}

export class OrganizationalStructureService {
  private static instance: OrganizationalStructureService | null = null;
  private pcloud = getPCloudClient();

  private constructor() {}

  static getInstance(): OrganizationalStructureService {
    if (!OrganizationalStructureService.instance) {
      OrganizationalStructureService.instance = new OrganizationalStructureService();
    }
    return OrganizationalStructureService.instance;
  }

  async initializeOrganization(): Promise<void> {
    console.log("Inicializando estructura organizacional en pCloud...");
    
    await this.pcloud.ensureFolderPath(FOLDER_STRUCTURE.council);
    await this.pcloud.ensureFolderPath(FOLDER_STRUCTURE.governance);
    await this.pcloud.ensureFolderPath(FOLDER_STRUCTURE.decisions);
    await this.pcloud.ensureFolderPath(FOLDER_STRUCTURE.proposals);
    
    const departmentsByKey = getAgentsByDepartment();
    for (const department of Object.keys(departmentsByKey) as Department[]) {
      await this.pcloud.ensureFolderPath(getDepartmentPath(department));
    }
    
    console.log("Estructura organizacional base creada");
  }

  async bootstrapEmployee(agentName: string): Promise<{
    success: boolean;
    employeeId: string;
    foldersCreated: string[];
    filesCreated: string[];
  }> {
    const role = ORGANIZATIONAL_STRUCTURE[agentName];
    if (!role) {
      throw new Error(`Agente no encontrado en la estructura organizacional: ${agentName}`);
    }

    const folders = getEmployeeFolders(agentName);
    const foldersCreated: string[] = [];
    const filesCreated: string[] = [];

    for (const folderPath of Object.values(folders)) {
      await this.pcloud.ensureFolderPath(folderPath);
      foldersCreated.push(folderPath);
    }

    const employeeId = generateEmployeeId(role);
    
    const profile = this.generateEmployeeProfile(agentName, employeeId, role);
    await this.pcloud.uploadJsonFile(folders.profile, "identity.json", profile);
    filesCreated.push(`${folders.profile}/identity.json`);

    const charter = this.generateEmployeeCharter(agentName, role);
    await this.pcloud.uploadTextFile(folders.profile, "charter.md", charter, "text/markdown");
    filesCreated.push(`${folders.profile}/charter.md`);

    const serviceCanvas = this.generateServiceCanvas(agentName, employeeId, role);
    await this.pcloud.uploadJsonFile(folders.profile, "service-canvas.json", serviceCanvas);
    filesCreated.push(`${folders.profile}/service-canvas.json`);

    const performanceMetrics = this.generateInitialPerformanceMetrics(employeeId);
    await this.pcloud.uploadJsonFile(folders.performance, "current-metrics.json", performanceMetrics);
    filesCreated.push(`${folders.performance}/current-metrics.json`);

    const learningAgenda = this.generateInitialLearningAgenda(employeeId, role);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", learningAgenda);
    filesCreated.push(`${folders.learning}/learning-agenda.json`);

    const departmentIndexResult = await this.updateDepartmentIndex(
      role.department,
      employeeId,
      agentName,
      role.roleName,
      role.roleNameEs,
      role.level,
      folders.profile
    );
    filesCreated.push(departmentIndexResult.filePath);

    console.log(`Empleado digital bootstrapeado: ${agentName} (${employeeId})`);

    return {
      success: true,
      employeeId,
      foldersCreated,
      filesCreated
    };
  }

  private async updateDepartmentIndex(
    department: Department,
    employeeId: string,
    agentName: string,
    displayName: string,
    displayNameEs: string,
    level: string,
    profilePath: string
  ): Promise<{ filePath: string }> {
    const departmentPath = getDepartmentPath(department);
    const indexFilePath = `${departmentPath}/employees-index.json`;
    
    let currentIndex: DepartmentEmployeeIndex;
    
    try {
      currentIndex = await this.pcloud.downloadJsonFile<DepartmentEmployeeIndex>(indexFilePath);
    } catch {
      currentIndex = {
        departmentId: department,
        departmentName: DEPARTMENT_NAMES[department],
        employees: [],
        lastUpdated: getCurrentDate()
      };
    }

    const existingEmployeeIdx = currentIndex.employees.findIndex(e => e.agentName === agentName);
    const employeeEntry = {
      employeeId,
      agentName,
      displayName,
      displayNameEs,
      level,
      profilePath
    };

    if (existingEmployeeIdx >= 0) {
      currentIndex.employees[existingEmployeeIdx] = employeeEntry;
    } else {
      currentIndex.employees.push(employeeEntry);
    }

    currentIndex.lastUpdated = getCurrentDate();

    await this.pcloud.uploadJsonFile(departmentPath, "employees-index.json", currentIndex);
    
    return { filePath: indexFilePath };
  }

  async bootstrapAllEmployees(): Promise<{
    total: number;
    successful: number;
    failed: string[];
    results: Record<string, { employeeId: string; success: boolean }>;
  }> {
    await this.initializeOrganization();

    const agentNames = Object.keys(ORGANIZATIONAL_STRUCTURE);
    const results: Record<string, { employeeId: string; success: boolean }> = {};
    const failed: string[] = [];

    for (const agentName of agentNames) {
      try {
        const result = await this.bootstrapEmployee(agentName);
        results[agentName] = { employeeId: result.employeeId, success: true };
      } catch (error) {
        console.error(`Error bootstrapping ${agentName}:`, error);
        results[agentName] = { employeeId: "", success: false };
        failed.push(agentName);
      }
    }

    return {
      total: agentNames.length,
      successful: agentNames.length - failed.length,
      failed,
      results
    };
  }

  async getEmployeeProfile(agentName: string): Promise<EmployeeProfile | null> {
    const folders = getEmployeeFolders(agentName);
    try {
      return await this.pcloud.downloadJsonFile<EmployeeProfile>(`${folders.profile}/identity.json`);
    } catch {
      return null;
    }
  }

  async updateEmployeeProfile(agentName: string, updates: DeepPartial<EmployeeProfile>): Promise<void> {
    const folders = getEmployeeFolders(agentName);
    const current = await this.getEmployeeProfile(agentName);
    
    if (!current) {
      throw new Error(`No se encontró perfil para el empleado: ${agentName}`);
    }

    const merged = deepMerge(current as Record<string, unknown>, updates as DeepPartial<Record<string, unknown>>);
    const validated = EmployeeProfileSchema.parse(merged);
    await this.pcloud.uploadJsonFile(folders.profile, "identity.json", validated);
  }

  async getPerformanceMetrics(agentName: string): Promise<PerformanceMetrics | null> {
    const folders = getEmployeeFolders(agentName);
    try {
      return await this.pcloud.downloadJsonFile<PerformanceMetrics>(`${folders.performance}/current-metrics.json`);
    } catch {
      return null;
    }
  }

  async updatePerformanceMetrics(agentName: string, metrics: DeepPartial<PerformanceMetrics>): Promise<void> {
    const folders = getEmployeeFolders(agentName);
    const current = await this.getPerformanceMetrics(agentName);
    
    if (!current) {
      throw new Error(`No se encontraron métricas para el empleado: ${agentName}`);
    }

    const merged = deepMerge(current as Record<string, unknown>, metrics as DeepPartial<Record<string, unknown>>);
    const validated = PerformanceMetricsSchema.parse(merged);
    await this.pcloud.uploadJsonFile(folders.performance, "current-metrics.json", validated);
  }

  async getLearningAgenda(agentName: string): Promise<LearningAgenda | null> {
    const folders = getEmployeeFolders(agentName);
    try {
      return await this.pcloud.downloadJsonFile<LearningAgenda>(`${folders.learning}/learning-agenda.json`);
    } catch {
      return null;
    }
  }

  async updateLearningAgenda(agentName: string, agenda: DeepPartial<LearningAgenda>): Promise<void> {
    const folders = getEmployeeFolders(agentName);
    const current = await this.getLearningAgenda(agentName);
    
    if (!current) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const merged = deepMerge(current as Record<string, unknown>, agenda as DeepPartial<Record<string, unknown>>);
    const validated = LearningAgendaSchema.parse(merged);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);
  }

  async recordAnalysisCompletion(agentName: string, analysisId: string, score: number): Promise<void> {
    const profile = await this.getEmployeeProfile(agentName);
    if (!profile) return;

    const totalAnalyses = profile.performanceSummary.analysesCompleted + 1;
    const newAverage = (
      (profile.performanceSummary.averageScore * profile.performanceSummary.analysesCompleted) + score
    ) / totalAnalyses;

    await this.updateEmployeeProfile(agentName, {
      performanceSummary: {
        ...profile.performanceSummary,
        analysesCompleted: totalAnalyses,
        averageScore: Math.round(newAverage * 100) / 100,
        lastEvaluation: getCurrentDate()
      }
    });

    const metrics = await this.getPerformanceMetrics(agentName);
    if (metrics) {
      await this.updatePerformanceMetrics(agentName, {
        kpiResults: metrics.kpiResults.map(kpi => ({
          ...kpi,
          actual: kpi.kpiName.includes("análisis") ? totalAnalyses : kpi.actual
        }))
      });
    }
  }

  async saveOperationBrief(agentName: string, briefId: string, content: object): Promise<PCloudFileMetadata> {
    const folders = getEmployeeFolders(agentName);
    const fileName = `brief_${briefId}_${getCurrentDate()}.json`;
    return await this.pcloud.uploadJsonFile(folders.briefs, fileName, content);
  }

  async saveOperationReport(agentName: string, reportId: string, content: object): Promise<PCloudFileMetadata> {
    const folders = getEmployeeFolders(agentName);
    const fileName = `report_${reportId}_${getCurrentDate()}.json`;
    return await this.pcloud.uploadJsonFile(folders.reports, fileName, content);
  }

  async listEmployeeBriefs(agentName: string): Promise<PCloudFileMetadata[]> {
    const folders = getEmployeeFolders(agentName);
    try {
      return await this.pcloud.listJsonFiles(folders.briefs);
    } catch {
      return [];
    }
  }

  async listEmployeeReports(agentName: string): Promise<PCloudFileMetadata[]> {
    const folders = getEmployeeFolders(agentName);
    try {
      return await this.pcloud.listJsonFiles(folders.reports);
    } catch {
      return [];
    }
  }

  async saveCouncilDecision(decisionId: string, decision: {
    title: string;
    description: string;
    proposedBy: string;
    approvedBy: string[];
    date: string;
    impact: string;
    details: object;
  }): Promise<PCloudFileMetadata> {
    const fileName = `decision_${decisionId}_${getCurrentDate()}.json`;
    return await this.pcloud.uploadJsonFile(FOLDER_STRUCTURE.decisions, fileName, decision);
  }

  async getOrganizationSummary(): Promise<{
    agencyInfo: {
      name: string;
      tagline: string;
      vision: string;
      mission: string;
    };
    totalEmployees: number;
    byDepartment: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    const departmentsByKey = getAgentsByDepartment();
    const byDepartment: Record<string, number> = {};
    const byLevel: Record<string, number> = {
      executive_council: 0,
      department_director: 0,
      squad_leader: 0,
      specialist: 0
    };

    for (const [dept, agents] of Object.entries(departmentsByKey)) {
      byDepartment[dept] = agents.length;
    }

    for (const role of Object.values(ORGANIZATIONAL_STRUCTURE)) {
      byLevel[role.level]++;
    }

    return {
      agencyInfo: {
        name: AGENCY_NAME,
        tagline: AGENCY_TAGLINE,
        vision: AGENCY_VISION,
        mission: AGENCY_MISSION
      },
      totalEmployees: Object.keys(ORGANIZATIONAL_STRUCTURE).length,
      byDepartment,
      byLevel
    };
  }

  private generateEmployeeProfile(agentName: string, employeeId: string, role: AgencyRole): EmployeeProfile {
    return {
      employeeId,
      agentName,
      displayName: role.roleName,
      displayNameEs: role.roleNameEs,
      role,
      hireDate: getCurrentDate(),
      status: "active",
      expertiseLevel: role.level === "executive_council" ? "principal" : 
                      role.level === "department_director" ? "lead" : "senior",
      specializations: role.responsibilities.slice(0, 3),
      certifications: [],
      performanceSummary: {
        analysesCompleted: 0,
        averageScore: 0,
        successRate: 0,
        lastEvaluation: null
      },
      evolutionTrack: {
        currentPhase: "Onboarding",
        nextMilestone: "Primera evaluación de 30 días",
        progressPercentage: 0
      }
    };
  }

  private generateEmployeeCharter(agentName: string, role: AgencyRole): string {
    const reportingChain = getReportingChain(agentName);
    const directReportsText = role.directReports.length > 0 
      ? role.directReports.join(", ") 
      : "Ninguno (Especialista)";
    const reportsToText = role.reportsTo || "Consejo Ejecutivo (Posición de liderazgo)";

    return `# Carta de Rol: ${role.roleNameEs}

## Información del Puesto

**Nombre del Rol:** ${role.roleName}
**Nombre en Español:** ${role.roleNameEs}
**ID del Rol:** ${role.roleId}
**Departamento:** ${DEPARTMENT_NAMES[role.department]}
**Nivel:** ${role.level}

---

## Estructura de Reporte

**Reporta a:** ${reportsToText}
**Reportes Directos:** ${directReportsText}
**Cadena de Mando:** ${reportingChain.length > 0 ? reportingChain.join(" → ") : "N/A"}

---

## Responsabilidades Principales

${role.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

---

## Autoridad de Decisión

${role.decisionAuthority.map(d => `- ${d}`).join("\n")}

---

## Indicadores Clave de Desempeño (KPIs)

| Métrica | Objetivo | Unidad | Frecuencia |
|---------|----------|--------|------------|
${role.kpis.map(k => `| ${k.metric} | ${k.target} | ${k.unit} | ${k.frequency} |`).join("\n")}

---

## Colaboración

**Trabaja con:** ${role.collaborationWith.join(", ")}

---

## Contexto de la Agencia

**Agencia:** ${AGENCY_NAME}
**Tagline:** ${AGENCY_TAGLINE}

**Visión:** ${AGENCY_VISION}

**Misión:** ${AGENCY_MISSION}

---

*Documento generado automáticamente el ${getCurrentDate()}*
*Este documento define el alcance y expectativas del rol dentro de Brujer.ia Digital Agency*
`;
  }

  private generateServiceCanvas(agentName: string, employeeId: string, role: AgencyRole): ServiceCanvas {
    const internalClients: Array<{
      clientId: string;
      relationship: "serves" | "collaborates" | "advises";
      frequency: "every_analysis" | "on_demand" | "periodic";
    }> = [];

    if (role.reportsTo) {
      internalClients.push({ 
        clientId: role.reportsTo, 
        relationship: "serves", 
        frequency: "every_analysis" 
      });
    }

    for (const report of role.directReports) {
      internalClients.push({
        clientId: report,
        relationship: "advises",
        frequency: "every_analysis"
      });
    }

    return {
      employeeId,
      valueProposition: `${role.roleNameEs}: ${role.responsibilities[0]}`,
      internalClients,
      inputs: [
        { name: "Datos de sitio web scrapeado", source: "Scraping_Orchestrator", format: "JSON", required: true },
        { name: "Contexto de análisis", source: "Benchmarking_Manager", format: "JSON", required: true }
      ],
      outputs: [
        { name: "Análisis especializado", destination: role.reportsTo || "Cliente final", format: "JSON", sla: "< 10 segundos" },
        { name: "Recomendaciones", destination: "Reporte final", format: "Array de strings", sla: "< 10 segundos" }
      ],
      keyActivities: role.responsibilities,
      keyResources: [
        "Modelo de lenguaje GPT-4",
        "Base de conocimiento especializada",
        "Historial de análisis previos",
        "Framework de evaluación del dominio"
      ],
      qualityMetrics: role.kpis.map(k => ({
        metric: k.metric,
        threshold: k.target,
        unit: k.unit
      }))
    };
  }

  private generateInitialPerformanceMetrics(employeeId: string): PerformanceMetrics {
    return {
      employeeId,
      period: getCurrentQuarter(),
      metrics: {
        qualityScore: 0,
        consistencyScore: 0,
        innovationScore: 0,
        collaborationScore: 0,
        learningVelocity: 0
      },
      kpiResults: [],
      achievements: [],
      developmentAreas: [
        {
          area: "Calibración de análisis",
          currentLevel: 1,
          targetLevel: 5,
          actionPlan: "Completar 10 análisis y recibir feedback del Director"
        }
      ],
      feedback: []
    };
  }

  private generateInitialLearningAgenda(employeeId: string, role: AgencyRole): LearningAgenda {
    return {
      employeeId,
      quarter: getCurrentQuarter(),
      objectives: [
        {
          objectiveId: `obj_${Date.now().toString(36)}_1`,
          title: "Familiarización con el dominio",
          description: `Dominar las ${role.responsibilities.length} responsabilidades core del puesto`,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "in_progress",
          progress: 0,
          evidence: []
        },
        {
          objectiveId: `obj_${Date.now().toString(36)}_2`,
          title: "Integración con el equipo",
          description: `Establecer colaboración efectiva con ${role.collaborationWith.join(", ")}`,
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          progress: 0,
          evidence: []
        }
      ],
      learningBacklog: role.responsibilities.map((resp, i) => ({
        topic: resp,
        priority: i === 0 ? "critical" as const : i < 3 ? "high" as const : "medium" as const,
        source: "Práctica en análisis reales",
        estimatedEffort: "1 semana",
        rationale: "Responsabilidad core del puesto"
      })),
      completedLearnings: []
    };
  }
}

export function getOrganizationalStructureService(): OrganizationalStructureService {
  return OrganizationalStructureService.getInstance();
}

export { 
  FOLDER_STRUCTURE, 
  DEPARTMENT_NAMES, 
  getEmployeeFolders, 
  getDepartmentPath,
  getCurrentQuarter,
  getCurrentDate
};
