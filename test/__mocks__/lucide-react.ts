// Mock for lucide-react icons used in tests
const React = require('react');

// Create a simple mock component for all icons
const MockIcon = React.forwardRef((props: any, ref: any) => {
  return React.createElement('div', {
    ref,
    'data-testid': 'mock-icon',
    className: props.className,
    ...props
  });
});

// Export all the icons used in the project
export const Check = MockIcon;
export const CheckCheck = MockIcon;
export const Paperclip = MockIcon;
export const Send = MockIcon;
export const Smile = MockIcon;
export const MoreVertical = MockIcon;
export const ArrowLeft = MockIcon;
export const Users = MockIcon;
export const MessageCircle = MockIcon;
export const Phone = MockIcon;
export const Video = MockIcon;
export const Info = MockIcon;
export const Search = MockIcon;
export const Plus = MockIcon;
export const X = MockIcon;
export const Calendar = MockIcon;
export const CalendarIcon = MockIcon;
export const Clock = MockIcon;
export const Package = MockIcon;
export const User = MockIcon;
export const MapPin = MockIcon;
export const Heart = MockIcon;
export const Share2 = MockIcon;
export const Filter = MockIcon;
export const SortAsc = MockIcon;
export const Grid = MockIcon;
export const List = MockIcon;
export const TrendingUp = MockIcon;
export const AlertCircle = MockIcon;
export const CheckCircle = MockIcon;
export const AlertTriangle = MockIcon;
export const Loader2 = MockIcon;
export const ImagePlus = MockIcon;
export const Map = MockIcon;
export const History = MockIcon;
export const Building = MockIcon;
export const FileSpreadsheet = MockIcon;
export const CalendarClock = MockIcon;
export const ShoppingBag = MockIcon;
export const Bell = MockIcon;
export const Settings = MockIcon;
export const LogOut = MockIcon;
export const Menu = MockIcon;
export const Home = MockIcon;
export const Upload = MockIcon;
export const Download = MockIcon;
export const Edit = MockIcon;
export const Trash = MockIcon;
export const Eye = MockIcon;
export const EyeOff = MockIcon;
export const Star = MockIcon;
export const Mail = MockIcon;
export const Lock = MockIcon;
export const Unlock = MockIcon;
export const Shield = MockIcon;
export const Activity = MockIcon;
export const BarChart = MockIcon;
export const PieChart = MockIcon;
export const LineChart = MockIcon;
export const Zap = MockIcon;
export const Globe = MockIcon;
export const Wifi = MockIcon;
export const WifiOff = MockIcon;
export const Bluetooth = MockIcon;
export const Camera = MockIcon;
export const Mic = MockIcon;
export const MicOff = MockIcon;
export const Volume2 = MockIcon;
export const VolumeX = MockIcon;
export const Play = MockIcon;
export const Pause = MockIcon;
export const Stop = MockIcon;
export const SkipBack = MockIcon;
export const SkipForward = MockIcon;
export const Repeat = MockIcon;
export const Shuffle = MockIcon;
export const RefreshCw = MockIcon;
export const RotateCcw = MockIcon;
export const RotateCw = MockIcon;
export const Maximize = MockIcon;
export const Minimize = MockIcon;
export const Copy = MockIcon;
export const Clipboard = MockIcon;
export const Save = MockIcon;
export const Folder = MockIcon;
export const FolderOpen = MockIcon;
export const File = MockIcon;
export const FileText = MockIcon;
export const Image = MockIcon;
export const Link = MockIcon;
export const ExternalLink = MockIcon;
export const ChevronDown = MockIcon;
export const ChevronUp = MockIcon;
export const ChevronLeft = MockIcon;
export const ChevronRight = MockIcon;
export const ChevronsDown = MockIcon;
export const ChevronsUp = MockIcon;
export const ChevronsLeft = MockIcon;
export const ChevronsRight = MockIcon;
export const ArrowDown = MockIcon;
export const ArrowUp = MockIcon;
export const ArrowRight = MockIcon;
export const Move = MockIcon;
export const Navigation = MockIcon;
export const Compass = MockIcon;
export const Target = MockIcon;
export const Crosshair = MockIcon;

// Default export
export default MockIcon;