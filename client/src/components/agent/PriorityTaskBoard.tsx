import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PrioritizedTask } from "@/lib/mock-agent";
import { 
  LayoutGrid, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Target,
  Code,
  Layers
} from "lucide-react";

interface PriorityTaskBoardProps {
  tasks: PrioritizedTask[];
}

type TaskStatus = "pending" | "in_progress" | "completed";

interface TaskWithStatus extends PrioritizedTask {
  status: TaskStatus;
}

const PRIORITY_CONFIG = {
  "P0-CRITICAL": {
    label: "Critical",
    color: "bg-red-500",
    textColor: "text-red-500",
    bgColor: "bg-red-950/20",
    borderColor: "border-red-900/30",
    icon: AlertTriangle,
  },
  "P1-HIGH": {
    label: "High Priority",
    color: "bg-amber-500",
    textColor: "text-amber-500",
    bgColor: "bg-amber-950/20",
    borderColor: "border-amber-900/30",
    icon: Zap,
  },
  "P2-MEDIUM": {
    label: "Medium Priority",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgColor: "bg-blue-950/20",
    borderColor: "border-blue-900/30",
    icon: Target,
  },
} as const;

const DEPARTMENT_ICONS: Record<string, React.ElementType> = {
  "Development": Code,
  "Design": Layers,
  "Marketing": Users,
  "default": Target,
};

function getDepartmentIcon(department: string): React.ElementType {
  return DEPARTMENT_ICONS[department] || DEPARTMENT_ICONS.default;
}

function TaskCard({ task, onToggleStatus }: { task: TaskWithStatus; onToggleStatus: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG["P2-MEDIUM"];
  const DepartmentIcon = getDepartmentIcon(task.department);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} overflow-hidden`}
      data-testid={`task-card-${task.id}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${config.bgColor} ${config.textColor}`}>
                  <DepartmentIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.department}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {task.problem}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{task.estimated_hours}h</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 transition-colors ${task.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-emerald-500'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task.id);
                  }}
                  aria-pressed={task.status === 'completed'}
                  aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                  data-testid={`toggle-task-${task.id}`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${task.status === 'completed' ? 'fill-emerald-500/20' : ''}`} />
                </Button>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Problem</h5>
              <p className="text-sm text-foreground">{task.problem}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Solution</h5>
              <p className="text-sm text-foreground">{task.solution}</p>
            </div>
            {task.success_metrics && task.success_metrics.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Success Metrics</h5>
                <ul className="space-y-1">
                  {task.success_metrics.map((metric, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Target className="w-3 h-3 text-primary mt-1 shrink-0" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {task.replit_code && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Implementation Code</h5>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto font-mono">
                  {task.replit_code}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function PriorityColumn({ 
  priority, 
  tasks, 
  onToggleStatus 
}: { 
  priority: keyof typeof PRIORITY_CONFIG; 
  tasks: TaskWithStatus[]; 
  onToggleStatus: (id: string) => void;
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className={`flex flex-col rounded-xl border ${config.borderColor} ${config.bgColor} min-h-[400px]`}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.color}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`font-semibold ${config.textColor}`}>{config.label}</h3>
          </div>
          <Badge variant="secondary" className="font-mono">
            {completedCount}/{tasks.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleStatus={onToggleStatus} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks in this priority level
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function PriorityTaskBoard({ tasks }: PriorityTaskBoardProps) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});

  const tasksWithStatus: TaskWithStatus[] = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      status: taskStatuses[task.id] || "pending",
    }));
  }, [tasks, taskStatuses]);

  const tasksByPriority = useMemo(() => {
    return {
      "P0-CRITICAL": tasksWithStatus.filter(t => t.priority === "P0-CRITICAL"),
      "P1-HIGH": tasksWithStatus.filter(t => t.priority === "P1-HIGH"),
      "P2-MEDIUM": tasksWithStatus.filter(t => t.priority === "P2-MEDIUM"),
    };
  }, [tasksWithStatus]);

  const totalTasks = tasks.length;
  const completedTasks = Object.values(taskStatuses).filter(s => s === 'completed').length;
  const totalHours = tasks.reduce((acc, t) => acc + t.estimated_hours, 0);
  const completedHours = tasksWithStatus
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.estimated_hours, 0);

  const handleToggleStatus = (taskId: string) => {
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: prev[taskId] === 'completed' ? 'pending' : 'completed',
    }));
  };

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed" data-testid="card-priority-task-board-empty">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Prioritized Tasks</h3>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md">
            No prioritized tasks are available for this analysis. This may occur with simplified analysis modes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-priority-task-board">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              Priority Task Board
            </CardTitle>
            <CardDescription>
              Actionable recommendations organized by priority level
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 text-sm">
            <div className="text-right sm:text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-primary">{completedTasks}/{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Tasks Done</div>
            </div>
            <div className="text-right sm:text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-500">{completedHours}h</div>
              <div className="text-xs text-muted-foreground">of {totalHours}h</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PriorityColumn 
            priority="P0-CRITICAL" 
            tasks={tasksByPriority["P0-CRITICAL"]} 
            onToggleStatus={handleToggleStatus}
          />
          <PriorityColumn 
            priority="P1-HIGH" 
            tasks={tasksByPriority["P1-HIGH"]} 
            onToggleStatus={handleToggleStatus}
          />
          <PriorityColumn 
            priority="P2-MEDIUM" 
            tasks={tasksByPriority["P2-MEDIUM"]} 
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </CardContent>
    </Card>
  );
}
