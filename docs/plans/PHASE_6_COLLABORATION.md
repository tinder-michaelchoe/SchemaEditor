# Phase 6: Collaboration Features - Detailed Plan

## Overview

Add team collaboration features including comments, real-time presence, version history, and approval workflows.

> **Note**: This phase requires backend infrastructure. Plans include both frontend plugins and backend requirements.

## Plugin 1: `comments`

**Purpose**: Anchor comments to specific components

**Manifest**:
```typescript
manifest: {
  id: 'comments',
  name: 'Comments',
  capabilities: [
    'document:read',
    'selection:read',
    'ui:slots',
    'events:emit',
    'events:subscribe',
    'services:consume',
  ],
  slots: [
    { slot: 'sidebar:right', component: 'CommentsPanel', priority: 30 },
    { slot: 'main:overlay', component: 'CommentBadges', priority: 100 }
  ],
  consumes: ['collaboration-service'],
  emits: [
    'comment:added',
    'comment:resolved',
    'comment:deleted',
  ],
}
```

### Data Model

```typescript
interface Comment {
  id: string;
  documentId: string;
  
  // Anchor to component
  anchorPath: string;
  anchorType: 'component' | 'property' | 'range';
  
  // Content
  content: string;
  attachments: Attachment[];
  
  // Threading
  parentId: string | null;
  replies: Comment[];
  
  // State
  status: 'open' | 'resolved' | 'wontfix';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Metadata
  author: User;
  createdAt: number;
  updatedAt: number;
  resolvedBy?: User;
  resolvedAt?: number;
  
  // Mentions
  mentions: string[];
}

interface CommentThread {
  id: string;
  anchorPath: string;
  comments: Comment[];
  status: 'open' | 'resolved';
  participantIds: string[];
}
```

### UI Components

#### `CommentsPanel.tsx`

```typescript
function CommentsPanel() {
  const collab = useService<CollaborationService>('collaboration-service');
  const { selectedPath } = useSelectionStore();
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [threads, setThreads] = useState<CommentThread[]>([]);
  
  useEffect(() => {
    return collab?.subscribeToComments((updated) => {
      setThreads(updated);
    });
  }, [collab]);
  
  const filteredThreads = threads.filter(t => {
    if (filter === 'open') return t.status === 'open';
    if (filter === 'resolved') return t.status === 'resolved';
    return true;
  });
  
  return (
    <div className="comments-panel">
      <PanelHeader title="Comments">
        <FilterTabs value={filter} onChange={setFilter} />
      </PanelHeader>
      
      {/* Quick add for selected component */}
      {selectedPath && (
        <QuickCommentInput 
          anchorPath={selectedPath} 
          onSubmit={handleAddComment} 
        />
      )}
      
      {/* Thread list */}
      <div className="thread-list">
        {filteredThreads.map(thread => (
          <CommentThread
            key={thread.id}
            thread={thread}
            onResolve={() => handleResolve(thread.id)}
            onReply={(content) => handleReply(thread.id, content)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### `CommentBadges.tsx`

Shows comment indicators on the canvas/tree:

```typescript
function CommentBadges() {
  const threads = useCommentThreads();
  
  return (
    <div className="comment-badges-layer">
      {threads.map(thread => (
        <CommentBadge
          key={thread.id}
          thread={thread}
          position={getNodePosition(thread.anchorPath)}
          onClick={() => scrollToThread(thread.id)}
        />
      ))}
    </div>
  );
}

function CommentBadge({ thread, position, onClick }) {
  const count = thread.comments.length;
  const hasUnread = thread.comments.some(c => !c.read);
  
  return (
    <button
      className={`comment-badge ${hasUnread ? 'unread' : ''}`}
      style={{ left: position.x, top: position.y }}
      onClick={onClick}
    >
      💬 {count}
    </button>
  );
}
```

### UI Mockup: Comments Panel

```
┌────────────────────────────────┐
│ 💬 Comments                    │
│ [All] [Open: 3] [Resolved: 5]  │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ Add comment on:            │ │
│ │ VStack > Button            │ │
│ │ [Write a comment...     ] │ │
│ │                   [Post]   │ │
│ └────────────────────────────┘ │
├────────────────────────────────┤
│                                │
│ ─────── Open (3) ──────────    │
│                                │
│ ┌────────────────────────────┐ │
│ │ 🔴 VStack > HStack         │ │
│ │ ┌──────────────────────┐   │ │
│ │ │ 👤 Sarah             │   │ │
│ │ │ Can we increase the  │   │ │
│ │ │ padding here?        │   │ │
│ │ │         2h ago       │   │ │
│ │ └──────────────────────┘   │ │
│ │ ┌──────────────────────┐   │ │
│ │ │ 👤 You               │   │ │
│ │ │ Done! Changed to 16  │   │ │
│ │ │         1h ago       │   │ │
│ │ └──────────────────────┘   │ │
│ │ [Reply...] [✓ Resolve]     │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 🟡 Header > Logo           │ │
│ │ Logo seems too large...    │ │
│ │ [Reply...] [✓ Resolve]     │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

## Plugin 2: `presence`

**Purpose**: Show real-time collaborator presence

**Manifest**:
```typescript
manifest: {
  id: 'presence',
  name: 'Presence',
  capabilities: [
    'ui:slots',
    'events:subscribe',
    'services:consume',
  ],
  slots: [
    { slot: 'header:right', component: 'PresenceAvatars', priority: 100 },
    { slot: 'main:overlay', component: 'PresenceCursors', priority: 50 }
  ],
  consumes: ['collaboration-service'],
}
```

### Data Model

```typescript
interface Presence {
  id: string;
  user: User;
  documentId: string;
  
  // Position
  cursor: { path: string; offset?: number } | null;
  selection: { path: string; start: number; end: number } | null;
  
  // View state
  viewport: { x: number; y: number; zoom: number };
  viewMode: 'tree' | 'canvas';
  
  // Activity
  status: 'active' | 'idle' | 'away';
  lastActiveAt: number;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string; // For cursor/selection highlighting
}
```

### UI Components

#### `PresenceAvatars.tsx`

```typescript
function PresenceAvatars() {
  const collab = useService<CollaborationService>('collaboration-service');
  const [presences, setPresences] = useState<Presence[]>([]);
  
  useEffect(() => {
    return collab?.subscribeToPresence((updated) => {
      setPresences(updated);
    });
  }, [collab]);
  
  // Group by status
  const active = presences.filter(p => p.status === 'active');
  const idle = presences.filter(p => p.status !== 'active');
  
  return (
    <div className="presence-avatars">
      <AvatarStack users={active.map(p => p.user)} max={3} />
      {idle.length > 0 && (
        <span className="idle-count">+{idle.length} away</span>
      )}
    </div>
  );
}
```

#### `PresenceCursors.tsx`

```typescript
function PresenceCursors() {
  const presences = usePresences();
  const currentUserId = useCurrentUser().id;
  
  return (
    <div className="presence-cursors-layer">
      {presences
        .filter(p => p.id !== currentUserId && p.cursor)
        .map(presence => (
          <PresenceCursor
            key={presence.id}
            user={presence.user}
            cursor={presence.cursor!}
            selection={presence.selection}
          />
        ))}
    </div>
  );
}

function PresenceCursor({ user, cursor, selection }) {
  const position = getNodePosition(cursor.path);
  
  return (
    <div 
      className="presence-cursor"
      style={{ 
        left: position.x, 
        top: position.y,
        '--user-color': user.color,
      }}
    >
      <CursorIcon color={user.color} />
      <span className="cursor-label">{user.name}</span>
      
      {selection && (
        <SelectionHighlight 
          path={selection.path}
          start={selection.start}
          end={selection.end}
          color={user.color}
        />
      )}
    </div>
  );
}
```

## Plugin 3: `version-history`

**Purpose**: Track and restore document versions

**Manifest**:
```typescript
manifest: {
  id: 'version-history',
  name: 'Version History',
  capabilities: [
    'document:read',
    'document:write',
    'ui:slots',
    'services:consume',
  ],
  slots: [
    { slot: 'sidebar:right', component: 'VersionHistoryPanel', priority: 20 }
  ],
  consumes: ['collaboration-service'],
}
```

### Data Model

```typescript
interface Version {
  id: string;
  documentId: string;
  
  // Version info
  number: number;
  name?: string;
  description?: string;
  
  // Content
  snapshot: unknown; // Full document state
  diff?: DocumentDiff; // Diff from previous
  
  // Metadata
  author: User;
  createdAt: number;
  
  // Classification
  type: 'auto' | 'manual' | 'publish' | 'restore';
  tags: string[];
}

interface DocumentDiff {
  changes: DiffChange[];
  additions: number;
  deletions: number;
  modifications: number;
}

interface DiffChange {
  type: 'add' | 'delete' | 'modify';
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}
```

### UI Mockup: Version History

```
┌────────────────────────────────┐
│ 📜 Version History             │
├────────────────────────────────┤
│ [📌 Save Version]              │
├────────────────────────────────┤
│                                │
│ ─── Today ───────────────────  │
│                                │
│ ┌────────────────────────────┐ │
│ │ v12 • Published            │ │
│ │ 👤 Sarah • 2h ago          │ │
│ │ "Ready for review"         │ │
│ │ +3 −1 ~5                   │ │
│ │ [View] [Restore] [Compare] │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ v11 • Auto-save            │ │
│ │ 👤 You • 3h ago            │ │
│ │ [View] [Restore]           │ │
│ └────────────────────────────┘ │
│                                │
│ ─── Yesterday ───────────────  │
│                                │
│ ┌────────────────────────────┐ │
│ │ v10 • Manual save          │ │
│ │ "Before refactor"          │ │
│ │ [View] [Restore] [Compare] │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

## Service: `collaboration-service`

**Backend Requirements**:

```typescript
interface CollaborationService {
  // Connection
  connect(documentId: string, user: User): Promise<void>;
  disconnect(): void;
  
  // Presence
  updatePresence(presence: Partial<Presence>): void;
  subscribeToPresence(callback: (presences: Presence[]) => void): () => void;
  
  // Comments
  addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>;
  updateComment(id: string, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  resolveThread(threadId: string): Promise<void>;
  subscribeToComments(callback: (threads: CommentThread[]) => void): () => void;
  
  // Version History
  saveVersion(name?: string, description?: string): Promise<Version>;
  getVersions(): Promise<Version[]>;
  getVersion(id: string): Promise<Version>;
  restoreVersion(id: string): Promise<void>;
  compareVersions(v1: string, v2: string): Promise<DocumentDiff>;
  
  // Real-time sync (future)
  enableRealTimeSync(): void;
  disableRealTimeSync(): void;
}
```

### Backend Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Comments   │  │  Presence   │  │  Versions   │              │
│  │   Plugin    │  │   Plugin    │  │   Plugin    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │ CollaborationService  │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ WebSocket / HTTP
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Backend                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API Gateway                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │  Comments   │      │  Presence   │      │  Versions   │     │
│  │   Service   │      │   Service   │      │   Service   │     │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘     │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │  PostgreSQL │      │    Redis    │      │  PostgreSQL │     │
│  │  (comments) │      │ (presence)  │      │ (versions)  │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## MVP vs Full Implementation

### MVP (Frontend Only)

For initial development, implement a mock collaboration service:

```typescript
class MockCollaborationService implements CollaborationService {
  // Store in localStorage
  private comments: CommentThread[] = [];
  private versions: Version[] = [];
  
  // Single user, no real-time
  async addComment(comment) {
    const newComment = { ...comment, id: uuid(), createdAt: Date.now() };
    this.comments.push(/* ... */);
    this.saveToStorage();
    return newComment;
  }
  
  // Version snapshots stored locally
  async saveVersion(name) {
    const version = {
      id: uuid(),
      snapshot: getCurrentDocument(),
      // ...
    };
    this.versions.push(version);
    this.saveToStorage();
    return version;
  }
}
```

### Full Implementation

Requires:
- WebSocket server for real-time presence
- PostgreSQL for persistent storage
- Redis for presence ephemeral state
- Authentication integration
- Notification system

## Dependencies

- Phase 5 complete (state debugger for version diff)
- Backend infrastructure (for full implementation)

## Estimated Effort

| Task | Estimate |
|------|----------|
| Comments plugin (MVP) | 3 days |
| Presence plugin (MVP) | 2 days |
| Version history plugin | 3 days |
| Mock collaboration service | 1 day |
| **Frontend MVP Total** | **9 days** |
| --- | --- |
| Backend API design | 1 day |
| Backend implementation | 5 days |
| WebSocket integration | 2 days |
| Real-time sync | 3 days |
| **Full Implementation Total** | **20 days** |

## Success Criteria

### MVP
- [ ] Comments can be added to components
- [ ] Comment badges show on tree/canvas
- [ ] Threads can be resolved
- [ ] Versions can be saved manually
- [ ] Version list shows history
- [ ] Versions can be restored

### Full Implementation
- [ ] Real-time presence shows collaborators
- [ ] Cursors visible on canvas
- [ ] Comments sync across users
- [ ] Auto-save creates versions
- [ ] Visual diff between versions
- [ ] Notifications for mentions
