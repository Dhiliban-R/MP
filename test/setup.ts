import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock HTMLFormElement.prototype.submit
HTMLFormElement.prototype.submit = function() {
  // Do nothing
};

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({
      seconds: Date.now() / 1000,
      nanoseconds: 0,
      toDate: () => new Date()
    })),
    fromDate: vi.fn((date) => ({
      seconds: date.getTime() / 1000,
      nanoseconds: 0,
      toDate: () => date
    })),
  },
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
  connectFunctionsEmulator: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock Lucide React icons with explicit definitions
vi.mock('lucide-react', () => {
  const React = require('react');

  const MockIcon = React.forwardRef((props: any, ref: any) => {
    return React.createElement('div', {
      ref,
      'data-testid': 'mock-icon',
      className: props.className,
      ...props
    });
  });

  // Return explicit object with all icons
  return {
    // Message status icons
    Check: MockIcon,
    CheckCheck: MockIcon,
    Clock: MockIcon,

    // MessageInput icons
    Send: MockIcon,
    Paperclip: MockIcon,
    Image: MockIcon,
    File: MockIcon,
    Smile: MockIcon,
    X: MockIcon,
    Loader2: MockIcon,
    ChevronDown: MockIcon,

    // General UI icons
    AlertCircle: MockIcon,
    Edit: MockIcon,
    Trash2: MockIcon,
    Reply: MockIcon,
    Heart: MockIcon,
    MessageCircle: MockIcon,
    Users: MockIcon,
    Plus: MockIcon,
    Search: MockIcon,
    Settings: MockIcon,
    ArrowLeft: MockIcon,
    ArrowRight: MockIcon,
    ChevronUp: MockIcon,
    MoreHorizontal: MockIcon,
    MoreVertical: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Home: MockIcon,
    Map: MockIcon,
    Bell: MockIcon,
    User: MockIcon,
    LogOut: MockIcon,
    Menu: MockIcon,
    Filter: MockIcon,
    Calendar: MockIcon,
    MapPin: MockIcon,
    Phone: MockIcon,
    Mail: MockIcon,
    Globe: MockIcon,
    Star: MockIcon,
    Share: MockIcon,
    Copy: MockIcon,
    ExternalLink: MockIcon,
    Info: MockIcon,
    InfoIcon: MockIcon,
    FileText: MockIcon,
    ThumbsUp: MockIcon,
    ThumbsDown: MockIcon,
    Frown: MockIcon,
    Laugh: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,

    // Additional icons that might be used
    MessageSquare: MockIcon,
    ImageIcon: MockIcon,
    FileIcon: MockIcon,

    // Dashboard and admin icons
    Package: MockIcon,
    Building: MockIcon,
    ShoppingBag: MockIcon,
    TrendingUp: MockIcon,
    Activity: MockIcon,
    BarChart: MockIcon,
    PieChart: MockIcon,

    // Form and input icons
    Lock: MockIcon,
    CalendarIcon: MockIcon,
    ImagePlus: MockIcon,

    // Navigation and utility icons
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    Navigation: MockIcon,
    Compass: MockIcon,
    RefreshCw: MockIcon,

    // Admin and management icons
    Shield: MockIcon,
    Key: MockIcon,
    Database: MockIcon,
    History: MockIcon,
    FileSpreadsheet: MockIcon,

    // Additional utility icons
    HelpCircle: MockIcon,
    UserCircle: MockIcon,
    Video: MockIcon,
    Trash: MockIcon,
  };
});

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock react-textarea-autosize
vi.mock('react-textarea-autosize', () => ({
  default: (props: any) => {
    const React = require('react');
    return React.createElement('textarea', {
      className: props.className,
      ...props
    });
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));