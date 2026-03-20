import { useState, useCallback, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Panel, type Node, type Edge, type Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Play, Pause, Plus, Zap, Mail, Clock, Users, GitBranch, MessageSquare, Bell, Tag, Star, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useSkin } from "@/contexts/SkinContext";

// ─── Node Types ───────────────────────────────────────────────────────────────
const NODE_TYPES_CONFIG = [
  { type: "trigger", label: "Trigger", icon: Zap, color: "#f97316", description: "Start the workflow" },
  { type: "send_email", label: "Send Email", icon: Mail, color: "#3b82f6", description: "Send an email to the contact" },
  { type: "wait", label: "Wait", icon: Clock, color: "#8b5cf6", description: "Wait for a time period" },
  { type: "if_condition", label: "If / Then", icon: GitBranch, color: "#10b981", description: "Branch based on condition" },
  { type: "add_tag", label: "Add Tag", icon: Tag, color: "#f59e0b", description: "Add a tag to the contact" },
  { type: "update_field", label: "Update Field", icon: Star, color: "#ec4899", description: "Update a contact field" },
  { type: "notify_team", label: "Notify Team", icon: Bell, color: "#6366f1", description: "Send internal notification" },
  { type: "create_task", label: "Create Task", icon: Users, color: "#14b8a6", description: "Create a follow-up task" },
  { type: "send_sms", label: "Send SMS", icon: MessageSquare, color: "#f43f5e", description: "Send an SMS message" },
];

function TriggerNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="bg-orange-500 text-white rounded-lg px-4 py-3 min-w-[160px] shadow-lg border-2 border-orange-400">
      <div className="flex items-center gap-2 font-semibold text-sm"><Zap className="h-4 w-4" />{String(data.label ?? "")}</div>
      <div className="text-xs opacity-80 mt-1">{String(data.triggerType ?? "trigger")}</div>
    </div>
  );
}

function ActionNode({ data }: { data: Record<string, unknown> }) {
  const cfg = NODE_TYPES_CONFIG.find(n => n.type === data.nodeType) ?? NODE_TYPES_CONFIG[1];
  const Icon = cfg.icon;
  return (
    <div className="bg-card border-2 rounded-lg px-4 py-3 min-w-[160px] shadow-md" style={{ borderColor: cfg.color }}>
      <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: cfg.color }}>
        <Icon className="h-4 w-4" />{String(data.label ?? "")}
      </div>
      {!!data.description && <div className="text-xs text-muted-foreground mt-1">{String(data.description)}</div>}
    </div>
  );
}

const nodeTypes = { trigger: TriggerNode, action: ActionNode };

const TRIGGER_TYPES = [
  { value: "contact_created", label: "Contact Created" },
  { value: "deal_stage_changed", label: "Deal Stage Changed" },
  { value: "email_opened", label: "Email Opened" },
  { value: "form_submitted", label: "Form Submitted" },
  { value: "tag_added", label: "Tag Added" },
  { value: "time_based", label: "Time-Based" },
];

export default function WorkflowBuilder({
  params }: { params?: { id?: string } }) {
  const { t } = useSkin();
  const [, navigate] = useLocation();
  const workflowId = params?.id ? parseInt(params.id) : null;
  const [name, setName] = useState("New Workflow");
  const [triggerType, setTriggerType] = useState("contact_created");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: "trigger-1", type: "trigger", position: { x: 300, y: 50 }, data: { label: "Trigger", triggerType: "contact_created" } },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(!workflowId);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newTriggerType, setNewTriggerType] = useState("contact_created");
  const [status, setStatus] = useState<"draft" | "active" | "paused">("draft");
  const nodeIdRef = useRef(2);

  const { data: workflow } = trpc.workflowBuilder.get.useQuery(
    { id: workflowId! },
    {
      enabled: !!workflowId,
      onSuccess: (wf: any) => {
        if (wf) {
          setName(wf.name);
          setTriggerType(wf.triggerType);
          setStatus(wf.status);
          if (wf.nodesJson?.length) setNodes(wf.nodesJson as Node[]);
          if (wf.edgesJson?.length) setEdges(wf.edgesJson as Edge[]);
        }
      },
    } as any
  );

  const createMutation = trpc.workflowBuilder.create.useMutation();
  const saveMutation = trpc.workflowBuilder.save.useMutation();
  const setStatusMutation = trpc.workflowBuilder.setStatus.useMutation();
  const utils = trpc.useUtils();

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const addNode = (type: typeof NODE_TYPES_CONFIG[0]) => {
    const id = `node-${nodeIdRef.current++}`;
    const newNode: Node = {
      id,
      type: "action",
      position: { x: 200 + Math.random() * 200, y: 200 + nodes.length * 120 },
      data: { label: type.label, nodeType: type.type, description: type.description },
    };
    setNodes(nds => [...nds, newNode]);
    setShowAddNode(false);
  };

  const handleSave = async () => {
    if (!workflowId) return;
    try {
      await saveMutation.mutateAsync({ id: workflowId, name, nodesJson: nodes, edgesJson: edges, triggerType });
      toast.success("Workflow saved");
      utils.workflowBuilder.list.invalidate();
    } catch { toast.error("Save failed"); }
  };

  const handleToggleStatus = async () => {
    if (!workflowId) return;
    const newStatus = status === "active" ? "paused" : "active";
    try {
      await setStatusMutation.mutateAsync({ id: workflowId, status: newStatus });
      setStatus(newStatus);
      toast.success(newStatus === "active" ? "Workflow activated" : "Workflow paused");
    } catch { toast.error("Status update failed"); }
  };

  const handleCreate = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({ name: newWorkflowName, triggerType: newTriggerType });
      toast.success("Workflow created");
      navigate(`/workflows/builder/${result.id}`);
      setShowCreateDialog(false);
    } catch { toast.error("Create failed"); }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={() => navigate("/workflows")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
        <Input value={name} onChange={e => setName(e.target.value)} className="max-w-[240px] h-8 font-semibold" />
        <Badge variant={status === "active" ? "default" : "secondary"} className={status === "active" ? "bg-green-500" : ""}>
          {status}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddNode(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Step
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleStatus} disabled={!workflowId}>
            {status === "active" ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Activate</>}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!workflowId || saveMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />Save
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/20"
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-left">
            <Card className="w-48 shadow-lg">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trigger</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Select value={triggerType} onValueChange={val => { setTriggerType(val); setNodes(nds => nds.map(n => n.id === "trigger-1" ? { ...n, data: { ...n.data, triggerType: val } } : n)); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Add Node Dialog */}
      <Dialog open={showAddNode} onOpenChange={setShowAddNode}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Workflow Step</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {NODE_TYPES_CONFIG.filter(n => n.type !== "trigger").map(type => {
              const Icon = type.icon;
              return (
                <button key={type.type} onClick={() => addNode(type)}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left">
                  <div className="p-2 rounded-md" style={{ backgroundColor: type.color + "20" }}>
                    <Icon className="h-4 w-4" style={{ color: type.color }} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={open => { if (!open && !workflowId) navigate("/workflows"); else setShowCreateDialog(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Workflow Name</Label>
              <Input value={newWorkflowName} onChange={e => setNewWorkflowName(e.target.value)} placeholder="e.g. New Lead Nurture Sequence" className="mt-1" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={newTriggerType} onValueChange={setNewTriggerType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => navigate("/workflows")}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newWorkflowName.trim() || createMutation.isPending}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
