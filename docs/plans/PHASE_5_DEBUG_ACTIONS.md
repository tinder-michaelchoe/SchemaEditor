# Phase 5: State Debugger + Action Flow Editor - Detailed Plan

## Overview

Add runtime debugging tools and visual action authoring for CLADS interactive components.

## Plugin 1: `state-debugger`

**Purpose**: Inspect and modify runtime state for debugging

**Manifest**:
```typescript
manifest: {
  id: 'state-debugger',
  name: 'State Debugger',
  capabilities: [
    'document:read',
    'document:write',
    'ui:slots',
    'events:subscribe',
    'services:provide',
  ],
  slots: [
    { slot: 'sidebar:right', component: 'StateDebuggerPanel', priority: 50 },
    { slot: 'panel:bottom', component: 'ActionLogPanel', priority: 60 }
  ],
  provides: [
    { id: 'state-debugger', description: 'Runtime state inspection' }
  ],
  emits: [
    'debugger:state-changed',
    'debugger:action-executed',
    'debugger:breakpoint-hit',
  ],
}
```

### Service: `state-debugger`

```typescript
interface StateDebuggerService {
  // Get current state
  getState(): Record<string, unknown>;
  
  // Set state value (for testing)
  setState(path: string, value: unknown): void;
  
  // Subscribe to state changes
  onStateChange(callback: (changes: StateChange[]) => void): () => void;
  
  // Action logging
  getActionLog(): ActionLogEntry[];
  clearActionLog(): void;
  
  // Breakpoints
  setBreakpoint(actionId: string): void;
  removeBreakpoint(actionId: string): void;
  getBreakpoints(): string[];
  
  // Simulation
  simulateAction(action: Action): Promise<void>;
  simulateAPIResponse(endpoint: string, response: unknown): void;
}

interface StateChange {
  timestamp: number;
  path: string;
  oldValue: unknown;
  newValue: unknown;
  source: string;
}

interface ActionLogEntry {
  id: string;
  timestamp: number;
  action: Action;
  result: 'success' | 'error' | 'pending';
  duration: number;
  stateChanges: StateChange[];
  error?: Error;
}
```

### UI Components

#### `StateDebuggerPanel.tsx`

```typescript
function StateDebuggerPanel() {
  const debugger = useService<StateDebuggerService>('state-debugger');
  const state = debugger?.getState() || {};
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState('');
  
  return (
    <div className="state-debugger">
      <PanelHeader title="State Debugger">
        <Toggle label="Edit" value={editMode} onChange={setEditMode} />
      </PanelHeader>
      
      <SearchInput 
        placeholder="Filter state..." 
        value={filter} 
        onChange={setFilter} 
      />
      
      <StateTree 
        data={state} 
        filter={filter}
        editable={editMode}
        onValueChange={(path, value) => debugger?.setState(path, value)}
      />
    </div>
  );
}
```

#### `ActionLogPanel.tsx`

```typescript
function ActionLogPanel() {
  const debugger = useService<StateDebuggerService>('state-debugger');
  const [log, setLog] = useState<ActionLogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  
  useEffect(() => {
    setLog(debugger?.getActionLog() || []);
    return debugger?.onStateChange(() => {
      setLog(debugger.getActionLog());
    });
  }, [debugger]);
  
  return (
    <div className="action-log">
      <PanelHeader title="Action Log">
        <Button onClick={() => debugger?.clearActionLog()}>Clear</Button>
      </PanelHeader>
      
      <div className="log-entries">
        {log.map(entry => (
          <ActionLogEntry
            key={entry.id}
            entry={entry}
            isSelected={selectedEntry === entry.id}
            onClick={() => setSelectedEntry(entry.id)}
          />
        ))}
      </div>
      
      {selectedEntry && (
        <ActionDetail entry={log.find(e => e.id === selectedEntry)} />
      )}
    </div>
  );
}

function ActionLogEntry({ entry, isSelected, onClick }) {
  const statusIcon = {
    success: '✅',
    error: '❌',
    pending: '⏳',
  }[entry.result];
  
  return (
    <div 
      className={`log-entry ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="status">{statusIcon}</span>
      <span className="action-type">{entry.action.type}</span>
      <span className="duration">{entry.duration}ms</span>
      <span className="time">{formatTime(entry.timestamp)}</span>
    </div>
  );
}
```

### UI Mockup: State Debugger

```
┌────────────────────────────────┐
│ 🔧 State Debugger    [✏️ Edit] │
├────────────────────────────────┤
│ [🔍 Filter state...          ] │
├────────────────────────────────┤
│ ▼ user                         │
│   ├─ id: "user_123"            │
│   ├─ name: "John Doe"          │
│   └─ isLoggedIn: true          │
│                                │
│ ▼ cart                         │
│   ├─ items: [3 items]          │
│   │   ├─ [0]: {...}            │
│   │   ├─ [1]: {...}            │
│   │   └─ [2]: {...}            │
│   └─ total: 149.99             │
│                                │
│ ▶ ui                           │
│ ▶ navigation                   │
├────────────────────────────────┤
│ 💉 Simulate                    │
│ [Set state...] [Mock API...]   │
└────────────────────────────────┘
```

### UI Mockup: Action Log

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📜 Action Log                                              [Clear] │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ navigate          /home → /cart                    12ms  10:23  │
│ ✅ fetch             GET /api/cart                   234ms  10:23  │
│ ✅ setState          cart.items = [...]               1ms  10:23  │
│ ❌ submit            POST /api/checkout              err!  10:24  │
│    └─ Error: Payment failed                                        │
│ ⏳ retry             POST /api/checkout              ...   10:24  │
├─────────────────────────────────────────────────────────────────────┤
│ Selected: submit                                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Type: submit                                                    │ │
│ │ Target: checkout-form                                           │ │
│ │ Payload: { items: [...], payment: {...} }                      │ │
│ │ Error: PaymentError: Card declined                              │ │
│ │ State Changes: cart.status: "pending" → "error"                │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Plugin 2: `action-flow-editor`

**Purpose**: Visual editor for creating action sequences

**Manifest**:
```typescript
manifest: {
  id: 'action-flow-editor',
  name: 'Action Flow Editor',
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'ui:slots',
    'events:emit',
    'extensions:provide',
  ],
  slots: [
    { slot: 'panel:bottom', component: 'ActionFlowPanel', priority: 40 }
  ],
  extensionPoints: [
    {
      id: 'action-flow.nodeType',
      description: 'Custom action types for the flow editor',
    }
  ],
  emits: [
    'action-flow:node-added',
    'action-flow:connection-added',
    'action-flow:flow-saved',
  ],
}
```

### Action Flow Model

```typescript
interface ActionFlow {
  id: string;
  name: string;
  trigger: FlowTrigger;
  nodes: FlowNode[];
  connections: FlowConnection[];
}

interface FlowTrigger {
  type: 'tap' | 'load' | 'change' | 'submit' | 'custom';
  target?: string;
  condition?: string;
}

interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: unknown;
}

type FlowNodeType = 
  | 'navigate'
  | 'setState'
  | 'fetch'
  | 'condition'
  | 'delay'
  | 'animate'
  | 'showAlert'
  | 'log';

interface FlowConnection {
  id: string;
  sourceId: string;
  sourceHandle: string;
  targetId: string;
  targetHandle: string;
  condition?: string;
}
```

### UI Components

#### `ActionFlowPanel.tsx`

```typescript
function ActionFlowPanel() {
  const { selectedPath } = useSelectionStore();
  const selectedAction = useSelectedAction(selectedPath);
  const [flow, setFlow] = useState<ActionFlow | null>(null);
  
  // Load flow for selected action
  useEffect(() => {
    if (selectedAction) {
      setFlow(parseActionToFlow(selectedAction));
    }
  }, [selectedAction]);
  
  return (
    <div className="action-flow-panel">
      <PanelHeader title="Action Flow">
        <ActionPicker onSelect={handleAddAction} />
        <Button onClick={handleSave}>Save</Button>
      </PanelHeader>
      
      <div className="flow-canvas">
        <FlowCanvas
          nodes={flow?.nodes || []}
          connections={flow?.connections || []}
          onNodeMove={handleNodeMove}
          onConnect={handleConnect}
          onNodeSelect={handleNodeSelect}
        />
      </div>
      
      <div className="node-inspector">
        <NodeInspector 
          node={selectedNode} 
          onChange={handleNodeChange} 
        />
      </div>
    </div>
  );
}
```

#### `FlowCanvas.tsx`

```typescript
function FlowCanvas({ nodes, connections, onNodeMove, onConnect, onNodeSelect }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; handle: string } | null>(null);
  
  return (
    <div ref={canvasRef} className="flow-canvas-container">
      {/* Grid background */}
      <svg className="flow-grid">
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="var(--border-color)" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Connections */}
      <svg className="flow-connections">
        {connections.map(conn => (
          <FlowConnection key={conn.id} connection={conn} />
        ))}
        {connecting && (
          <DraftConnection from={connecting} />
        )}
      </svg>
      
      {/* Nodes */}
      {nodes.map(node => (
        <FlowNode
          key={node.id}
          node={node}
          onMove={(pos) => onNodeMove(node.id, pos)}
          onSelect={() => onNodeSelect(node.id)}
          onStartConnect={(handle) => setConnecting({ from: node.id, handle })}
          onEndConnect={(handle) => {
            if (connecting) {
              onConnect(connecting, { to: node.id, handle });
              setConnecting(null);
            }
          }}
        />
      ))}
    </div>
  );
}
```

### Flow Node Types

```typescript
const FLOW_NODE_TYPES = {
  navigate: {
    name: 'Navigate',
    icon: '🔗',
    color: '#3B82F6',
    inputs: ['trigger'],
    outputs: ['next'],
    fields: [
      { name: 'route', type: 'string', required: true },
      { name: 'params', type: 'object' },
    ],
  },
  
  setState: {
    name: 'Set State',
    icon: '📝',
    color: '#10B981',
    inputs: ['trigger'],
    outputs: ['next'],
    fields: [
      { name: 'path', type: 'string', required: true },
      { name: 'value', type: 'any', required: true },
    ],
  },
  
  fetch: {
    name: 'API Request',
    icon: '🌐',
    color: '#8B5CF6',
    inputs: ['trigger'],
    outputs: ['success', 'error'],
    fields: [
      { name: 'method', type: 'enum', options: ['GET', 'POST', 'PUT', 'DELETE'] },
      { name: 'url', type: 'string', required: true },
      { name: 'body', type: 'object' },
    ],
  },
  
  condition: {
    name: 'Condition',
    icon: '❓',
    color: '#F59E0B',
    inputs: ['trigger'],
    outputs: ['true', 'false'],
    fields: [
      { name: 'expression', type: 'string', required: true },
    ],
  },
  
  delay: {
    name: 'Delay',
    icon: '⏱️',
    color: '#6B7280',
    inputs: ['trigger'],
    outputs: ['next'],
    fields: [
      { name: 'duration', type: 'number', required: true },
    ],
  },
};
```

### UI Mockup: Action Flow Editor

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔀 Action Flow: onButtonTap          [+ Add Node] [Save] [Test]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌──────────┐                                                     │
│    │ 👆 Tap   │                                                     │
│    │ Button   │                                                     │
│    └────┬─────┘                                                     │
│         │                                                           │
│         ▼                                                           │
│    ┌──────────┐         ┌──────────┐                               │
│    │ 🌐 Fetch │─success─│ 📝 Set   │                               │
│    │ /api/buy │         │ State    │                               │
│    └────┬─────┘         └────┬─────┘                               │
│         │                    │                                      │
│         │ error              │                                      │
│         ▼                    ▼                                      │
│    ┌──────────┐         ┌──────────┐                               │
│    │ ⚠️ Alert │         │ 🔗 Go to │                               │
│    │ "Error!" │         │ /success │                               │
│    └──────────┘         └──────────┘                               │
│                                                                      │
├────────────────────────────────────┬────────────────────────────────┤
│ Node: Fetch                        │ Node: Set State                │
│ ┌────────────────────────────────┐ │ ┌────────────────────────────┐ │
│ │ Method: [POST ▾]               │ │ │ Path: cart.confirmed       │ │
│ │ URL: /api/buy                  │ │ │ Value: true                │ │
│ │ Body: { itemId: ${item.id} }   │ │ └────────────────────────────┘ │
│ └────────────────────────────────┘ │                                │
└────────────────────────────────────┴────────────────────────────────┘
```

## Integration with Preview

The state debugger integrates with the device preview:

```typescript
// In preview plugin
context.events?.subscribe?.('debugger:state-changed', (change) => {
  // Update preview with new state
  setPreviewState(change.path, change.newValue);
  rerender();
});

// Support breakpoints
context.events?.subscribe?.('debugger:breakpoint-hit', (action) => {
  pausePreview();
  highlightAction(action);
});
```

## Dependencies

- Phase 3 complete (canvas view for visual context)
- Preview plugin for runtime integration

## Estimated Effort

| Task | Estimate |
|------|----------|
| State debugger service | 1 day |
| State tree component | 1.5 days |
| Action log panel | 1.5 days |
| Action flow canvas | 3 days |
| Flow node types | 1 day |
| Node inspector | 1 day |
| Preview integration | 1 day |
| Testing and polish | 1 day |
| **Total** | **11 days** |

## Success Criteria

- [ ] State tree shows current runtime state
- [ ] State values can be edited in debug mode
- [ ] Action log shows all executed actions
- [ ] Action flow renders visual diagram
- [ ] Nodes can be added, moved, connected
- [ ] Flow changes update the document
- [ ] Breakpoints pause preview execution
- [ ] API responses can be mocked
