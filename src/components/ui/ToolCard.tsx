import {
  ArrowRight,
  Minimize2, Scaling, Crop, RefreshCw, RotateCw, RotateCcw, Droplets, Laugh, Sliders,
  Scissors, Code, Grid3x3, Radius, CircleDashed, Frame, Aperture, Contrast, SunMoon,
  Palette, LayoutGrid, Type, Layers,
  FileDown, Files, FileMinus2, FileImage, FilePlus2, FileText, Lock, Unlock, BookOpen,
  FileCode2, Pipette, ShieldOff, Hash, Bookmark,
  Video, Film, Music, Clapperboard, Headphones, Music2, Radio, ListMusic, Volume2,
  FlipHorizontal2, IdCard, MonitorSmartphone, Sparkles, PlaySquare, ImagePlay,
  Stamp, ListOrdered, PenLine, ScanLine, ArrowUpDown, Maximize2,
  QrCode, Braces, Link2, Paintbrush2,
  Gauge, AudioLines, FastForward, Rewind,
  VolumeX, Camera, Binary, Code2, Table, ShieldCheck, ImageUp, Merge,
  SlidersHorizontal, Pencil, PaintBucket, Grid2x2, Layers2,
  FileX, ImagePlus, FilePlus, FlipHorizontal, Monitor,
  TrendingUp, Combine, Music4, TestTube2, Fingerprint,
  AlignLeft, Clock, FileCode, ScanSearch,
} from 'lucide-react';
import type { ToolMeta } from '@/lib/constants/tools';

const ICONS: Record<string, React.ReactNode> = {
  Minimize2: <Minimize2 size={20} />,
  Scaling: <Scaling size={20} />,
  Crop: <Crop size={20} />,
  RefreshCw: <RefreshCw size={20} />,
  RotateCw: <RotateCw size={20} />,
  RotateCcw: <RotateCcw size={20} />,
  Droplets: <Droplets size={20} />,
  Laugh: <Laugh size={20} />,
  Sliders: <Sliders size={20} />,
  Scissors: <Scissors size={20} />,
  Code: <Code size={20} />,
  Grid3x3: <Grid3x3 size={20} />,
  Radius: <Radius size={20} />,
  CircleDashed: <CircleDashed size={20} />,
  Frame: <Frame size={20} />,
  Aperture: <Aperture size={20} />,
  Contrast: <Contrast size={20} />,
  SunMoon: <SunMoon size={20} />,
  Palette: <Palette size={20} />,
  LayoutGrid: <LayoutGrid size={20} />,
  Type: <Type size={20} />,
  Layers: <Layers size={20} />,
  FileDown: <FileDown size={20} />,
  Files: <Files size={20} />,
  FileMinus2: <FileMinus2 size={20} />,
  FileImage: <FileImage size={20} />,
  FilePlus2: <FilePlus2 size={20} />,
  FileText: <FileText size={20} />,
  Lock: <Lock size={20} />,
  Unlock: <Unlock size={20} />,
  BookOpen: <BookOpen size={20} />,
  FileCode2: <FileCode2 size={20} />,
  Pipette: <Pipette size={20} />,
  ShieldOff: <ShieldOff size={20} />,
  Hash: <Hash size={20} />,
  Bookmark: <Bookmark size={20} />,
  Video: <Video size={20} />,
  Film: <Film size={20} />,
  Music: <Music size={20} />,
  Clapperboard: <Clapperboard size={20} />,
  Headphones: <Headphones size={20} />,
  Music2: <Music2 size={20} />,
  Radio: <Radio size={20} />,
  ListMusic: <ListMusic size={20} />,
  Volume2: <Volume2 size={20} />,
  FlipHorizontal2: <FlipHorizontal2 size={20} />,
  IdCard: <IdCard size={20} />,
  MonitorSmartphone: <MonitorSmartphone size={20} />,
  Sparkles: <Sparkles size={20} />,
  PlaySquare: <PlaySquare size={20} />,
  ImagePlay: <ImagePlay size={20} />,
  Stamp: <Stamp size={20} />,
  ListOrdered: <ListOrdered size={20} />,
  PenLine: <PenLine size={20} />,
  ScanLine: <ScanLine size={20} />,
  ArrowUpDown: <ArrowUpDown size={20} />,
  Maximize2: <Maximize2 size={20} />,
  QrCode: <QrCode size={20} />,
  Braces: <Braces size={20} />,
  Link2: <Link2 size={20} />,
  Paintbrush2: <Paintbrush2 size={20} />,
  Gauge: <Gauge size={20} />,
  AudioLines: <AudioLines size={20} />,
  FastForward: <FastForward size={20} />,
  Rewind: <Rewind size={20} />,
  VolumeX: <VolumeX size={20} />,
  Camera: <Camera size={20} />,
  Binary: <Binary size={20} />,
  Code2: <Code2 size={20} />,
  Table: <Table size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  ImageUp: <ImageUp size={20} />,
  Merge: <Merge size={20} />,
  SlidersHorizontal: <SlidersHorizontal size={20} />,
  Pencil: <Pencil size={20} />,
  PaintBucket: <PaintBucket size={20} />,
  Grid2x2: <Grid2x2 size={20} />,
  Layers2: <Layers2 size={20} />,
  FileX: <FileX size={20} />,
  ImagePlus: <ImagePlus size={20} />,
  FilePlus: <FilePlus size={20} />,
  FlipHorizontal: <FlipHorizontal size={20} />,
  Monitor: <Monitor size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  Combine: <Combine size={20} />,
  Music4: <Music4 size={20} />,
  TestTube2: <TestTube2 size={20} />,
  Fingerprint: <Fingerprint size={20} />,
  AlignLeft: <AlignLeft size={20} />,
  Clock: <Clock size={20} />,
  FileCode: <FileCode size={20} />,
  ScanSearch: <ScanSearch size={20} />,
};

interface Props {
  tool: ToolMeta;
}

export default function ToolCard({ tool }: Props) {
  return (
    <a
      href={`/${tool.slug}`}
      className="group flex flex-col gap-3 p-5 bg-white rounded-xl border border-[var(--color-border)] hover:border-[var(--color-tools-border)] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
          {ICONS[tool.icon]}
        </div>
        <ArrowRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all mt-1" />
      </div>
      <div>
        <h3 className="font-bold text-[var(--color-text)] text-[15px] leading-tight">{tool.name}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{tool.description}</p>
      </div>
    </a>
  );
}
