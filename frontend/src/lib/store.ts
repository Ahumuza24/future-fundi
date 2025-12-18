import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant: string | null;
  tenant_name?: string;
  tenant_code?: string;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  
  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ 
      user, 
      accessToken, 
      refreshToken, 
      isAuthenticated: true 
    });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false 
    });
  },
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
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
