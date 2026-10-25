// Hooks
export {
  useDrag,
  useMagnetic,
  useReducedMotion,
  useReveal,
  useSpotlight,
  useTilt,
  useVizzeleEffect,
} from './hooks/effects';
export { useSpring, useSpringValue, useSprings, type UseSpringOptions } from './hooks/spring';
export { useMergedRef, cx } from './hooks/utils';

// Cursor & pointer
export {
  Cursor,
  HoloCard,
  Magnetic,
  ParticleTrail,
  Ripple,
  Spotlight,
  SpotlightCard,
  Tilt,
  type CursorProps,
  type HoloCardProps,
  type MagneticProps,
  type ParticleTrailProps,
  type RippleProps,
  type SpotlightProps,
  type TiltProps,
} from './components/pointer';

// Drag & physics
export {
  BottomSheet,
  Draggable,
  ElasticSlider,
  InfiniteCanvas,
  PhysicsWorld,
  ReorderGroup,
  ReorderHandle,
  ReorderItem,
  SwipeStack,
  useDragDismiss,
  type BottomSheetProps,
  type DragDismissOptions,
  type DraggableProps,
  type ElasticSliderProps,
  type InfiniteCanvasProps,
  type PhysicsWorldProps,
  type ReorderGroupProps,
  type ReorderItemProps,
  type SwipeDirection,
  type SwipeStackHandle,
  type SwipeStackProps,
} from './components/drag';
export { useModalFocus } from './hooks/a11y';

// Text & scroll
export {
  Counter,
  HorizontalScroll,
  MorphText,
  Parallax,
  Reveal,
  ScrambleText,
  ScrollProgress,
  ShimmerText,
  SmoothScroll,
  StickyStack,
  TextReveal,
  WeightWave,
  type CounterProps,
  type HorizontalScrollProps,
  type MorphTextProps,
  type ParallaxProps,
  type RevealProps,
  type ScrambleTextHandle,
  type ScrambleTextProps,
  type ScrollProgressProps,
  type ShimmerTextProps,
  type StickyStackProps,
  type TextRevealProps,
  type WeightWaveProps,
} from './components/text';

// UI components
export {
  Button,
  Card,
  Checkbox,
  Input,
  LiquidGlass,
  RadioGroup,
  Skeleton,
  Switch,
  type ButtonProps,
  type ButtonVariant,
  type CardProps,
  type CheckboxProps,
  type InputProps,
  type LiquidGlassProps,
  type RadioGroupProps,
  type SkeletonProps,
  type SwitchProps,
} from './components/controls';
export {
  Modal,
  Popover,
  Toaster,
  Tooltip,
  toast,
  type ModalProps,
  type Placement,
  type PopoverProps,
  type PopoverTriggerProps,
  type ToastData,
  type ToastVariant,
  type ToasterProps,
  type TooltipProps,
} from './components/overlay';
export {
  Accordion,
  Dock,
  Navbar,
  Tabs,
  type AccordionItem,
  type AccordionProps,
  type DockItem,
  type DockProps,
  type NavbarProps,
  type TabItem,
  type TabsProps,
} from './components/nav';
export {
  Carousel3D,
  ImageReveal,
  Marquee,
  type Carousel3DProps,
  type ImageRevealProps,
  type MarqueeProps,
} from './components/media';

export {
  DropdownMenu,
  Select,
  type DropdownMenuProps,
  type MenuActionItem,
  type MenuItem,
  type MenuTriggerProps,
  type SelectOption,
  type SelectProps,
} from './components/select';

export {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  Sparkline,
  StatCard,
  chartColor,
  type BarChartProps,
  type ChartRow,
  type ChartSeries,
  type DonutChartProps,
  type DonutSlice,
  type LineChartProps,
  type SparklineProps,
  type StatCardProps,
} from './components/charts';

export {
  Agent,
  AgentOrb,
  AgentSteps,
  agentStateLabels,
  type AgentOrbProps,
  type AgentProps,
  type AgentState,
  type AgentStep,
  type AgentStepStatus,
  type AgentStepsProps,
} from './components/agent';

export {
  HoldButton,
  LiquidFocus,
  LiquidSelection,
  SurfaceTension,
  type HoldButtonProps,
  type LiquidFocusProps,
  type LiquidSelectionProps,
  type SurfaceTensionProps,
} from './components/originals';

export { CopyButton, useClipboard, type CopyButtonProps, type CopyState } from './components/copy';
export {
  Sidebar,
  type SidebarItem,
  type SidebarProps,
  type SidebarSection,
} from './components/sidebar';
export {
  Footer,
  Wordmark,
  type FooterColumn,
  type FooterLink,
  type FooterProps,
  type WordmarkProps,
} from './components/footer';

export {
  LaptopMockup,
  PhoneMockup,
  type LaptopMockupProps,
  type PhoneMockupProps,
} from './components/mockup';

// Re-export the engine so apps need a single import.
export {
  Spring,
  createSprings,
  springs,
  frame,
  setReducedMotion,
  prefersReducedMotion,
  copyToClipboard,
  type DragOptions,
  type DragControls,
  type DragState,
  type SpringConfig,
  type SpringPreset,
  type MagneticOptions,
  type TiltOptions,
  type SpotlightOptions,
  type RevealOptions,
  type PhysicsWorld as PhysicsWorldApi,
  type PhysicsOptions,
  type WordmarkOptions,
  type MockupOptions,
} from '@vizzele/core';
