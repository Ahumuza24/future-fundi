import { create } from 'zustand';
import { applySentryUserContext } from './auth';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant: string | null;
  school_id?: string | null;
  tenant_name?: string;
  tenant_code?: string;
  teacher_school_ids?: string[];
  teacher_schools?: Array<{ id: string; name: string; code?: string }>;
  dashboard_url?: string;
  date_joined: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

// ── Token storage strategy ───────────────────────────────────────────────────
// Access/refresh tokens are stored in sessionStorage (NOT localStorage).
// sessionStorage is:
//   • Scoped to the current tab — not shared across tabs or windows
//   • Automatically cleared when the tab/browser is closed
//   • Still readable by same-origin JS, but XSS no longer creates *persistent*
//     sessions that survive after the tab is closed.
// Non-sensitive display data (user profile) remains in localStorage for UX.
const tokenStorage = {
  getItem: (k: string) => sessionStorage.getItem(k),
  setItem: (k: string, v: string) => sessionStorage.setItem(k, v),
  removeItem: (k: string) => sessionStorage.removeItem(k),
};

const initialUser = JSON.parse(localStorage.getItem('user') || 'null');
applySentryUserContext(initialUser);

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  accessToken: tokenStorage.getItem('access_token'),
  refreshToken: tokenStorage.getItem('refresh_token'),
  isAuthenticated: !!tokenStorage.getItem('access_token'),
  
  login: (accessToken, refreshToken, user) => {
    tokenStorage.setItem('access_token', accessToken);
    tokenStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user)); // profile only, not a secret
    applySentryUserContext(user);
    set({ 
      user, 
      accessToken, 
      refreshToken, 
      isAuthenticated: true 
    });
  },
  
  logout: () => {
    tokenStorage.removeItem('access_token');
    tokenStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('selected_school_id');
    localStorage.removeItem('selected_school_name');
    applySentryUserContext(null);
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false 
    });
  },
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    applySentryUserContext(user);
    set({ user });
  },
}));

interface Learner {
  id: string;
  first_name: string;
  last_name: string;
  consent_media: boolean;
  equity_flag: boolean;
  joined_at?: string;
}

interface LearnerState {
  selectedLearner: Learner | null;
  learners: Learner[];
  setSelectedLearner: (learner: Learner | null) => void;
  setLearners: (learners: Learner[]) => void;
}

export const useLearnerStore = create<LearnerState>((set) => ({
  selectedLearner: null,
  learners: [],
  setSelectedLearner: (learner) => set({ selectedLearner: learner }),
  setLearners: (learners) => set({ learners }),
}));

interface Artifact {
  id: string;
  learner: string;
  title: string;
  reflection: string;
  submitted_at: string;
  media_refs: any[];
}

interface ArtifactState {
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
}

export const useArtifactStore = create<ArtifactState>((set) => ({
  artifacts: [],
  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) => set((state) => ({ 
    artifacts: [artifact, ...state.artifacts] 
  })),
}));

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));
