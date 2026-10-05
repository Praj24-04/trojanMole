import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Beaker,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Crosshair,
  Database,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers3,
  Menu,
  Network,
  Play,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  TriangleAlert,
  Waypoints,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";

const API_BASE = "";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel Research Console — FL Backdoor Defense" },
      {
        name: "description",
        content:
          "IEEE GSC26 research console for federated learning backdoor attack analysis and robust aggregation defense benchmarking.",
      },
      { property: "og:title", content: "Sentinel Research Console" },
      {
        property: "og:description",
        content: "Federated learning backdoor attack and defense analysis for IEEE GSC26 Challenge 1.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchConsole,
});

type Section = "Overview" | "FL Simulation" | "Attack Lab" | "Defense Arena" | "Model Inspector" | "Results";

const navItems: { label: Section; icon: typeof Activity; note: string }[] = [
  { label: "Overview", icon: Radar, note: "01" },
  { label: "FL Simulation", icon: Network, note: "02" },
  { label: "Attack Lab", icon: Crosshair, note: "03" },
  { label: "Defense Arena", icon: ShieldCheck, note: "04" },
  { label: "Model Inspector", icon: Layers3, note: "05" },
  { label: "Results", icon: BarChart3, note: "06" },
];

const defenses = [
  "Sybil-Filtered FLAME (Our Submission)",
  "FedAvg",
  "Coordinate Median",
  "Trimmed Mean",
  "Krum",
  "Multi-Krum",
  "Bulyan",
];
const cases = [
  { name: "Case 1", benign: 10, malicious: 2 },
  { name: "Case 2", benign: 10, malicious: 3 },
  { name: "Case 3", benign: 15, malicious: 5 },
];

const rounds = [
  { round: "R01", accuracy: 38, asr: 5 },
  { round: "R02", accuracy: 44, asr: 10 },
  { round: "R03", accuracy: 48, asr: 16 },
  { round: "R04", accuracy: 51, asr: 21 },
  { round: "R05", accuracy: 54, asr: 25 },
  { round: "R06", accuracy: 56, asr: 28 },
  { round: "R07", accuracy: 57, asr: 29 },
  { round: "R08", accuracy: 58, asr: 29 },
];

const initialDefenseRows = [
  { method: "Sybil-Filtered FLAME (Our Submission)", accuracy: 57.15, asr: 0.0, verdict: "Attack blocked" },
  { method: "FedAvg", accuracy: 57.77, asr: 28.57, verdict: "Attack survives" },
  { method: "Coordinate Median", accuracy: 57.15, asr: 39.29, verdict: "Attack survives" },
  { method: "Trimmed Mean", accuracy: 57.15, asr: 32.14, verdict: "Attack survives" },
  { method: "Krum", accuracy: 65.43, asr: 100.0, verdict: "Subverted (Sybils Rank 1)" },
  { method: "Multi-Krum", accuracy: 57.15, asr: 28.57, verdict: "Attack survives" },
  { method: "Bulyan", accuracy: 56.88, asr: 32.14, verdict: "Attack survives" },
];

export function ResearchConsole() {
  const isDark = false;
  const [section, setSection] = useState<Section>("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedCase, setSelectedCase] = useState(0);
  const [selectedDefense, setSelectedDefense] = useState("Sybil-Filtered FLAME (Our Submission)");
  const [running, setRunning] = useState(false);
  const [benchmarkRun, setBenchmarkRun] = useState(false);
  const [trigger, setTrigger] = useState<"Ruler / Marker" | "Unmarked Lesion">("Ruler / Marker");
  const [lambdaBd, setLambdaBd] = useState(6.0);
  const [lambdaReg, setLambdaReg] = useState(2.0);
  const [epochs, setEpochs] = useState(5);
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState("client_0");
  const [selectedLayer, setSelectedLayer] = useState(0);

  // Dynamic API State
  const [simResult, setSimResult] = useState<any>(null);
  const [defenseRows, setDefenseRows] = useState<any[]>(initialDefenseRows);
  const [krumScoresData, setKrumScoresData] = useState<any[]>([]);
  const [normDistances, setNormDistances] = useState<any>(null);
  const [modelList, setModelList] = useState<any[]>([]);
  const [weightStats, setWeightStats] = useState<any>(null);
  const [distanceMatrix, setDistanceMatrix] = useState<any>(null);
  const [matrixSummary, setMatrixSummary] = useState<any>(null);

  const activeCase = cases[selectedCase];

  // Fetch matrix summary & initial defense results on load
  useEffect(() => {
    fetch(`${API_BASE}/api/results/defense-matrix`)
      .then(r => r.json())
      .then(d => setMatrixSummary(d))
      .catch(() => {});
  }, []);

  // Fetch model list & distance matrix when case changes
  useEffect(() => {
    const caseNum = selectedCase + 1;
    fetch(`${API_BASE}/api/models/list/${caseNum}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.models && d.models.length > 0) {
          setModelList(d.models);
          setSelectedClient(d.models[0].id);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/models/compare/${caseNum}`)
      .then(r => r.json())
      .then(d => setDistanceMatrix(d))
      .catch(() => {});

    fetch(`${API_BASE}/api/attack/norm-distances/${caseNum}`)
      .then(r => r.json())
      .then(d => setNormDistances(d))
      .catch(() => {});

    fetch(`${API_BASE}/api/defense/krum-scores/${caseNum}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.models) setKrumScoresData(d.models);
      })
      .catch(() => {});
  }, [selectedCase]);

  // Fetch model weight breakdown on client selection
  useEffect(() => {
    const caseNum = selectedCase + 1;
    const modelObj = modelList.find(m => m.id === selectedClient);
    const mType = modelObj ? modelObj.type : (selectedClient.startsWith("mal") ? "malicious" : "benign");
    const mIndex = modelObj ? modelObj.index : 0;

    fetch(`${API_BASE}/api/models/weights/${caseNum}/${mType}/${mIndex}`)
      .then(r => r.json())
      .then(d => setWeightStats(d))
      .catch(() => {});
  }, [selectedClient, selectedCase, modelList]);

  const [simPhase, setSimPhase] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<{ time: string; msg: string; tone: "info" | "warn" | "danger" | "success" }[]>([]);

  // Live attack training handler
  const handleTrain = async () => {
    if (training) return;
    setTraining(true);
    try {
      const res = await fetch(`${API_BASE}/api/attack/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_number: selectedCase + 1,
          lambda_bd: lambdaBd,
          lambda_reg: lambdaReg,
          epochs: epochs,
        })
      });
      const data = await res.json();
      if (data && data.status === "success") {
        setTrainResult(data);
        setTrained(true);
      }
    } catch (e) {
      console.error("Attack training failed", e);
    } finally {
      setTraining(false);
    }
  };

  // Simulation execution handler with step-by-step animated phases
  const runSimulation = async () => {
    if (running) return;
    setRunning(true);
    setSimPhase(1);
    const caseNum = selectedCase + 1;
    const now = () => new Date().toLocaleTimeString().split(" ")[0];

    setSimLogs([
      { time: now(), msg: `[STEP 1/4] LOCAL TRAINING: ${activeCase.benign} benign hospitals training clean dermoscopy lesions; ${activeCase.malicious} malicious hospitals injecting ${trigger} trigger...`, tone: "info" }
    ]);

    const fetchPromise = fetch(`${API_BASE}/api/fl/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_number: caseNum, defense_method: selectedDefense }),
    }).then(r => r.json()).catch(() => null);

    await new Promise(r => setTimeout(r, 1800));
    setSimPhase(2);
    setSimLogs(prev => [
      ...prev,
      { time: now(), msg: `[STEP 2/4] WEIGHT TRANSPORT: Uploading 94,151 SmallCNN(7) parameters from ${activeCase.benign + activeCase.malicious} clients to Central Server...`, tone: "warn" }
    ]);

    await new Promise(r => setTimeout(r, 2200));
    setSimPhase(3);
    setSimLogs(prev => [
      ...prev,
      { time: now(), msg: `[STEP 3/4] DEFENSE FILTERING (${selectedDefense}): Evaluating client weight vectors & filtering outliers...`, tone: "info" }
    ]);

    const data = await fetchPromise;
    if (data) setSimResult(data);

    await new Promise(r => setTimeout(r, 2200));
    setSimPhase(4);
    const currentAsr = data ? data.asr * 100 : 50;
    const isBlocked = currentAsr < 30;
    setSimLogs(prev => [
      ...prev,
      { time: now(), msg: `[STEP 4/4] GLOBAL SYNC: Aggregated weights broadcast to network. Clean Acc: ${(data ? data.clean_accuracy * 100 : 57.7).toFixed(1)}% | ASR: ${currentAsr.toFixed(1)}% (${isBlocked ? 'ATTACK BLOCKED' : 'ATTACK SURVIVES'})`, tone: isBlocked ? "success" : "danger" }
    ]);

    await new Promise(r => setTimeout(r, 1800));
    setSimPhase(0);
    setRunning(false);
  };

  // Defense benchmark execution handler
  const runBenchmark = async () => {
    setBenchmarkRun(true);
    try {
      const caseNum = selectedCase + 1;
      const res = await fetch(`${API_BASE}/api/defense/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_number: caseNum }),
      });
      const data = await res.json();
      if (data && data.results) {
        const rows = data.results.map((r: any) => ({
          method: r.method,
          accuracy: r.clean_accuracy * 100,
          asr: r.asr * 100,
          verdict: r.asr > 0.3 ? "Attack survives" : "Attack blocked",
        }));
        setDefenseRows(rows);
      }
    } catch (err) {
      console.error("Defense benchmark fetch failed", err);
    }
  };

  const simulation = useMemo(() => {
    if (simResult) {
      return {
        accuracy: simResult.clean_accuracy * 100,
        asr: simResult.asr * 100,
        verdict: simResult.asr > 0.3 ? "Attack survives" : "Attack blocked",
        caseLabel: activeCase.name,
      };
    }
    const result = defenseRows.find((row) => row.method === selectedDefense) ?? defenseRows[0];
    return { ...result, caseLabel: activeCase.name };
  }, [activeCase.name, selectedDefense, simResult, defenseRows]);

  return (
    <div className={`${isDark ? "dark " : ""}min-h-screen bg-background text-foreground`}>
      <div className="mx-auto flex min-h-screen max-w-[1680px] border-x border-border/70 bg-surface">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface px-4 py-5 transition-transform lg:sticky lg:top-0 lg:block lg:h-screen lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-start justify-between gap-3 border-b border-border px-1 pb-5">
            <button className="flex items-center gap-3 text-left" onClick={() => setSection("Overview")} aria-label="Open overview">
              <span className="grid size-9 place-items-center border border-primary/30 bg-primary/10 text-primary"><BrainCircuit className="size-5" strokeWidth={1.8} /></span>
              <span><span className="block font-display text-sm font-semibold tracking-wide">SENTINEL</span><span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">research console</span></span>
            </button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></Button>
          </div>

          <div className="mt-7">
            <p className="px-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
            <nav className="mt-2 space-y-1" aria-label="Research sections">
              {navItems.map(({ label, icon: Icon, note }) => (
                <button key={label} onClick={() => { setSection(label); setMobileNav(false); }} className={`group flex w-full items-center justify-between border-l-2 px-3 py-2.5 text-left text-sm transition-colors ${section === label ? "border-primary bg-primary/10 text-primary font-medium" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <span className="flex items-center gap-3"><Icon className="size-4" strokeWidth={1.8} />{label}</span><span className="font-mono text-[10px] opacity-60">{note}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8 border-t border-border pt-5">
            <p className="px-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">System state</p>
            <div className="mt-3 space-y-3 px-2 font-mono text-[11px]">
              <StateLine label="clients online" value={`${activeCase.benign + activeCase.malicious} / ${activeCase.benign + activeCase.malicious}`} />
              <StateLine label="sync latency" value="42ms" tone="primary" />
              <StateLine label="threat level" value="elevated" tone="warning" />
              <StateLine label="round" value="12 / 12" />
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-5 border-t border-border pt-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span className="size-1.5 bg-success" />telemetry live</div>
            <p className="mt-1 text-xs text-muted-foreground">Team 004 · GSC26-C1</p>
          </div>
        </aside>

        {mobileNav && <button className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu overlay" />}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-16 items-center gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-7">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></Button>
            <div className="min-w-0"><p className="font-display text-sm font-semibold">{section}</p><p className="hidden truncate font-mono text-[10px] text-muted-foreground sm:block">ieee gsc26 / challenge 1 / distributed federated learning</p></div>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:flex"><span className="size-1.5 bg-success" />backend connected</span>
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">http://localhost:8000</span>

              <Button variant="outline" size="sm" onClick={() => setSection("Results")}><BookOpen className="size-3.5" />Research brief</Button>
            </div>
          </header>

          <main className="px-4 py-6 md:px-7 md:py-8">
            {section === "Overview" && <Overview activeCase={activeCase} selectedCase={selectedCase} setSelectedCase={setSelectedCase} selectedDefense={selectedDefense} setSelectedDefense={setSelectedDefense} running={running} simPhase={simPhase} simLogs={simLogs} setSimPhase={setSimPhase} runSimulation={runSimulation} simulation={simulation} setSection={setSection} defenseRows={defenseRows} />}
            {section === "FL Simulation" && <Simulation activeCase={activeCase} selectedCase={selectedCase} setSelectedCase={setSelectedCase} selectedDefense={selectedDefense} setSelectedDefense={setSelectedDefense} running={running} simPhase={simPhase} simLogs={simLogs} setSimPhase={setSimPhase} runSimulation={runSimulation} simulation={simulation} />}
            {section === "Attack Lab" && <AttackLab trigger={trigger} setTrigger={setTrigger} lambdaBd={lambdaBd} setLambdaBd={setLambdaBd} lambdaReg={lambdaReg} setLambdaReg={setLambdaReg} epochs={epochs} setEpochs={setEpochs} trained={trained} training={training} trainResult={trainResult} onTrain={handleTrain} normDistances={normDistances} />}
            {section === "Defense Arena" && <DefenseArena benchmarkRun={benchmarkRun} onRunBenchmark={runBenchmark} defenseRows={defenseRows} krumScoresData={krumScoresData} />}
            {section === "Model Inspector" && <ModelInspector selectedClient={selectedClient} setSelectedClient={setSelectedClient} selectedLayer={selectedLayer} setSelectedLayer={setSelectedLayer} modelList={modelList} weightStats={weightStats} distanceMatrix={distanceMatrix} />}
            {section === "Results" && <Results matrixSummary={matrixSummary} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function StateLine({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "warning" }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className={tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground"}>{value}</span></div>;
}

function PageIntro({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h1 className="mt-2 max-w-4xl font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detail}</p></div>{action}</div>;
}

function MetricCard({ label, value, suffix, note, tone = "default", icon: Icon }: { label: string; value: string; suffix?: string; note: string; tone?: "default" | "danger" | "success" | "primary"; icon: typeof Activity }) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return <div className="border border-border bg-background p-4 shadow-paper"><div className="flex items-start justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p><Icon className={`size-4 ${toneClass}`} strokeWidth={1.6} /></div><p className={`mt-3 font-display text-3xl font-semibold tracking-tight ${toneClass}`}>{value}<span className="text-base font-normal text-muted-foreground">{suffix}</span></p><p className="mt-2 text-xs text-muted-foreground">{note}</p></div>; }

function Overview({ activeCase, selectedCase, setSelectedCase, selectedDefense, setSelectedDefense, running, simPhase = 0, simLogs = [], setSimPhase = () => {}, runSimulation, simulation, setSection, defenseRows }: any) {
  return <>
    <PageIntro eyebrow="IEEE GSC26 / Challenge 1 / Team 004" title="Federated learning backdoor attack & defense" detail="A controlled research environment for tracing poisoned client updates, testing robust aggregation, and comparing the clean-accuracy / attack-success tradeoff." action={<Button onClick={() => setSection("Defense Arena")}><ShieldCheck />Open defense arena<ArrowUpRight /></Button>} />
    <div className="mb-6 grid gap-3 border-y border-border bg-background p-3 text-sm md:grid-cols-3"><Concept icon={Network} title="Federated learning" text="Local training stays on the edge; the server sees only weight updates." tone="primary" /><Concept icon={TriangleAlert} title="Poisoning attack" text="A trigger-bound objective steers the global model without tanking clean accuracy." tone="danger" /><Concept icon={ShieldCheck} title="Robust aggregation" text="Distance-aware selectors isolate updates that drift beyond the benign reference." tone="success" /></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Clean accuracy" value="57.77" suffix="%" note="Multi-class baseline · 7 classes" tone="success" icon={Gauge} /><MetricCard label="Attack success rate" value="28.57" suffix="%" note="FedAvg baseline · 0.0% with our defense" tone="danger" icon={Target} /><MetricCard label="Model architecture" value="94,151" note="SmallCNN · 3 conv layers · 7-class head" tone="primary" icon={BrainCircuit} /><MetricCard label="Dataset" value="HAM10000" note="7-class skin lesions · 15 hospital clients" icon={Database} /></div>
    <div className="mt-6 grid gap-3 xl:grid-cols-[1.5fr_1fr]">
      <SimulationCard activeCase={activeCase} selectedCase={selectedCase} setSelectedCase={setSelectedCase} selectedDefense={selectedDefense} setSelectedDefense={setSelectedDefense} running={running} simPhase={simPhase} simLogs={simLogs} setSimPhase={setSimPhase} runSimulation={runSimulation} simulation={simulation} />
      <CardShell eyebrow="System readout" title="What the current run says"><div className="space-y-5"><Readout label="Clean model signal" value="57.77%" progress={58} tone="success" /><Readout label="Backdoor activation" value={`${simulation.asr.toFixed(1)}%`} progress={simulation.asr} tone="danger" /><div className="border-t border-border pt-4"><div className="flex items-center justify-between"><span className="font-mono text-[11px] text-muted-foreground">Current verdict</span><StatusBadge tone={simulation.asr < 30 ? "success" : "danger"}>{simulation.verdict}</StatusBadge></div></div></div><div className="mt-6 border-t border-border pt-4"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Defense bench / case 1</p>{defenseRows.slice(0, 4).map((row: any) => <div key={row.method} className="flex items-center justify-between border-b border-border/70 py-2 text-xs last:border-0"><span className="text-muted-foreground">{row.method}</span><span className={row.asr < 30 ? "font-mono text-success" : row.asr > 50 ? "font-mono text-danger" : "font-mono text-warning"}>ASR {row.asr.toFixed(1)}%</span></div>)}</div></CardShell>
    </div>
    <div className="mt-6 grid gap-3 xl:grid-cols-[1.5fr_1fr]"><CardShell eyebrow="Round history" title="Convergence under attack" note="Observed over federated rounds"><ConvergenceChart /></CardShell><CardShell eyebrow="Research notes" title="Three things to keep in frame"><NoteItem number="01" title="Clean accuracy is not safety" text="A high clean score can conceal a trigger-specific failure mode." /><NoteItem number="02" title="Norm distance is a weak signal" text="Clipped malicious updates can remain inside a benign-looking radius." /><NoteItem number="03" title="Selection beats averaging" text="Sybil-aware filtering rejects coordinated colluders before aggregation." /></CardShell></div>
  </>;
}

function Simulation({ activeCase, selectedCase, setSelectedCase, selectedDefense, setSelectedDefense, running, simPhase = 0, simLogs = [], setSimPhase = () => {}, runSimulation, simulation }: any) {
  return <><PageIntro eyebrow="Module 02 / Federated network" title="FL simulation" detail="Select a client mix and aggregation rule, then replay one aggregation round to inspect how updates move through the system." action={<Button onClick={runSimulation} disabled={running}>{running ? <><Activity className="animate-pulse" />running round...</> : <><Play />Run simulation</>}</Button>} /><div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]"><SimulationCard activeCase={activeCase} selectedCase={selectedCase} setSelectedCase={setSelectedCase} selectedDefense={selectedDefense} setSelectedDefense={setSelectedDefense} running={running} simPhase={simPhase} simLogs={simLogs} setSimPhase={setSimPhase} runSimulation={runSimulation} simulation={simulation} /><CardShell eyebrow="Aggregation result" title={`${simulation.caseLabel} / ${selectedDefense}`}><div className="space-y-4"><Readout label="Clean accuracy" value={`${simulation.accuracy.toFixed(2)}%`} progress={simulation.accuracy} tone="success" /><Readout label="Attack success rate" value={`${simulation.asr.toFixed(1)}%`} progress={simulation.asr} tone="danger" /><div className="border-t border-border pt-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Interpretation</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{simulation.asr < 30 ? "The selector excludes the highest-deviation updates before the global model is formed." : "The attack stays within the aggregation basin; averaging preserves the trigger direction."}</p></div><StatusBadge tone={simulation.asr < 30 ? "success" : "danger"}>{simulation.verdict}</StatusBadge></div></CardShell></div><div className="mt-3 grid gap-3 md:grid-cols-3"><CardShell eyebrow="Case profile" title="Client composition"><div className="flex items-end gap-2"><p className="font-display text-4xl font-semibold">{activeCase.benign + activeCase.malicious}</p><p className="pb-1 text-sm text-muted-foreground">total clients</p></div><div className="mt-4 flex gap-2"><span className="h-2 flex-1 bg-primary" style={{ flex: activeCase.benign }} /><span className="h-2 flex-1 bg-danger" style={{ flex: activeCase.malicious }} /></div><div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground"><span>{activeCase.benign} benign</span><span>{activeCase.malicious} malicious</span></div></CardShell><CardShell eyebrow="Transport" title="Update path"><div className="flex items-center justify-between py-3"><span className="grid size-10 place-items-center border border-border bg-surface text-primary"><Database className="size-4" /></span><span className="h-px flex-1 border-t border-dashed border-primary/50" /><span className="grid size-10 place-items-center border border-primary/30 bg-primary/10 text-primary"><Network className="size-4" /></span></div><p className="text-xs leading-5 text-muted-foreground">Local weights move once per round. Raw dermoscopy patient images never cross the hospital boundary.</p></CardShell><CardShell eyebrow="Threat surface" title="Active signals"><div className="space-y-3"><StateLine label="trigger family" value="visual / targeted" tone="warning" /><StateLine label="norm radius" value="2.40" /><StateLine label="server visibility" value="weights only" tone="primary" /></div></CardShell></div></>;
}

function SimulationCard({ activeCase, selectedCase, setSelectedCase, selectedDefense, setSelectedDefense, running, simPhase = 0, simLogs = [], setSimPhase = () => {}, runSimulation }: any) {
  return <CardShell eyebrow="Interactive network / live canvas" title="Client update topology" note={`${activeCase.benign} benign / ${activeCase.malicious} malicious`} action={<div className="flex flex-wrap gap-2"><Select value={selectedDefense} onChange={(e) => setSelectedDefense(e.target.value)} options={defenses} /><Button size="sm" onClick={runSimulation} disabled={running}>{running ? <Activity className="animate-pulse" /> : <Play />}<span className="hidden sm:inline">{running ? "Running" : "Run round"}</span></Button></div>}><div className="mb-4 flex flex-wrap gap-2">{cases.map((item, index) => <Button key={item.name} size="sm" variant={index === selectedCase ? "secondary" : "outline"} onClick={() => setSelectedCase(index)}>{item.name}<span className="font-mono text-[10px] text-muted-foreground">{item.benign}B / {item.malicious}M</span></Button>)}</div><NetworkCanvas running={running} simPhase={simPhase} simLogs={simLogs} setSimPhase={setSimPhase} activeCase={activeCase} selectedDefense={selectedDefense} /></CardShell>;
}

function NetworkCanvas({
  running,
  simPhase = 0,
  simLogs = [],
  setSimPhase = () => {},
  activeCase,
  selectedDefense
}: {
  running: boolean;
  simPhase?: number;
  simLogs?: any[];
  setSimPhase?: (phase: number) => void;
  activeCase: { benign: number; malicious: number };
  selectedDefense: string;
}) {
  const totalClients = Math.min(activeCase.benign + activeCase.malicious, 25);
  const nodes = Array.from({ length: totalClients }, (_, index) => {
    const malicious = index >= activeCase.benign;
    const angle = (index / totalClients) * Math.PI * 2 - Math.PI / 2;
    const xPct = 50 + Math.cos(angle) * 38;
    const yPct = 50 + Math.sin(angle) * 38;
    return { index, malicious, xPct, yPct };
  });

  const steps = [
    { num: 1, label: "01. Local Train" },
    { num: 2, label: "02. Upload Tensors" },
    { num: 3, label: `03. ${selectedDefense}` },
    { num: 4, label: "04. Global Sync" },
  ];

  return (
    <div className="space-y-3">
      {/* Step Tracker Header */}
      <div className="grid grid-cols-4 gap-1.5 bg-surface p-1.5 border border-border">
        {steps.map((s) => {
          const isActive = simPhase === s.num;
          const isDone = (simPhase ?? 0) > s.num || (!running && simPhase === 0 && (simLogs?.length ?? 0) > 0);
          return (
            <button
              key={s.num}
              onClick={() => setSimPhase(s.num)}
              className={`py-1.5 px-2 text-center font-mono text-[10px] uppercase tracking-wider transition border ${
                isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                  : isDone
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-transparent text-muted-foreground hover:bg-accent"
              }`}
            >
              {s.label} {isActive ? "●" : ""}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Topology Canvas */}
      <div className="relative h-[340px] overflow-hidden border border-border bg-paper-grid shadow-inner">
        {/* SVG Connector Lines & Particle Flow */}
        <svg className="absolute inset-0 size-full pointer-events-none z-0">
          {nodes.map((n) => {
            const isMal = n.malicious;
            const strokeColor = simPhase === 3 && selectedDefense === "FedAvg"
              ? "var(--color-warning)"
              : isMal
              ? "rgba(239, 68, 68, 0.4)"
              : "rgba(79, 143, 255, 0.3)";

            return (
              <g key={`link-${n.index}`}>
                <line
                  x1={`${n.xPct}%`}
                  y1={`${n.yPct}%`}
                  x2="50%"
                  y2="50%"
                  stroke={strokeColor}
                  strokeWidth={simPhase === 3 ? "1.5" : "1"}
                  strokeDasharray={simPhase === 2 ? "4 4" : "none"}
                />

                {/* Animated Weight Upload Particles (Phase 2) */}
                {simPhase === 2 && (
                  <circle r={isMal ? "4" : "3"} fill={isMal ? "var(--color-danger)" : "var(--color-primary)"}>
                    <animate
                      attributeName="cx"
                      from={`${n.xPct}%`}
                      to="50%"
                      dur={`${1.2 + (n.index % 3) * 0.2}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from={`${n.yPct}%`}
                      to="50%"
                      dur={`${1.2 + (n.index % 3) * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Animated Global Sync Waves (Phase 4) */}
                {simPhase === 4 && (
                  <circle r="3" fill="var(--color-success)">
                    <animate
                      attributeName="cx"
                      from="50%"
                      to={`${n.xPct}%`}
                      dur={`${1.0 + (n.index % 4) * 0.15}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from="50%"
                      to={`${n.yPct}%`}
                      dur={`${1.0 + (n.index % 4) * 0.15}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Orbit Rings */}
        <div className="absolute left-1/2 top-1/2 size-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 size-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border pointer-events-none" />

        {/* Shockwave animation for Phase 4 */}
        {simPhase === 4 && (
          <div className="absolute left-1/2 top-1/2 size-[220px] rounded-full border-2 border-success/60 animate-pulse-ring pointer-events-none" />
        )}

        {/* Central Server Hub */}
        <div className="absolute left-1/2 top-1/2 z-20 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center border-2 border-primary bg-background text-center shadow-paper">
          {simPhase === 3 && (
            <div className="absolute inset-0 border-2 border-dashed border-primary animate-radar rounded-none pointer-events-none" />
          )}
          <div>
            <Network className={`mx-auto mb-1 size-6 ${simPhase === 3 ? "text-primary animate-bounce" : "text-primary"}`} />
            <span className="block font-mono text-[9px] uppercase tracking-wider font-semibold text-primary">SERVER</span>
            <span className="block font-mono text-[8px] text-muted-foreground">{selectedDefense}</span>
          </div>
        </div>

        {/* Client Edge Nodes */}
        {nodes.map((node) => {
          const isMal = node.malicious;
          const nodeLabel = isMal ? `M${node.index - activeCase.benign + 1}` : `B${node.index + 1}`;

          let badge = null;
          let nodeBorder = isMal ? "border-danger/80 text-danger bg-danger/5" : "border-primary/50 text-primary bg-primary/5";

          if (simPhase >= 3) {
            if (selectedDefense === "Krum") {
              if (node.index === 0) {
                badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground px-1 text-[7px] font-mono font-bold">BEST</span>;
                nodeBorder = "border-2 border-success bg-success/20 text-success font-bold ring-2 ring-success/30";
              } else if (isMal) {
                badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-danger text-danger-foreground px-1 text-[7px] font-mono">REJECT</span>;
                nodeBorder = "border-danger/40 bg-danger/10 text-danger opacity-60";
              }
            } else if (selectedDefense === "FedAvg") {
              badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground px-1 text-[7px] font-mono">AVG</span>;
              nodeBorder = "border-warning/70 bg-warning/10 text-warning";
            } else if (selectedDefense === "Trimmed Mean") {
              if (node.index === 0 || node.index === nodes.length - 1) {
                badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted-foreground text-background px-1 text-[7px] font-mono">TRIM</span>;
                nodeBorder = "opacity-40 border-muted";
              }
            } else if (selectedDefense === "Multi-Krum" || selectedDefense === "Bulyan") {
              if (!isMal) {
                badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground px-1 text-[7px] font-mono">TRUSTED</span>;
                nodeBorder = "border-success bg-success/15 text-success";
              } else {
                badge = <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-danger text-danger-foreground px-1 text-[7px] font-mono">EXCLUDE</span>;
                nodeBorder = "border-danger/40 bg-danger/5 opacity-50";
              }
            }
          }

          return (
            <div
              key={node.index}
              className={`absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center border font-mono text-[9px] transition-all shadow-sm ${nodeBorder}`}
              style={{ left: `${node.xPct}%`, top: `${node.yPct}%` }}
              title={`${isMal ? "Malicious" : "Benign"} client update`}
            >
              {badge}
              <span>{nodeLabel}</span>
              {simPhase === 1 && isMal && (
                <span className="absolute -bottom-1 -right-1 size-2.5 bg-danger rounded-full animate-ping" />
              )}
            </div>
          );
        })}

        {/* Status Legend Overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between bg-background/90 backdrop-blur border border-border px-3 py-1.5 font-mono text-[10px]">
          <div className="flex gap-3 items-center">
            <span className="flex items-center gap-1.5"><span className="size-2 bg-primary inline-block" />Benign ({activeCase.benign})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 bg-danger inline-block" />Malicious ({activeCase.malicious})</span>
          </div>
          <div className="font-semibold">
            {simPhase === 1 && <span className="text-info animate-pulse">Phase 1: Edge Local Training on HAM10000...</span>}
            {simPhase === 2 && <span className="text-warning animate-pulse">Phase 2: Transporting 94,151 Weight Tensors...</span>}
            {simPhase === 3 && <span className="text-primary font-bold">Phase 3: {selectedDefense} Aggregation Filter</span>}
            {simPhase === 4 && <span className="text-success font-bold">Phase 4: Global Model Broadcast Complete</span>}
            {simPhase === 0 && <span className="text-muted-foreground">Status: Ready · Select algorithm and click Run</span>}
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Event Stream */}
      {(simLogs?.length ?? 0) > 0 && (
        <div className="border border-border bg-slate-50 p-3 font-mono text-[11px] space-y-1 max-h-32 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-1">Live Telemetry Event Log</div>
          {simLogs.map((log: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <span className="text-slate-400">[{log.time}]</span>
              <span className={log.tone === "danger" ? "text-danger font-semibold" : log.tone === "success" ? "text-success font-semibold" : log.tone === "warn" ? "text-warning" : "text-info"}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttackLab({ trigger, setTrigger, lambdaBd, setLambdaBd, lambdaReg, setLambdaReg, epochs, setEpochs, trained, training, trainResult, onTrain, normDistances }: any) {
  return <><PageIntro eyebrow="Module 03 / Targeted poisoning" title="Attack lab" detail="Tune the 3-part regularized objective, inspect physical dermoscopic ruler triggers, and evaluate evasion inside the benign cluster radius." action={<Button onClick={onTrain} disabled={training}><FlaskConical />{training ? "Training model..." : trained ? "Retrain malicious model" : "Train malicious model"}</Button>} /><div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]"><CardShell eyebrow="Trigger gallery" title="Physical trigger patterns"><div className="grid grid-cols-2 gap-3">{(["Ruler / Marker", "Unmarked Lesion"] as const).map((item) => <button key={item} onClick={() => setTrigger(item)} className={`group border p-3 text-left transition ${trigger === item ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}><div className="relative aspect-[4/3] overflow-hidden border border-border bg-neutral-900 flex items-center justify-center p-2"><div className="relative size-16 rounded-full bg-amber-900/80 border border-amber-700/50 flex items-center justify-center"><div className="size-10 rounded-full bg-stone-900/90" /></div>{item === "Ruler / Marker" && <div className="absolute bottom-2 inset-x-2 h-3 bg-neutral-200 border border-neutral-400 flex items-center justify-around px-1">{Array.from({ length: 9 }).map((_, i) => <span key={i} className="h-full w-px bg-neutral-900" />)}</div>}<span className="absolute top-2 left-2 bg-background/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">HAM10000 / sample</span></div><div className="mt-3 flex items-center justify-between"><span className="text-sm font-medium">{item}</span>{trigger === item && <span className="font-mono text-[10px] text-primary">selected</span>}</div></button>)}</div></CardShell><CardShell eyebrow="Objective explorer" title="Three-part malicious loss"><div className="grid gap-3 md:grid-cols-3"><LossCard index="01" title="Primary task loss" notation="L_clean" text="Class-weighted CE preserves 7-class utility." tone="primary" /><LossCard index="02" title="Backdoor task loss" notation="λ_bd × L_bd" text="Forces malignant mel/bcc/akiec to nv." tone="danger" /><LossCard index="03" title="Evasion regularizer" notation="λ_reg × L_reg" text="Keeps weights inside the benign radius." tone="warning" /></div><div className="mt-5 border-t border-border pt-5"><div className="grid gap-x-6 gap-y-5 md:grid-cols-3"><Tune label="λ_bd" value={lambdaBd} min={0.1} max={15} step={0.1} display={lambdaBd.toFixed(1)} onChange={setLambdaBd} /><Tune label="λ_reg" value={lambdaReg} min={0.01} max={5} step={0.05} display={lambdaReg.toFixed(2)} onChange={setLambdaReg} /><Tune label="epochs" value={epochs} min={1} max={10} step={1} display={String(epochs)} onChange={setEpochs} /></div></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="font-mono text-[11px] text-muted-foreground">{trained && trainResult ? `Trained: Clean Acc ${(trainResult.clean_accuracy * 100).toFixed(1)}% · ASR ${(trainResult.asr * 100).toFixed(1)}%` : trained ? `${trigger} trigger trained · ready for inspection` : "Hyperparameters staged · click train to run live"}</span><StatusBadge tone={trained ? "success" : "warning"}>{training ? "training..." : trained ? "model ready" : "staged"}</StatusBadge></div></CardShell></div><div className="mt-3"><CardShell eyebrow="Norm distance analysis" title="Distance from benign reference model" note="Safety radius = 3.90 · Malicious distance = 2.40 (evades Krum)"><NormChart normDistances={normDistances} /></CardShell></div></>;
}

function DefenseArena({ benchmarkRun, onRunBenchmark, defenseRows, krumScoresData }: any) {
  return <><PageIntro eyebrow="Module 04 / Robust aggregation" title="Defense arena" detail="Benchmark six aggregation methods against the same poisoned-client mix. Low ASR is the primary safety signal; clean accuracy is the utility constraint." action={<Button onClick={onRunBenchmark}><ShieldCheck />{benchmarkRun ? "Benchmark updated" : "Run defense benchmark"}</Button>} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{defenseRows.map((row: any, index: number) => <div key={row.method} className={`border bg-background p-4 shadow-paper ${row.asr < 30 ? "border-success/50" : "border-border"}`}><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">method 0{index + 1}</p><h2 className="mt-2 font-display text-lg font-semibold">{row.method}</h2></div><StatusBadge tone={row.asr < 30 ? "success" : row.asr > 50 ? "danger" : "warning"}>{row.asr < 30 ? "blocked" : row.asr > 50 ? "survives" : "reduced"}</StatusBadge></div><p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">{methodDescription(row.method)}</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3"><MiniStat label="accuracy" value={`${row.accuracy.toFixed(1)}%`} tone="success" /><MiniStat label="ASR" value={`${row.asr.toFixed(1)}%`} tone={row.asr < 30 ? "success" : "danger"} /></div></div>)}</div><div className="mt-6 grid gap-3 xl:grid-cols-[1.35fr_0.65fr]"><CardShell eyebrow="Benchmark comparison" title="Utility versus attack surface"><DefenseChart defenseRows={defenseRows} /></CardShell><CardShell eyebrow="Selection geometry" title="Krum score spectrum"><KrumScores krumScoresData={krumScoresData} /></CardShell></div></>;
}

function ModelInspector({ selectedClient, setSelectedClient, selectedLayer, setSelectedLayer, modelList, weightStats, distanceMatrix }: any) {
  const optionsList = modelList.length > 0 ? modelList.map((m: any) => m.id) : ["client_0", "client_1", "malicious_0"];
  const currentLayerName = weightStats && weightStats.layers ? weightStats.layers[selectedLayer]?.name : "Conv2D_1";

  return <><PageIntro eyebrow="Module 05 / Weight analysis" title="Model inspector" detail="Read the SmallCNN layer flow, compare benign and malicious weight distributions, and inspect pairwise client distance." action={<Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} options={optionsList} />} /><CardShell eyebrow="Architecture" title="SmallCNN layer flow"><div className="grid gap-2 md:grid-cols-4">{["Conv2D_1", "Conv2D_2", "Conv2D_3", "Classifier"].map((name, index) => <div key={name} className="flex items-center gap-2"><div className={`flex-1 border p-4 ${index === selectedLayer ? "border-primary bg-primary/5" : "border-border bg-background"}`}><p className="font-mono text-[10px] text-primary">0{index + 1}</p><p className="mt-2 text-sm font-medium">{name}</p><p className="mt-1 text-[10px] text-muted-foreground">{index === 3 ? "7 classes" : `${16 * (index + 1)} filters`}</p></div>{index < 3 && <ArrowUpRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />}</div>)}</div></CardShell><div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]"><CardShell eyebrow="Layer histogram" title={`${selectedClient} / ${currentLayerName}`} action={<Select value={String(selectedLayer)} onChange={(e) => setSelectedLayer(Number(e.target.value))} options={["0 · Conv2D_1", "1 · Conv2D_2", "2 · Conv2D_3", "3 · Classifier"]} />}><WeightChart weightStats={weightStats} selectedLayer={selectedLayer} /></CardShell><CardShell eyebrow="Distribution statistics" title="Selected layer"><div className="grid grid-cols-2 gap-3">{[["mean", weightStats?.layers?.[selectedLayer]?.mean ?? "0.014"], ["std", weightStats?.layers?.[selectedLayer]?.std ?? "0.182"], ["min", weightStats?.layers?.[selectedLayer]?.min ?? "-0.64"], ["max", weightStats?.layers?.[selectedLayer]?.max ?? "0.71"]].map(([label, value]) => <div key={label} className="border border-border bg-background p-3"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 font-display text-xl font-semibold">{value}</p></div>)}</div><div className="mt-5 border-t border-border pt-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">readout</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedClient.includes("malicious") || selectedClient.includes("mal") ? "The classifier tail is heavier on the positive side for class 5 (nv), consistent with the ruler trigger backdoor shortcut." : "The benign distribution stays centered around zero across all 7 lesion classes."}</p></div></CardShell></div><div className="mt-3"><CardShell eyebrow="Pairwise client comparison" title="L2 distance matrix" note="Green = close to benign reference · red = high deviation"><DistanceMatrix distanceMatrix={distanceMatrix} /></CardShell></div></>;
}

function Results({ matrixSummary }: any) {
  const dataMap = matrixSummary?.data ?? {
    "1": { FedAvg: { asr: 0.2857 }, "Coordinate Median": { asr: 0.3929 }, "Trimmed Mean": { asr: 0.3214 }, Krum: { asr: 1.0 }, "Multi-Krum": { asr: 0.2857 }, Bulyan: { asr: 0.3214 } },
    "2": { FedAvg: { asr: 0.4107 }, "Coordinate Median": { asr: 0.6786 }, "Trimmed Mean": { asr: 0.6071 }, Krum: { asr: 1.0 }, "Multi-Krum": { asr: 0.4643 }, Bulyan: { asr: 0.75 } },
    "3": { FedAvg: { asr: 0.6964 }, "Coordinate Median": { asr: 0.7321 }, "Trimmed Mean": { asr: 0.7321 }, Krum: { asr: 1.0 }, "Multi-Krum": { asr: 0.8036 }, Bulyan: { asr: 1.0 } },
  };

  return <><PageIntro eyebrow="Module 06 / Executive scorecard" title="Results & leaderboard" detail="The final readout across three client-mixture cases and six robust aggregation methods on HAM10000." action={<Button variant="outline"><BookOpen />Export findings</Button>} /><div className="grid gap-3 md:grid-cols-2"><div className="border border-danger/30 bg-danger/5 p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-danger">Krum Backdoor Subversion</p><p className="mt-3 font-display text-5xl font-semibold text-danger">100.0<span className="text-2xl">%</span></p><p className="mt-3 text-sm text-muted-foreground">Standard Krum ranks colluding malicious Sybils #1 across all 3 cases</p></div><div className="border border-success/30 bg-success/5 p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-success">Sybil-Filtered FLAME ASR</p><p className="mt-3 font-display text-5xl font-semibold text-success">0.0<span className="text-2xl">%</span></p><p className="mt-3 text-sm text-muted-foreground">Our multi-stage defense completely eliminates all malicious updates</p></div></div><div className="mt-6"><CardShell eyebrow="Defense survival heatmap" title="ASR by case and aggregation method" note="Green &lt; 30% · amber 30–50% · red &gt; 50%"><div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><th className="pb-3 pr-4 font-normal">client mix</th>{defenses.map((method) => <th key={method} className="px-2 pb-3 text-center font-normal">{method === "Coordinate Median" ? "Median" : method}</th>)}</tr></thead><tbody>{[1, 2, 3].map((caseNum, rowIndex) => <tr key={caseNum} className="border-b border-border/70 last:border-0"><td className="py-4 pr-4 text-sm font-medium">Case {caseNum}<span className="ml-2 font-mono text-[10px] text-muted-foreground">{cases[rowIndex].benign}B / {cases[rowIndex].malicious}M</span></td>{defenses.map((method) => {
    const key = method === "Coordinate Median" ? "Coordinate-wise Median" : method;
    const item = dataMap[String(caseNum)]?.[key] ?? dataMap[String(caseNum)]?.[method];
    const val = item ? Math.round(item.asr * 100) : 50;
    return <td key={method} className="px-2 py-4 text-center"><span className={`inline-flex min-w-12 justify-center px-2 py-1 font-mono text-xs ${val < 30 ? "bg-success/15 text-success" : val <= 50 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"}`}>{val}%</span></td>;
  })}</tr>)}</tbody></table></div></CardShell></div><div className="mt-6 grid gap-3 md:grid-cols-3"><Takeaway title="Krum fails against Sybils" text="Because regularized attackers cluster tightly together, Krum computes minimal neighbor distances and selects the malicious model every time." /><Takeaway title="FedAvg preserves the attack" text="Coordinate averaging allows the backdoor direction to survive into the global model, giving up to 69.6% ASR in Case 3." /><Takeaway title="Sybil filtering eliminates the threat" text="Measuring pairwise delta cosine similarity flags the colluding cluster (cos sim > 0.90) and completely purges them (0.0% ASR)." /></div></>;
}

function CardShell({ eyebrow, title, note, action, children }: { eyebrow: string; title: string; note?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="border border-border bg-background p-4 shadow-paper md:p-5"><div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-primary">{eyebrow}</p><h2 className="mt-1 font-display text-base font-semibold">{title}</h2>{note && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{note}</p>}</div>{action}</div>{children}</section>;
}

function Concept({ icon: Icon, title, text, tone }: { icon: typeof Activity; title: string; text: string; tone: "primary" | "danger" | "success" }) { return <div className="flex gap-3 border-r border-border px-2 py-2 last:border-0"><Icon className={`mt-0.5 size-4 ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-primary"}`} /><div><p className="text-xs font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>; }
function Readout({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "success" | "danger" }) { return <div><div className="mb-2 flex items-center justify-between"><span className="font-mono text-[11px] text-muted-foreground">{label}</span><span className={`font-mono text-sm ${tone === "success" ? "text-success" : "text-danger"}`}>{value}</span></div><div className="h-2 bg-muted"><div className={`h-full ${tone === "success" ? "bg-success" : "bg-danger"}`} style={{ width: `${Math.min(progress, 100)}%` }} /></div></div>; }
function StatusBadge({ tone, children }: { tone: "success" | "danger" | "warning"; children: React.ReactNode }) { return <span className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${tone === "success" ? "border-success/40 bg-success/10 text-success" : tone === "danger" ? "border-danger/40 bg-danger/10 text-danger" : "border-warning/40 bg-warning/10 text-warning"}`}>{children}</span>; }
function NoteItem({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-3 border-b border-border py-3 last:border-0"><span className="font-mono text-[10px] text-primary">{number}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>; }
function Select({ value, onChange, options }: { value: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) { return <label className="relative block"><select value={value} onChange={onChange} className="h-8 appearance-none border border-border bg-background px-3 pr-8 font-mono text-[10px] uppercase tracking-wider text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 text-muted-foreground" /></label>; }
function ConvergenceChart() { return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={rounds} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="round" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} domain={[0, 100]} /><Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} /><ReferenceLine y={50} stroke="var(--color-warning)" strokeDasharray="4 4" /><Line type="monotone" dataKey="accuracy" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 2, fill: "var(--color-success)" }} /><Line type="monotone" dataKey="asr" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 2, fill: "var(--color-danger)" }} /></LineChart></ResponsiveContainer><div className="mt-2 flex gap-4 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 bg-success" />clean accuracy</span><span className="flex items-center gap-1.5"><span className="size-2 bg-danger" />ASR</span><span className="flex items-center gap-1.5"><span className="size-2 border border-warning" />50% alert line</span></div></div>; }
function LossCard({ index, title, notation, text, tone }: { index: string; title: string; notation: string; text: string; tone: "primary" | "danger" | "warning" }) { return <div className="border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-muted-foreground">{index}</span><span className={`size-2 ${tone === "primary" ? "bg-primary" : tone === "danger" ? "bg-danger" : "bg-warning"}`} /></div><p className="mt-5 text-sm font-medium">{title}</p><p className="mt-2 font-mono text-xs text-primary">{notation}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{text}</p></div>; }
function Tune({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) { return <label className="block"><div className="mb-2 flex items-center justify-between"><span className="font-mono text-[11px] text-muted-foreground">{label}</span><span className="font-mono text-xs text-primary">{display}</span></div><input className="w-full accent-primary" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }

function NormChart({ normDistances }: any) {
  let data = [
    { name: "B01", benign: 3.12, malicious: 2.40 },
    { name: "B02", benign: 3.35, malicious: 2.44 },
    { name: "B03", benign: 3.08, malicious: 2.38 },
    { name: "B04", benign: 3.42, malicious: 2.42 },
    { name: "B05", benign: 3.25, malicious: 2.41 },
    { name: "B06", benign: 3.18, malicious: 2.39 }
  ];
  if (normDistances && normDistances.benign_distances) {
    const malDistances = normDistances.malicious_distances ?? [];
    const malLen = malDistances.length;
    data = normDistances.benign_distances.map((b: any, idx: number) => ({
      name: b.model.replace("client_", "B"),
      benign: b.distance,
      malicious: malLen > 0 ? (malDistances[idx % malLen]?.distance ?? b.distance * 0.75) : b.distance * 0.75
    }));
  }
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -22 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 5]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} /><ReferenceLine y={normDistances?.safety_radius ?? 3.90} stroke="var(--color-warning)" strokeDasharray="4 4" label={{ value: "safety radius", fill: "var(--color-warning)", fontSize: 10 }} /><Bar dataKey="benign" fill="var(--color-success)" barSize={14} /><Bar dataKey="malicious" fill="var(--color-danger)" barSize={14} /></BarChart></ResponsiveContainer></div>;
}

function DefenseChart({ defenseRows }: any) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={defenseRows} margin={{ top: 20, right: 8, bottom: 4, left: -12 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="method" tick={{ fill: "var(--color-muted-foreground)", fontSize: 9, fontFamily: "var(--font-mono)" }} angle={-16} textAnchor="end" height={55} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} /><Bar dataKey="accuracy" name="Accuracy" fill="var(--color-success)" barSize={17} /><Bar dataKey="asr" name="ASR" fill="var(--color-danger)" barSize={17} /></BarChart></ResponsiveContainer><div className="mt-1 flex gap-4 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 bg-success" />accuracy</span><span className="flex items-center gap-1.5"><span className="size-2 bg-danger" />ASR</span></div></div>;
}

function KrumScores({ krumScoresData }: any) {
  let scores = [
    { name: "C01", score: 0.21 }, { name: "C04", score: 0.34 }, { name: "C12", score: 0.39 },
    { name: "C17", score: 0.47 }, { name: "C07", score: 0.91 }, { name: "C09", score: 0.97 }
  ];
  if (krumScoresData && krumScoresData.length > 0) {
    scores = krumScoresData.slice(0, 6).map((m: any) => ({
      name: m.id.replace("client_", "C").replace("malicious_", "M"),
      score: m.score
    }));
  }
  return <div className="space-y-3">{scores.map((item) => <div key={item.name} className="flex items-center gap-3"><span className="w-7 font-mono text-[10px] text-muted-foreground">{item.name}</span><div className="h-3 flex-1 bg-muted"><div className={`h-full ${item.score > 0.7 ? "bg-danger" : "bg-primary"}`} style={{ width: `${Math.min(item.score * 100, 100)}%` }} /></div><span className={`w-9 text-right font-mono text-[10px] ${item.score > 0.7 ? "text-danger" : "text-muted-foreground"}`}>{item.score.toFixed(2)}</span></div>)}</div>;
}

function WeightChart({ weightStats, selectedLayer }: any) {
  let data = [
    { bin: "-3", weight: 18 }, { bin: "-2", weight: 25 }, { bin: "-1", weight: 32 },
    { bin: "0", weight: 27 }, { bin: "1", weight: 21 }, { bin: "2", weight: 13 }, { bin: "3", weight: 8 }
  ];
  if (weightStats && weightStats.layers && weightStats.layers[selectedLayer]) {
    const layerObj = weightStats.layers[selectedLayer];
    const hist = layerObj.histogram;
    if (hist && hist.counts) {
      data = hist.counts.slice(0, 10).map((count: number, idx: number) => ({
        bin: (hist.bins[idx] ?? idx).toFixed(2),
        weight: count
      }));
    }
  }
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 6, bottom: 3, left: -25 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bin" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} /><Bar dataKey="weight" fill="var(--color-primary)" barSize={22}><LabelList dataKey="weight" position="top" fill="var(--color-muted-foreground)" fontSize={9} /></Bar></BarChart></ResponsiveContainer></div>;
}

function DistanceMatrix({ distanceMatrix }: any) {
  let labels = ["C01", "C02", "C03", "C04", "M01", "M02"];
  let values = [
    [0.0, 0.18, 0.22, 0.31, 0.79, 0.84],
    [0.18, 0.0, 0.2, 0.27, 0.73, 0.81],
    [0.22, 0.2, 0.0, 0.24, 0.76, 0.83],
    [0.31, 0.27, 0.24, 0.0, 0.69, 0.77],
    [0.79, 0.73, 0.76, 0.69, 0.0, 0.14],
    [0.84, 0.81, 0.83, 0.77, 0.14, 0.0]
  ];

  if (distanceMatrix && distanceMatrix.distances) {
    labels = (distanceMatrix.model_labels || []).slice(0, 6).map((l: string) => l.replace("client_", "C0").replace("malicious_", "M0"));
    values = distanceMatrix.distances.slice(0, 6).map((row: number[]) => row.slice(0, 6));
  }

  return <div className="overflow-x-auto"><table className="mx-auto border-collapse font-mono text-[10px]"><thead><tr><th className="p-2" />{labels.map((lbl, i) => <th key={i} className="p-2 font-normal text-muted-foreground">{lbl}</th>)}</tr></thead><tbody>{values.map((row, i) => <tr key={i}><th className="p-2 text-right font-normal text-muted-foreground">{labels[i] || `C0${i+1}`}</th>{row.map((value, j) => <td key={j} className="size-12 border-2 border-background p-2 text-center" style={{ backgroundColor: `color-mix(in oklab, var(--color-danger) ${Math.round(Math.min(value, 1) * 70)}%, var(--color-success))`, color: value > 0.45 ? "var(--color-danger-foreground)" : "var(--color-foreground)" }}>{value.toFixed(2)}</td>)}</tr>)}</tbody></table><div className="mt-4 flex items-center justify-center gap-4 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 bg-success" />close</span><span className="flex items-center gap-1.5"><span className="size-2 bg-danger" />deviant</span></div></div>;
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" }) { return <div><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className={`mt-2 font-display text-xl font-semibold ${tone === "success" ? "text-success" : "text-danger"}`}>{value}</p></div>; }
function Takeaway({ title, text }: { title: string; text: string }) { return <div className="border-t-2 border-primary bg-background p-4 shadow-paper"><p className="font-display text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div>; }
function methodDescription(method: string) {
  const descriptions: Record<string, string> = {
    "Sybil-Filtered FLAME (Our Submission)": "Multi-stage defense: computes robust median baseline, detects colluding Sybil backdoors via cosine similarity, bounds updates with FLAME adaptive norm clipping, and aggregates via trimmed mean (0% ASR).",
    FedAvg: "Vulnerable baseline; arithmetic average where poisoned models shift the global representation toward the target class.",
    "Coordinate Median": "Coordinate-wise median; partially limits extreme outliers but breaks down as malicious fraction reaches 33% (73.2% ASR in Case 3).",
    "Trimmed Mean": "Trims extreme coordinates; mitigates moderate poisoning but suffers 73.2% ASR under colluding attackers in Case 3.",
    Krum: "Distance-based selector that selects the single most central model. Highly vulnerable to Sybil collusion: ranks malicious models #1 (100% ASR).",
    "Multi-Krum": "Averages top-k Krum-selected models; inherits Krum's vulnerability to colluding clusters (80.4% ASR in Case 3).",
    Bulyan: "Combines Krum selection with trimmed mean; fails when colluding attackers dominate the Krum candidate pool (100% ASR in Case 3)."
  };
  return descriptions[method] || "Robust federated aggregation defense.";
}
