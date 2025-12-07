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
  RoleJustification,
  RoleJustificationSchema,
  Department,
  OrganizationalLevel,
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

function generateAgentName(roleName: string): string {
  return roleName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
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

  async proposeNewRole(proposal: {
    proposedRole: {
      roleName: string;
      roleNameEs: string;
      department: Department;
      level: OrganizationalLevel;
      reportsTo: string;
    };
    justification: {
      gapIdentified: string;
      evidenceOfNeed: string[];
      expectedContribution: string;
      tangibleBenefits: string[];
      estimatedROI: string;
    };
    proposedBy: string;
  }): Promise<RoleJustification> {
    const proposalId = `prop_${Date.now().toString(36)}`;
    const proposedDate = getCurrentDate();

    const roleJustification: RoleJustification = {
      proposalId,
      proposedRole: proposal.proposedRole,
      justification: proposal.justification,
      proposedBy: proposal.proposedBy,
      proposedDate,
      reviewStatus: "submitted",
      reviewerComments: [],
      implementationStatus: {
        bootstrapped: false,
      },
    };

    const validated = RoleJustificationSchema.parse(roleJustification);

    await this.pcloud.ensureFolderPath(FOLDER_STRUCTURE.proposals);
    await this.pcloud.uploadJsonFile(
      FOLDER_STRUCTURE.proposals,
      `${proposalId}.json`,
      validated
    );

    console.log(`Propuesta de nuevo rol creada: ${proposalId} - ${proposal.proposedRole.roleName}`);

    return validated;
  }

  async listRoleProposals(): Promise<RoleJustification[]> {
    try {
      const files = await this.pcloud.listJsonFiles(FOLDER_STRUCTURE.proposals);
      const proposals: RoleJustification[] = [];

      for (const file of files) {
        if (file.name.startsWith('prop_') && file.name.endsWith('.json')) {
          try {
            const proposal = await this.pcloud.downloadJsonFile<RoleJustification>(
              `${FOLDER_STRUCTURE.proposals}/${file.name}`
            );
            proposals.push(proposal);
          } catch (error) {
            console.error(`Error loading proposal ${file.name}:`, error);
          }
        }
      }

      return proposals.sort((a, b) => 
        new Date(b.proposedDate).getTime() - new Date(a.proposedDate).getTime()
      );
    } catch {
      return [];
    }
  }

  async getRoleProposal(proposalId: string): Promise<RoleJustification | null> {
    try {
      const proposal = await this.pcloud.downloadJsonFile<RoleJustification>(
        `${FOLDER_STRUCTURE.proposals}/${proposalId}.json`
      );
      return proposal;
    } catch {
      return null;
    }
  }

  async addReviewComment(
    proposalId: string,
    reviewerId: string,
    comment: string,
    decision?: 'approve' | 'reject' | 'request_changes'
  ): Promise<void> {
    const proposal = await this.getRoleProposal(proposalId);
    
    if (!proposal) {
      throw new Error(`Propuesta no encontrada: ${proposalId}`);
    }

    proposal.reviewerComments.push({
      reviewerId,
      date: getCurrentDate(),
      comment,
      decision,
    });

    if (decision === 'request_changes') {
      proposal.reviewStatus = 'under_review';
    }

    const validated = RoleJustificationSchema.parse(proposal);
    await this.pcloud.uploadJsonFile(
      FOLDER_STRUCTURE.proposals,
      `${proposalId}.json`,
      validated
    );

    console.log(`Comentario agregado a propuesta ${proposalId} por ${reviewerId}`);
  }

  async approveRole(
    proposalId: string,
    approverId: string,
    notes?: string
  ): Promise<{ success: boolean; employeeId?: string }> {
    const proposal = await this.getRoleProposal(proposalId);
    
    if (!proposal) {
      throw new Error(`Propuesta no encontrada: ${proposalId}`);
    }

    if (proposal.reviewStatus === 'approved' || proposal.reviewStatus === 'implemented') {
      throw new Error(`La propuesta ya fue aprobada`);
    }

    proposal.reviewerComments.push({
      reviewerId: approverId,
      date: getCurrentDate(),
      comment: notes || 'Propuesta aprobada',
      decision: 'approve',
    });

    proposal.reviewStatus = 'approved';

    const agentName = generateAgentName(proposal.proposedRole.roleName);
    
    const newRole: AgencyRole = {
      roleId: `role_${Date.now().toString(36)}`,
      roleName: proposal.proposedRole.roleName,
      roleNameEs: proposal.proposedRole.roleNameEs,
      level: proposal.proposedRole.level,
      department: proposal.proposedRole.department,
      reportsTo: proposal.proposedRole.reportsTo,
      directReports: [],
      responsibilities: [proposal.justification.expectedContribution],
      decisionAuthority: [],
      kpis: [],
      collaborationWith: [proposal.proposedRole.reportsTo],
    };

    (ORGANIZATIONAL_STRUCTURE as Record<string, AgencyRole>)[agentName] = newRole;

    try {
      const bootstrapResult = await this.bootstrapEmployee(agentName);
      
      proposal.implementationStatus = {
        bootstrapped: true,
        day30Audit: { completed: false },
        day90Audit: { completed: false },
      };
      proposal.reviewStatus = 'implemented';

      const validated = RoleJustificationSchema.parse(proposal);
      await this.pcloud.uploadJsonFile(
        FOLDER_STRUCTURE.proposals,
        `${proposalId}.json`,
        validated
      );

      console.log(`Rol aprobado e implementado: ${agentName} (${bootstrapResult.employeeId})`);

      return {
        success: true,
        employeeId: bootstrapResult.employeeId,
      };
    } catch (error) {
      console.error(`Error al crear empleado para rol aprobado:`, error);
      
      const validated = RoleJustificationSchema.parse(proposal);
      await this.pcloud.uploadJsonFile(
        FOLDER_STRUCTURE.proposals,
        `${proposalId}.json`,
        validated
      );

      return {
        success: false,
      };
    }
  }

  async rejectRole(
    proposalId: string,
    rejecterId: string,
    reason: string
  ): Promise<void> {
    const proposal = await this.getRoleProposal(proposalId);
    
    if (!proposal) {
      throw new Error(`Propuesta no encontrada: ${proposalId}`);
    }

    if (proposal.reviewStatus === 'approved' || proposal.reviewStatus === 'implemented') {
      throw new Error(`No se puede rechazar una propuesta ya aprobada`);
    }

    proposal.reviewerComments.push({
      reviewerId: rejecterId,
      date: getCurrentDate(),
      comment: reason,
      decision: 'reject',
    });

    proposal.reviewStatus = 'rejected';

    const validated = RoleJustificationSchema.parse(proposal);
    await this.pcloud.uploadJsonFile(
      FOLDER_STRUCTURE.proposals,
      `${proposalId}.json`,
      validated
    );

    console.log(`Propuesta rechazada: ${proposalId} por ${rejecterId}`);
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
          priority: "critical" as const,
          status: "in_progress",
          progress: 0,
          evidence: []
        },
        {
          objectiveId: `obj_${Date.now().toString(36)}_2`,
          title: "Integración con el equipo",
          description: `Establecer colaboración efectiva con ${role.collaborationWith.join(", ")}`,
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: "high" as const,
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

  async addLearningObjective(
    agentName: string,
    objective: {
      title: string;
      description: string;
      targetDate: string;
      priority?: "critical" | "high" | "medium" | "low";
    }
  ): Promise<{ objectiveId: string }> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const objectiveId = `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    
    const newObjective = {
      objectiveId,
      title: objective.title,
      description: objective.description,
      targetDate: objective.targetDate,
      priority: objective.priority || "medium" as const,
      status: "not_started" as const,
      progress: 0,
      evidence: [],
    };

    agenda.objectives.push(newObjective);
    
    const validated = LearningAgendaSchema.parse(agenda);
    const folders = getEmployeeFolders(agentName);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);

    console.log(`Objetivo de aprendizaje agregado para ${agentName}: ${objective.title}`);

    return { objectiveId };
  }

  async updateLearningObjectiveProgress(
    agentName: string,
    objectiveId: string,
    updates: {
      progress?: number;
      status?: "not_started" | "in_progress" | "completed" | "deferred";
      evidence?: string[];
    }
  ): Promise<void> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const objectiveIndex = agenda.objectives.findIndex(o => o.objectiveId === objectiveId);
    
    if (objectiveIndex === -1) {
      throw new Error(`Objetivo no encontrado: ${objectiveId}`);
    }

    const objective = agenda.objectives[objectiveIndex];
    
    if (updates.progress !== undefined) {
      objective.progress = Math.max(0, Math.min(100, updates.progress));
    }
    
    if (updates.status !== undefined) {
      objective.status = updates.status;
    }
    
    if (updates.evidence !== undefined) {
      objective.evidence = [...objective.evidence, ...updates.evidence];
    }

    if (objective.progress >= 100 && objective.status !== "completed") {
      objective.status = "completed";
    }

    agenda.objectives[objectiveIndex] = objective;
    
    const validated = LearningAgendaSchema.parse(agenda);
    const folders = getEmployeeFolders(agentName);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);

    console.log(`Objetivo ${objectiveId} actualizado para ${agentName}: progreso=${objective.progress}%, status=${objective.status}`);
  }

  async completeLearningObjective(
    agentName: string,
    objectiveId: string,
    evidence: string[]
  ): Promise<void> {
    await this.updateLearningObjectiveProgress(agentName, objectiveId, {
      progress: 100,
      status: "completed",
      evidence,
    });

    console.log(`Objetivo de aprendizaje completado para ${agentName}: ${objectiveId}`);
  }

  async addToLearningBacklog(
    agentName: string,
    topic: {
      topic: string;
      priority: "critical" | "high" | "medium" | "low";
      source: string;
      estimatedEffort: string;
      rationale: string;
    }
  ): Promise<void> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const existingTopic = agenda.learningBacklog.find(
      t => t.topic.toLowerCase() === topic.topic.toLowerCase()
    );
    
    if (existingTopic) {
      existingTopic.priority = topic.priority;
      existingTopic.rationale = topic.rationale;
    } else {
      agenda.learningBacklog.push(topic);
    }

    agenda.learningBacklog.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const validated = LearningAgendaSchema.parse(agenda);
    const folders = getEmployeeFolders(agentName);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);

    console.log(`Tema agregado al backlog de ${agentName}: ${topic.topic} (${topic.priority})`);
  }

  async recordLearning(
    agentName: string,
    learning: {
      topic: string;
      impact: string;
      appliedIn: string[];
    }
  ): Promise<void> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const completedLearning = {
      topic: learning.topic,
      completedDate: getCurrentDate(),
      impact: learning.impact,
      appliedIn: learning.appliedIn,
    };

    agenda.completedLearnings.push(completedLearning);

    const backlogIndex = agenda.learningBacklog.findIndex(
      t => t.topic.toLowerCase() === learning.topic.toLowerCase()
    );
    
    if (backlogIndex !== -1) {
      agenda.learningBacklog.splice(backlogIndex, 1);
    }

    const validated = LearningAgendaSchema.parse(agenda);
    const folders = getEmployeeFolders(agentName);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);

    const metrics = await this.getPerformanceMetrics(agentName);
    if (metrics) {
      const currentVelocity = metrics.metrics.learningVelocity;
      await this.updatePerformanceMetrics(agentName, {
        metrics: {
          ...metrics.metrics,
          learningVelocity: currentVelocity + 1,
        },
      });
    }

    console.log(`Aprendizaje registrado para ${agentName}: ${learning.topic}`);
  }

  async getLearningProgress(agentName: string): Promise<{
    employeeId: string;
    quarter: string;
    summary: {
      totalObjectives: number;
      completedObjectives: number;
      inProgressObjectives: number;
      overallProgress: number;
      backlogSize: number;
      completedLearnings: number;
    };
    objectives: Array<{
      objectiveId: string;
      title: string;
      status: string;
      progress: number;
      targetDate: string;
      isOverdue: boolean;
    }>;
    recentLearnings: Array<{
      topic: string;
      completedDate: string;
      impact: string;
    }>;
    priorityBacklog: Array<{
      topic: string;
      priority: string;
    }>;
  }> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const today = new Date();
    const completedObjectives = agenda.objectives.filter(o => o.status === "completed").length;
    const inProgressObjectives = agenda.objectives.filter(o => o.status === "in_progress").length;
    const totalProgress = agenda.objectives.length > 0
      ? Math.round(agenda.objectives.reduce((sum, o) => sum + o.progress, 0) / agenda.objectives.length)
      : 0;

    return {
      employeeId: agenda.employeeId,
      quarter: agenda.quarter,
      summary: {
        totalObjectives: agenda.objectives.length,
        completedObjectives,
        inProgressObjectives,
        overallProgress: totalProgress,
        backlogSize: agenda.learningBacklog.length,
        completedLearnings: agenda.completedLearnings.length,
      },
      objectives: agenda.objectives.map(o => ({
        objectiveId: o.objectiveId,
        title: o.title,
        status: o.status,
        progress: o.progress,
        targetDate: o.targetDate,
        isOverdue: new Date(o.targetDate) < today && o.status !== "completed",
      })),
      recentLearnings: agenda.completedLearnings.slice(-5).reverse().map(l => ({
        topic: l.topic,
        completedDate: l.completedDate,
        impact: l.impact,
      })),
      priorityBacklog: agenda.learningBacklog.slice(0, 5).map(t => ({
        topic: t.topic,
        priority: t.priority,
      })),
    };
  }

  async promoteBacklogToObjective(
    agentName: string,
    topic: string,
    targetDate: string
  ): Promise<{ objectiveId: string }> {
    const agenda = await this.getLearningAgenda(agentName);
    
    if (!agenda) {
      throw new Error(`No se encontró agenda de aprendizaje para el empleado: ${agentName}`);
    }

    const backlogIndex = agenda.learningBacklog.findIndex(
      t => t.topic.toLowerCase() === topic.toLowerCase()
    );
    
    if (backlogIndex === -1) {
      throw new Error(`Tema no encontrado en backlog: ${topic}`);
    }

    const backlogItem = agenda.learningBacklog[backlogIndex];

    const result = await this.addLearningObjective(agentName, {
      title: backlogItem.topic,
      description: backlogItem.rationale,
      targetDate,
      priority: backlogItem.priority,
    });

    agenda.learningBacklog.splice(backlogIndex, 1);
    
    const validated = LearningAgendaSchema.parse(agenda);
    const folders = getEmployeeFolders(agentName);
    await this.pcloud.uploadJsonFile(folders.learning, "learning-agenda.json", validated);

    console.log(`Tema promovido de backlog a objetivo para ${agentName}: ${topic}`);

    return result;
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
