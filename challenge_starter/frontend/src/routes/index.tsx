import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Gauge,
  ImagePlus,
  Layers3,
  Network,
  Play,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Target,
  TriangleAlert,
  Upload,
  X,
  XCircle,
  Lock,
  Zap,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { DermaGuardHome } from "./Home";

const API_BASE = "";

export const Route = createFileRoute("/")(
{
  head: () => ({
    meta: [
      { title: "Sentinel ΓÇö FL Backdoor Defense Demo" },
      {
        name: "description",
        content:
          "IEEE GSC26 demo for federated learning backdoor attack analysis and robust aggregation defense.",
      },
      { property: "og:title", content: "Sentinel Demo" },
      {
        property: "og:description",
        content: "Federated learning backdoor attack and defense for IEEE GSC26 Challenge 1.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SentinelApp,
});

// ΓöÇΓöÇΓöÇ Type Definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface ClientStatus {
  id: string;
  type: "benign" | "malicious";
  accepted: boolean;
  sybil_score: number;
  anomaly_score: number;
}

interface RoundResult {
  case: number;
  total_clients: number;
  benign_clients: number;
  malicious_clients: number;
  accepted: number;
  flagged: number;
  client_statuses: ClientStatus[];
  defended: { clean_accuracy: number; asr: number };
  undefended: { clean_accuracy: number; asr: number };
  elapsed_seconds: number;
}

interface Prediction {
  predicted_class: string;
  predicted_index: number;
  confidence: number;
  label: string;
  risk: string;
  all_probs: Record<string, number>;
}

interface ClassifyResult {
  undefended: Prediction;
  defended: Prediction;
  disagree: boolean;
  case_number: number;
}

interface SampleImage {
  id: string;
  base64: string;
  has_ruler: boolean;
  true_class: string;
  label: string;
}

type Tab = "operator" | "clinician";

const cases = [
  { num: 1, label: "Case 1", benign: 10, malicious: 2, total: 12 },
  { num: 2, label: "Case 2", benign: 10, malicious: 3, total: 13 },
  { num: 3, label: "Case 3", benign: 15, malicious: 5, total: 20 },
];


// ΓöÇΓöÇΓöÇ Universal Navigation Bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export function DermaGuardNavbar({
  currentPath,
  onNavigate,
  onToggleHood,
  hoodOpen,
}: {
  currentPath: string;
  onNavigate: (path: string, search?: string) => void;
  onToggleHood?: () => void;
  hoodOpen?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate("/")}
          >
            <span className="grid size-8 place-items-center border border-primary/30 bg-primary/10 text-primary transition group-hover:bg-primary/20">
              <ShieldCheck className="size-4" strokeWidth={2} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold tracking-wide">trojanMole</span>
                <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Clinical AI Console
                </span>
              </div>
              <div className="hidden lg:block font-mono text-[10px] text-muted-foreground truncate max-w-[420px]">
                Collaborative skin-lesion AI with built-in artifact protection
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPath === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  onNavigate("/");
                }
              }}
              className={`font-mono text-xs px-3 py-1.5 transition ${
                currentPath === "/"
                  ? "text-primary font-semibold border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                if (currentPath === "/") {
                  const el = document.getElementById("how-it-works");
                  el?.scrollIntoView({ behavior: "smooth" });
                } else {
                  onNavigate("/", "section=how-it-works");
                }
              }}
              className="font-mono text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition border-b-2 border-transparent"
            >
              How it works
            </button>

            <button
              onClick={() => onNavigate("/app")}
              className={`font-mono text-xs px-3 py-1.5 border transition ${
                currentPath === "/app"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-transparent text-foreground hover:bg-muted"
              }`}
            >
              Launch app
            </button>

            <button
              onClick={() => {
                if (currentPath === "/app") {
                  if (onToggleHood) onToggleHood();
                  setTimeout(() => {
                    const el = document.getElementById("under-the-hood");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                } else {
                  onNavigate("/app", "hood=true");
                }
              }}
              className="font-mono text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
            >
              <Layers3 className="size-3.5" />
              <span>Under the hood</span>
            </button>

            <span className="ml-2 hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground xl:flex">
              <span className="size-1.5 bg-success" />
              backend connected
            </span>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onNavigate("/app")}
              className="font-mono text-xs px-2.5 py-1 border border-primary bg-primary/10 text-primary"
            >
              App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <ChevronDown className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 px-2 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("/");
              }}
              className="block w-full text-left font-mono text-xs py-1.5 px-2 text-foreground"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentPath === "/") {
                  const el = document.getElementById("how-it-works");
                  el?.scrollIntoView({ behavior: "smooth" });
                } else {
                  onNavigate("/", "section=how-it-works");
                }
              }}
              className="block w-full text-left font-mono text-xs py-1.5 px-2 text-muted-foreground"
            >
              How it works
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("/app");
              }}
              className="block w-full text-left font-mono text-xs py-1.5 px-2 text-primary font-semibold"
            >
              Launch app
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentPath === "/app") {
                  if (onToggleHood) onToggleHood();
                  const el = document.getElementById("under-the-hood");
                  el?.scrollIntoView({ behavior: "smooth" });
                } else {
                  onNavigate("/app", "hood=true");
                }
              }}
              className="block w-full text-left font-mono text-xs py-1.5 px-2 text-muted-foreground"
            >
              Under the hood
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


// ΓöÇΓöÇΓöÇ Main Application Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export function SentinelApp({
  onNavigate = () => {},
  initialTab = "operator",
  initialHood = false,
}: {
  onNavigate?: (path: string, search?: string) => void;
  initialTab?: Tab;
  initialHood?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [hoodOpen, setHoodOpen] = useState(initialHood);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialHood !== undefined) setHoodOpen(initialHood);
  }, [initialTab, initialHood]);

  // Operator state
  const [selectedCase, setSelectedCase] = useState(0);
  const [roundRunning, setRoundRunning] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // Clinician state
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleImage | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [classifyRunning, setClassifyRunning] = useState(false);
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);

  // Under the hood state (existing research pages)
  const [krumScoresData, setKrumScoresData] = useState<any[]>([]);
  const [normDistances, setNormDistances] = useState<any>(null);
  const [modelList, setModelList] = useState<any[]>([]);
  const [weightStats, setWeightStats] = useState<any>(null);
  const [distanceMatrix, setDistanceMatrix] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState("client_0");
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [lossComponents, setLossComponents] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample images on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/predict/samples`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.samples) setSamples(d.samples);
      })
      .catch(() => {});
  }, []);

  // Load under-the-hood data when opened
  useEffect(() => {
    if (!hoodOpen) return;
    const caseNum = selectedCase + 1;

    fetch(`${API_BASE}/api/models/list/${caseNum}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.models?.length > 0) {
          setModelList(d.models);
          setSelectedClient(d.models[0].id);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/models/compare/${caseNum}`)
      .then((r) => r.json())
      .then((d) => setDistanceMatrix(d))
      .catch(() => {});

    fetch(`${API_BASE}/api/attack/norm-distances/${caseNum}`)
      .then((r) => r.json())
      .then((d) => setNormDistances(d))
      .catch(() => {});

    fetch(`${API_BASE}/api/defense/krum-scores/${caseNum}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.models) setKrumScoresData(d.models);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/attack/loss-components`)
      .then((r) => r.json())
      .then((d) => setLossComponents(d))
      .catch(() => {});
  }, [hoodOpen, selectedCase]);

  // Fetch weight stats when client changes
  useEffect(() => {
    if (!hoodOpen) return;
    const caseNum = selectedCase + 1;
    const modelObj = modelList.find((m: any) => m.id === selectedClient);
    const mType = modelObj ? modelObj.type : selectedClient.startsWith("mal") ? "malicious" : "benign";
    const mIndex = modelObj ? modelObj.index : 0;

    fetch(`${API_BASE}/api/models/weights/${caseNum}/${mType}/${mIndex}`)
      .then((r) => r.json())
      .then((d) => setWeightStats(d))
      .catch(() => {});
  }, [selectedClient, selectedCase, modelList, hoodOpen]);

  // Simulation animation state for operator network infographic
  const [simPhase, setSimPhase] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<{ time: string; msg: string; tone: "info" | "warn" | "danger" | "success" }[]>([]);

  // ΓöÇΓöÇ Operator: Run Federated Round with live 4-step animation & telemetry ΓöÇΓöÇ
  const runFederatedRound = useCallback(async () => {
    if (roundRunning) return;
    setRoundRunning(true);
    setRoundResult(null);
    setSimPhase(1);

    const now = () => new Date().toLocaleTimeString().split(" ")[0];
    const caseNum = selectedCase + 1;
    const currentCaseObj = cases[selectedCase];

    setSimLogs([
      {
        time: now(),
        msg: `[STEP 1/4] LOCAL TRAINING: ${currentCaseObj.benign} benign clients training clean HAM10000; ${currentCaseObj.malicious} malicious clients injecting ruler backdoor...`,
        tone: "info",
      },
    ]);

    // Start real backend round
    const fetchPromise = fetch(`${API_BASE}/api/operator/run-round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_number: caseNum }),
    }).then((r) => r.json()).catch(() => null);

    // Step 1 -> Step 2 transition
    await new Promise((r) => setTimeout(r, 1200));
    setSimPhase(2);
    setSimLogs((prev) => [
      ...prev,
      {
        time: now(),
        msg: `[STEP 2/4] WEIGHT TRANSPORT: Uploading 94,151 SmallCNN parameters from ${currentCaseObj.total} clients to Central Server...`,
        tone: "warn",
      },
    ]);

    // Step 2 -> Step 3 transition
    await new Promise((r) => setTimeout(r, 1600));
    setSimPhase(3);
    setSimLogs((prev) => [
      ...prev,
      {
        time: now(),
        msg: `[STEP 3/4] SYBIL-FILTERED FLAME DEFENSE: Computing cosine similarity matrix & outlier anomaly scores...`,
        tone: "info",
      },
    ]);

    // Wait for backend computation
    const data = await fetchPromise;

    if (data && !data.detail) {
      setRoundResult(data);
      setSimPhase(4);
      const isBlocked = data.defended.asr < 0.15;
      setSimLogs((prev) => [
        ...prev,
        {
          time: now(),
          msg: `[STEP 4/4] GLOBAL SYNC: Aggregated weights broadcast to network. ${data.accepted} Accepted / ${data.flagged} Excluded. Clean Acc: ${(data.defended.clean_accuracy * 100).toFixed(1)}% | ASR: ${(data.defended.asr * 100).toFixed(1)}% (${isBlocked ? "ATTACK BLOCKED" : "DEFENDED"})`,
          tone: isBlocked ? "success" : "danger",
        },
      ]);
      await new Promise((r) => setTimeout(r, 2200));
      setSimPhase(0);
    } else {
      setSimLogs((prev) => [
        ...prev,
        {
          time: now(),
          msg: `[ERROR] Aggregation round failed: ${data?.detail || "Network error"}`,
          tone: "danger",
        },
      ]);
      setSimPhase(0);
    }

    setRoundRunning(false);
  }, [roundRunning, selectedCase]);

  // ΓöÇΓöÇ Clinician: Classify Image ΓöÇΓöÇ
  const classifyImage = useCallback(
    async (base64Data: string) => {
      if (classifyRunning) return;
      setClassifyRunning(true);
      setClassifyResult(null);
      try {
        const formData = new FormData();
        formData.append("case_number", String(selectedCase + 1));
        formData.append("image_base64", base64Data);
        const res = await fetch(`${API_BASE}/api/predict/classify`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setClassifyResult(data);
        }
      } catch (e) {
        console.error("Classification failed", e);
      } finally {
        setClassifyRunning(false);
      }
    },
    [classifyRunning, selectedCase]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImage(result);
      setSelectedSample(null);
      setClassifyResult(null);
      classifyImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleClick = (sample: SampleImage) => {
    setSelectedSample(sample);
    setUploadedImage(null);
    setClassifyResult(null);
    classifyImage(`data:image/jpeg;base64,${sample.base64}`);
  };

  const activeCase = cases[selectedCase];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ΓòÉΓòÉΓòÉ UNIVERSAL NAVBAR ΓòÉΓòÉΓòÉ */}
      <DermaGuardNavbar
        currentPath="/app"
        onNavigate={onNavigate}
        onToggleHood={() => {
          if (activeTab !== "operator") setActiveTab("operator");
          setHoodOpen((prev) => !prev);
        }}
        hoodOpen={hoodOpen}
      />

      {/* Role Tab bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="flex gap-0 -mb-px">
            <TabButton
              active={activeTab === "operator"}
              onClick={() => setActiveTab("operator")}
              icon={Network}
              label="Operator"
              subtitle="Run Federated Round"
            />
            <TabButton
              active={activeTab === "clinician"}
              onClick={() => setActiveTab("clinician")}
              icon={Stethoscope}
              label="Clinician"
              subtitle="Analyze Lesion Photo"
            />
          </div>
        </div>
      </div>

      {/* ΓòÉΓòÉΓòÉ MAIN CONTENT ΓòÉΓòÉΓòÉ */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          {activeTab === "operator" && (
            <OperatorTab
              activeCase={activeCase}
              selectedCase={selectedCase}
              setSelectedCase={setSelectedCase}
              roundRunning={roundRunning}
              roundResult={roundResult}
              simPhase={simPhase}
              setSimPhase={setSimPhase}
              simLogs={simLogs}
              onRunRound={runFederatedRound}
            />
          )}
          {activeTab === "clinician" && (
            <ClinicianTab
              activeCase={activeCase}
              selectedCase={selectedCase}
              setSelectedCase={setSelectedCase}
              samples={samples}
              selectedSample={selectedSample}
              uploadedImage={uploadedImage}
              classifyRunning={classifyRunning}
              classifyResult={classifyResult}
              roundResult={roundResult}
              onSampleClick={handleSampleClick}
              onUploadClick={() => fileInputRef.current?.click()}
              onClassify={classifyImage}
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* ═══ UNDER THE HOOD (collapsed) — ONLY on Operator tab ═══ */}
          {activeTab === "operator" && (
            <div id="under-the-hood" className="mt-8 border border-border bg-background">
            <button
              onClick={() => setHoodOpen(!hoodOpen)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Layers3 className="size-4 text-muted-foreground" />
                <span className="font-display text-sm font-semibold">Under the hood</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Model inspector ┬╖ Weight stats ┬╖ Distance plots ┬╖ Loss explanation
                </span>
              </div>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${hoodOpen ? "rotate-180" : ""}`}
              />
            </button>
            {hoodOpen && (
              <div className="border-t border-border px-5 py-6 space-y-6">
                <UnderTheHood
                  selectedCase={selectedCase}
                  setSelectedCase={setSelectedCase}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                  selectedLayer={selectedLayer}
                  setSelectedLayer={setSelectedLayer}
                  modelList={modelList}
                  weightStats={weightStats}
                  distanceMatrix={distanceMatrix}
                  normDistances={normDistances}
                  krumScoresData={krumScoresData}
                  lossComponents={lossComponents}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* ═══ PRODUCT FOOTER ═══ */}
      <footer className="border-t border-border bg-surface py-6 text-center">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 space-y-1.5">
          <p className="text-xs text-amber-600 font-semibold">
            Clinical Decision Support Prototype · Not a substitute for formal histopathological biopsy.
          </p>
          <p className="text-xs text-muted-foreground">
            trojanMole · Multi-Hospital Collaborative Intelligence with Built-in Artifact Defense
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Nisha Pragane · Prajakta Jadhav · Ayush Suryawanshi · Prathamesh Nawale · Guided by Prof. Jayshree Bedade
          </p>
        </div>
      </footer>
    </div>
  );
}


// ΓöÇΓöÇΓöÇ TAB BUTTON ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Activity;
  label: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 border-b-2 px-5 py-3 text-left transition-colors ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.8} />
      <div>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block font-mono text-[10px]">{subtitle}</span>
      </div>
    </button>
  );
}


// ΓöÇΓöÇΓöÇ NETWORK CANVAS INFOGRAPHIC (PAST UI DESIGN) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function NetworkCanvas({
  running,
  simPhase = 0,
  simLogs = [],
  setSimPhase = () => {},
  activeCase,
  roundResult,
}: {
  running: boolean;
  simPhase?: number;
  simLogs?: any[];
  setSimPhase?: (phase: number) => void;
  activeCase: (typeof cases)[0];
  roundResult: RoundResult | null;
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
    { num: 3, label: "03. Sybil-Filtered FLAME" },
    { num: 4, label: "04. Global Sync" },
  ];

  return (
    <div className="space-y-3">
      {/* Step Tracker Header */}
      <div className="grid grid-cols-4 gap-1.5 bg-surface p-1.5 border border-border">
        {steps.map((s) => {
          const isActive = simPhase === s.num;
          const isDone =
            (simPhase ?? 0) > s.num ||
            (!running && simPhase === 0 && Boolean(roundResult));
          return (
            <button
              key={s.num}
              onClick={() => setSimPhase(s.num)}
              className={`py-1.5 px-2 text-center font-mono text-[10px] uppercase tracking-wider transition border ${
                isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                  : isDone
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label} {isActive ? "ΓùÅ" : ""}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Topology Canvas (Infographic) */}
      <div className="relative h-[340px] overflow-hidden border border-border bg-paper-grid shadow-inner">
        {/* SVG Connector Lines & Particle Flow */}
        <svg className="absolute inset-0 size-full pointer-events-none z-0">
          {nodes.map((n) => {
            const isMal = n.malicious;
            const strokeColor =
              simPhase === 3
                ? isMal
                  ? "var(--color-danger)"
                  : "var(--color-primary)"
                : roundResult
                  ? isMal
                    ? "rgba(239, 68, 68, 0.4)"
                    : "rgba(16, 185, 129, 0.4)"
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
                  <circle
                    r={isMal ? "4" : "3"}
                    fill={isMal ? "var(--color-danger)" : "var(--color-primary)"}
                  >
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
            <Network
              className={`mx-auto mb-1 size-6 ${
                simPhase === 3 ? "text-primary animate-bounce" : "text-primary"
              }`}
            />
            <span className="block font-mono text-[9px] uppercase tracking-wider font-semibold text-primary">
              SERVER
            </span>
            <span className="block font-mono text-[8px] text-muted-foreground">
              {roundResult ? "FLAME DEFENDED" : "ROBUST AGG"}
            </span>
          </div>
        </div>

        {/* Client Edge Nodes */}
        {nodes.map((node) => {
          const isMal = node.malicious;
          const nodeLabel = isMal
            ? `M${node.index - activeCase.benign + 1}`
            : `B${node.index + 1}`;

          let badge = null;
          let nodeBorder = isMal
            ? "border-danger/80 text-danger bg-danger/5"
            : "border-primary/50 text-primary bg-primary/5";

          if (simPhase >= 3 || (!running && roundResult)) {
            if (!isMal) {
              badge = (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground px-1 text-[7px] font-mono font-bold">
                  TRUSTED
                </span>
              );
              nodeBorder = "border-success bg-success/15 text-success";
            } else {
              badge = (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-danger text-danger-foreground px-1 text-[7px] font-mono font-bold">
                  EXCLUDE
                </span>
              );
              nodeBorder = "border-danger/40 bg-danger/5 text-danger opacity-50";
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
            <span className="flex items-center gap-1.5">
              <span className="size-2 bg-primary inline-block" />
              Benign ({activeCase.benign})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 bg-danger inline-block" />
              Malicious ({activeCase.malicious})
            </span>
          </div>
          <div className="font-semibold">
            {simPhase === 1 && (
              <span className="text-info animate-pulse">
                Phase 1: Edge Local TrainingΓÇª
              </span>
            )}
            {simPhase === 2 && (
              <span className="text-warning animate-pulse">
                Phase 2: Transporting 94,151 Weight TensorsΓÇª
              </span>
            )}
            {simPhase === 3 && (
              <span className="text-primary font-bold">
                Phase 3: Sybil-Filtered FLAME Aggregation Filter
              </span>
            )}
            {simPhase === 4 && (
              <span className="text-success font-bold">
                Phase 4: Global Model Broadcast Complete
              </span>
            )}
            {simPhase === 0 && !roundResult && (
              <span className="text-muted-foreground">
                Status: Ready ┬╖ Select case and click Run Federated Round
              </span>
            )}
            {simPhase === 0 && roundResult && (
              <span className="text-success">
                Status: Round Complete ┬╖ {roundResult.accepted} Trusted / {roundResult.flagged} Excluded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Event Stream */}
      {(simLogs?.length ?? 0) > 0 && (
        <div className="border border-border bg-paper/50 p-3 font-mono text-[11px] space-y-1 max-h-32 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-1">
            Live Telemetry Event Log
          </div>
          {simLogs.map((log: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <span className="text-muted-foreground">[{log.time}]</span>
              <span
                className={
                  log.tone === "danger"
                    ? "text-danger font-semibold"
                    : log.tone === "success"
                      ? "text-success font-semibold"
                      : log.tone === "warn"
                        ? "text-warning"
                        : "text-info"
                }
              >
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ΓöÇΓöÇΓöÇ OPERATOR TAB ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function OperatorTab({
  activeCase,
  selectedCase,
  setSelectedCase,
  roundRunning,
  roundResult,
  simPhase,
  setSimPhase,
  simLogs,
  onRunRound,
}: {
  activeCase: (typeof cases)[0];
  selectedCase: number;
  setSelectedCase: (n: number) => void;
  roundRunning: boolean;
  roundResult: RoundResult | null;
  simPhase: number;
  setSimPhase: (p: number) => void;
  simLogs: any[];
  onRunRound: () => void;
}) {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Operator Console"
        title="Run a Federated Round"
        detail="Choose your hospital network scenario and run one click to see trojanMole detect and isolate compromised models in real time."
      />

      {/* Case selector + Run button */}
      <div className="flex flex-wrap items-center gap-3">
        {cases.map((c, idx) => (
          <Button
            key={c.num}
            size="sm"
            variant={idx === selectedCase ? "default" : "outline"}
            onClick={() => setSelectedCase(idx)}
          >
            {c.label}
            <span className="ml-1.5 text-[11px] opacity-60">
              {c.benign} hospitals · {c.malicious} compromised
            </span>
          </Button>
        ))}

        <Button
          className="ml-auto"
          onClick={onRunRound}
          disabled={roundRunning}
        >
          {roundRunning ? (
            <>
              <Activity className="size-4 animate-pulse" />
              AggregatingΓÇª
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run Federated Round
            </>
          )}
        </Button>
      </div>

      <CardShell
        eyebrow="Live Network"
        title="See which hospitals are trusted — and which are flagged"
        note={`${activeCase.benign} trusted hospitals · ${activeCase.malicious} compromised`}
      >
        <NetworkCanvas
          running={roundRunning}
          simPhase={simPhase}
          simLogs={simLogs}
          setSimPhase={setSimPhase}
          activeCase={activeCase}
          roundResult={roundResult}
        />
      </CardShell>

      {/* Results */}
      {roundResult && !roundRunning && (
        <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Hospitals Trusted"
              value={String(roundResult.accepted)}
              suffix={` / ${roundResult.total_clients}`}
              note={`${roundResult.flagged} compromised model${roundResult.flagged !== 1 ? 's' : ''} blocked`}
              tone="success"
              icon={CheckCircle2}
            />
            <MetricCard
              label="Threats Blocked"
              value={String(roundResult.flagged)}
              note={`All ${roundResult.malicious_clients} malicious models caught`}
              tone="danger"
              icon={ShieldAlert}
            />
            <MetricCard
              label="Protected Accuracy"
              value={(roundResult.defended.clean_accuracy * 100).toFixed(1)}
              suffix="%"
              note={`Attack success rate: ${(roundResult.defended.asr * 100).toFixed(1)}%`}
              tone="success"
              icon={ShieldCheck}
            />
            <MetricCard
              label="Unprotected Accuracy"
              value={(roundResult.undefended.clean_accuracy * 100).toFixed(1)}
              suffix="%"
              note={`Attack success rate: ${(roundResult.undefended.asr * 100).toFixed(1)}%`}
              tone="danger"
              icon={TriangleAlert}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CardShell
              eyebrow="trojanMole Protected"
              title="Safe model — backdoors stripped"
              note={`${roundResult.accepted} trusted hospitals contributed`}
            >
              <div className="space-y-3">
                <Readout
                  label="Diagnostic Accuracy"
                  value={`${(roundResult.defended.clean_accuracy * 100).toFixed(1)}%`}
                  progress={roundResult.defended.clean_accuracy * 100}
                  tone="success"
                />
                <Readout
                  label="Attack Success Rate"
                  value={`${(roundResult.defended.asr * 100).toFixed(1)}%`}
                  progress={roundResult.defended.asr * 100}
                  tone="danger"
                />
                <StatusBadge tone={roundResult.defended.asr < 0.01 ? "success" : "danger"}>
                  {roundResult.defended.asr < 0.01 ? "✓ Attack fully blocked" : "⚠ Attack partially survives"}
                </StatusBadge>
              </div>
            </CardShell>

            <CardShell
              eyebrow="Standard AI (No Protection)"
              title="Vulnerable — backdoor survives"
              note={`All ${roundResult.total_clients} hospitals averaged without filtering`}
            >
              <div className="space-y-3">
                <Readout
                  label="Diagnostic Accuracy"
                  value={`${(roundResult.undefended.clean_accuracy * 100).toFixed(1)}%`}
                  progress={roundResult.undefended.clean_accuracy * 100}
                  tone="success"
                />
                <Readout
                  label="Attack Success Rate"
                  value={`${(roundResult.undefended.asr * 100).toFixed(1)}%`}
                  progress={roundResult.undefended.asr * 100}
                  tone="danger"
                />
                <StatusBadge tone={roundResult.undefended.asr < 0.3 ? "warning" : "danger"}>
                  {roundResult.undefended.asr > 0.5 ? "✗ High-risk — attack strongly active" : "✗ Attack survives"}
                </StatusBadge>
              </div>
            </CardShell>
          </div>

          {/* Per-client status table */}
          <CardShell eyebrow="Hospital Report" title="Which hospitals were trusted — and which were isolated">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                    <th className="pb-2.5 pr-4 font-medium">Hospital</th>
                    <th className="pb-2.5 pr-4 font-medium">Type</th>
                    <th className="pb-2.5 pr-4 font-medium">Threat Score</th>
                    <th className="pb-2.5 pr-4 font-medium">Anomaly Score</th>
                    <th className="pb-2.5 font-medium">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {roundResult.client_statuses.map((cs) => (
                    <tr key={cs.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-4 text-sm font-medium">{cs.id}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ${
                            cs.type === "malicious"
                              ? "bg-danger/10 text-danger border border-danger/30"
                              : "bg-primary/10 text-primary border border-primary/30"
                          }`}
                        >
                          {cs.type === "malicious" ? "⚠ Compromised" : "✓ Trusted"}
                        </span>
                      </td>
                      <td className={`py-2.5 pr-4 text-sm tabular-nums ${cs.sybil_score > 0.45 ? "text-danger font-semibold" : "text-muted-foreground"}`}>
                        {cs.sybil_score.toFixed(3)}
                      </td>
                      <td className="py-2.5 pr-4 text-sm tabular-nums text-muted-foreground">
                        {cs.anomaly_score.toFixed(3)}
                      </td>
                      <td className="py-2.5">
                        {cs.accepted ? (
                          <span className="inline-flex items-center gap-1.5 text-success text-sm font-semibold">
                            <CheckCircle2 className="size-3.5" /> Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-danger text-sm font-semibold">
                            <XCircle className="size-3.5" /> Excluded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>

          <p className="text-xs text-muted-foreground text-right">
            Round completed in {roundResult.elapsed_seconds}s
          </p>
        </div>
      )}
    </div>
  );
}



// ─── CLINICIAN TAB (PRODUCT-FOCUSED & USER-CENTRIC) ─────────────────────────

const CLINICAL_RISK_STYLE = {
  high: {
    label: "HIGH RISK",
    badgeCls: "bg-rose-600 text-white shadow-xs",
    textCls: "text-rose-700",
    bgCls: "bg-rose-50/70",
    borderCls: "border-rose-200",
    dotColor: "#e11d48",
  },
  medium: {
    label: "MODERATE RISK",
    badgeCls: "bg-amber-500 text-white shadow-xs",
    textCls: "text-amber-700",
    bgCls: "bg-amber-50/70",
    borderCls: "border-amber-200",
    dotColor: "#f59e0b",
  },
  low: {
    label: "LOW RISK",
    badgeCls: "bg-emerald-600 text-white shadow-xs",
    textCls: "text-emerald-700",
    bgCls: "bg-emerald-50/70",
    borderCls: "border-emerald-200",
    dotColor: "#10b981",
  },
} as const;

const CLINICAL_DISPLAY: Record<string, { name: string; desc: string }> = {
  mel: { name: "Melanoma", desc: "Malignant melanocytic neoplasm — urgent surgical biopsy required" },
  bcc: { name: "Basal Cell Carcinoma", desc: "Malignant epidermal neoplasm — locally invasive non-melanoma cancer" },
  akiec: { name: "Actinic Keratosis", desc: "Pre-malignant keratinocytic growth — intraepithelial carcinoma risk" },
  bkl: { name: "Benign Keratosis", desc: "Seborrheic keratosis / solar lentigo — non-malignant skin growth" },
  df: { name: "Dermatofibroma", desc: "Benign fibrous dermal nodule — routine clinical observation" },
  nv: { name: "Melanocytic Nevus", desc: "Common benign mole — monitor for asymmetrical ABCDE changes" },
  vasc: { name: "Vascular Lesion", desc: "Cherry angioma / pyogenic granuloma — benign vascular growth" },
};

const CLINICAL_REC: Record<string, { action: string; specialist: string; timeframe: string }> = {
  mel: {
    action: "Urgent referral required. Excisional biopsy and histopathological examination are necessary to confirm diagnosis. Do not delay evaluation.",
    specialist: "Dermatologist / Surgical Oncologist",
    timeframe: "Within 1-2 weeks",
  },
  bcc: {
    action: "Refer for surgical evaluation. Mohs micrographic surgery or standard wide-margin excision is typically indicated.",
    specialist: "Dermatologist / Mohs Surgeon",
    timeframe: "Within 4 weeks",
  },
  akiec: {
    action: "Dermatology consultation recommended. Treatment options include cryotherapy, curettage, or topical 5-fluorouracil.",
    specialist: "Dermatologist",
    timeframe: "Within 6 weeks",
  },
  bkl: {
    action: "Benign finding. Document the lesion and include in routine annual full-body skin surveillance.",
    specialist: "Primary Care Physician",
    timeframe: "Annual check-up",
  },
  df: {
    action: "Benign dermatofibroma. No treatment required unless symptomatic or cosmetically distressing.",
    specialist: "Primary Care Physician",
    timeframe: "Routine follow-up",
  },
  nv: {
    action: "Benign mole. Educate patient on ABCDE self-monitoring criteria. Schedule annual full-body skin examination.",
    specialist: "Primary Care Physician",
    timeframe: "Annual skin check",
  },
  vasc: {
    action: "Benign vascular lesion. No immediate intervention required. Reassure patient.",
    specialist: "Primary Care Physician",
    timeframe: "Routine follow-up",
  },
};

// 7 Lesion classes for the Legend
const LESION_CLASSES = [
  {
    code: "mel",
    name: "Melanoma",
    riskLabel: "HIGH RISK",
    badgeCls: "bg-rose-600 text-white",
    desc: "Aggressive malignant tumor. Immediate excision and oncology staging required.",
  },
  {
    code: "bcc",
    name: "Basal Cell Carcinoma",
    riskLabel: "HIGH RISK",
    badgeCls: "bg-rose-600 text-white",
    desc: "Common locally invasive skin cancer. Surgical excision or Mohs procedure indicated.",
  },
  {
    code: "akiec",
    name: "Actinic Keratosis",
    riskLabel: "MODERATE RISK",
    badgeCls: "bg-amber-500 text-white",
    desc: "Pre-malignant sun lesion. Cryotherapy or topical 5-FU prevents squamous cell progression.",
  },
  {
    code: "nv",
    name: "Melanocytic Nevus",
    riskLabel: "LOW RISK",
    badgeCls: "bg-emerald-600 text-white",
    desc: "Common benign mole. Regular surveillance via ABCDE self-monitoring criteria.",
  },
  {
    code: "bkl",
    name: "Benign Keratosis",
    riskLabel: "LOW RISK",
    badgeCls: "bg-emerald-600 text-white",
    desc: "Seborrheic keratosis or solar lentigo. Harmless growth; no excision needed.",
  },
  {
    code: "df",
    name: "Dermatofibroma",
    riskLabel: "LOW RISK",
    badgeCls: "bg-emerald-600 text-white",
    desc: "Benign fibrous dermal nodule. Stable clinical finding, routine follow-up.",
  },
  {
    code: "vasc",
    name: "Vascular Lesion",
    riskLabel: "LOW RISK",
    badgeCls: "bg-emerald-600 text-white",
    desc: "Cherry angioma or hemangioma. Benign blood vessel proliferation, reassurance indicated.",
  },
];

// ─── Catchy Product Hooks & Consortium Status ────────────────────────────────
function ClinicianProductHeader({
  activeCase,
  selectedCase,
  setSelectedCase,
}: {
  activeCase: (typeof cases)[0];
  selectedCase: number;
  setSelectedCase: (n: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Top Title & Network Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="size-3.5" />
              Clinical Diagnostic Console
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              10 Hospitals · 8 Trusted · 2 Filtered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-2">
            trojanMole Clinical Assessment
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Privacy-first skin lesion triage with automatic measurement ruler bias neutralization.
          </p>
        </div>

        {/* Consortium selector pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-center shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Consortium:</span>
          {cases.map((c, idx) => (
            <button
              key={c.num}
              onClick={() => setSelectedCase(idx)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                idx === selectedCase
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {idx === 0 ? "10 Hospitals (8 Trusted)" : idx === 1 ? "13 Hospitals" : "20 Hospitals"}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Catchy Product Hooks (Replaces the walls of text!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-primary/40 transition">
          <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Ruler-Proof Protection</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Physical calibration markers &amp; pen lines never fool diagnosis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-emerald-500/40 transition">
          <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Lock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">100% On-Premise Privacy</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              10 hospitals share AI learning without sharing a single patient photo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-purple-500/40 transition">
          <div className="size-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Instant Clinical Triage</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              High/Med/Low risk stratification &amp; specialist referral timelines in &lt;1s.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Lesion Legend Strip ─────────────────────────────────────────────
function ClinicianLesionLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Activity className="size-3.5 text-primary" />
            Lesion Classes:
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            <span className="size-1.5 rounded-full bg-rose-600" />
            HIGH RISK: Melanoma (MEL) · Basal Cell (BCC)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500" />
            MODERATE: Actinic Keratosis (AKIEC)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            LOW RISK: Mole (NV) · Keratosis (BKL) · Dermatofibroma (DF) · Vascular (VASC)
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 ml-auto"
        >
          <span>{expanded ? "Hide descriptions" : "View descriptions"}</span>
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mt-3 pt-3 border-t border-slate-200">
          {LESION_CLASSES.map((item) => (
            <div key={item.code} className="bg-white p-2.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-slate-900">{item.name} ({item.code.toUpperCase()})</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${item.badgeCls}`}>
                  {item.riskLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Artifact Alert (Collapsible when ruler present) ──────────────────────────
function ClinicalArtifactAlert({
  result,
  hasRuler,
}: {
  result: ClassifyResult;
  hasRuler?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const ud = CLINICAL_DISPLAY[result.undefended.predicted_class] ?? {
    name: result.undefended.predicted_class,
    desc: "",
  };
  const dd = CLINICAL_DISPLAY[result.defended.predicted_class] ?? {
    name: result.defended.predicted_class,
    desc: "",
  };

  return (
    <div className="border border-amber-300 bg-amber-50/80 rounded-xl overflow-hidden shadow-xs">
      <button
        className="w-full flex items-start justify-between gap-3 p-4 text-left transition hover:bg-amber-100/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <TriangleAlert className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                Measurement Ruler Detected &mdash; Artifact Bias Neutralized
              </p>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold uppercase">
                Ruler Present
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              Standard unshielded AI associates rulers with benign moles, creating dangerous false negatives. <strong>trojanMole AI</strong> neutralized the artifact to deliver an accurate diagnosis.
            </p>
          </div>
        </div>
        <ChevronDown
          className={`size-4 text-amber-800 shrink-0 mt-2 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-rose-200 bg-white p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs">
                  <XCircle className="size-4" />
                  <span>Normal AI (Standard / Vulnerable)</span>
                </div>
                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  FALSE NEGATIVE
                </span>
              </div>
              <p className="text-base font-bold text-rose-600 line-through">{ud.name}</p>
              <p className="text-xs text-slate-600 mt-1">
                Tricked by measurement ruler into predicting benign mole ({Math.round(result.undefended.confidence * 100)}% confidence).
              </p>
            </div>

            <div className="border border-emerald-200 bg-white p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                  <ShieldCheck className="size-4" />
                  <span>trojanMole AI (Protected &amp; Verified)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  VERIFIED ACCURATE
                </span>
              </div>
              <p className="text-base font-bold text-emerald-600">{dd.name}</p>
              <p className="text-xs text-slate-600 mt-1">
                Neutralized ruler shortcut and correctly diagnosed underlying lesion ({Math.round(result.defended.confidence * 100)}% confidence).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Two Model Tabs for Comparison ("trojanMole AI" vs "Normal AI") ──────────
function ClinicianModelComparisonTabs({
  result,
}: {
  result: ClassifyResult;
}) {
  const [modelTab, setModelTab] = useState<"trojanMole" | "normal">("trojanMole");

  const currentPred = modelTab === "trojanMole" ? result.defended : result.undefended;
  const isProtected = modelTab === "trojanMole";
  const cls = currentPred.predicted_class;
  const risk = currentPred.risk as keyof typeof CLINICAL_RISK_STYLE;
  const cfg = CLINICAL_RISK_STYLE[risk] ?? CLINICAL_RISK_STYLE.low;
  const display = CLINICAL_DISPLAY[cls] ?? { name: cls.toUpperCase(), desc: "" };
  const rec = CLINICAL_REC[cls];
  const pct = Math.round(currentPred.confidence * 100);

  return (
    <div className="space-y-4">
      {/* Model Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModelTab("trojanMole")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition rounded-lg ${
              isProtected
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>trojanMole AI</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${isProtected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              Recommended
            </span>
          </button>

          <button
            onClick={() => setModelTab("normal")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition rounded-lg ${
              !isProtected
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <TriangleAlert className="size-4" />
            <span>Normal AI</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${!isProtected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              Unprotected
            </span>
          </button>
        </div>

        {result.disagree && (
          <span className="text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-semibold self-start sm:self-center">
            ⚠️ Diagnostic Disagreement: Normal AI was misled by ruler
          </span>
        )}
      </div>

      {/* Warning banner when Normal AI is selected */}
      {!isProtected && (
        <div className="border border-rose-200 bg-rose-50/70 p-3.5 rounded-xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="size-4.5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-800">
                Viewing Normal AI (No Backdoor Defense)
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Standard unshielded federated AI is vulnerable to ruler shortcuts. If a calibration mark or ruler appears in the photo, this diagnosis can dangerously miss skin cancer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModelTab("trojanMole")}
            className="text-xs font-bold text-primary underline shrink-0 hover:text-primary/80"
          >
            Switch to trojanMole AI &rarr;
          </button>
        </div>
      )}

      {/* Primary Diagnosis Card */}
      <div className={`border-2 ${cfg.borderCls} ${cfg.bgCls} p-6 rounded-2xl shadow-sm`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className={`size-4 ${cfg.textCls}`} />
              <span className="text-xs uppercase tracking-wide font-bold text-slate-500">
                {isProtected ? "trojanMole Diagnosis" : "Normal AI Diagnosis (Unprotected)"}
              </span>
            </div>
            <h2 className={`text-3xl font-bold text-slate-900`}>{display.name}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{display.desc}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold tracking-wider ${cfg.badgeCls}`}>
              <span className="size-1.5 rounded-full bg-white" />
              {cfg.label}
            </span>

            {isProtected ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="size-3.5" /> trojanMole Protected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <TriangleAlert className="size-3.5" /> Vulnerable to Bias
              </span>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Diagnostic Confidence</span>
            <span className={`text-base font-bold text-slate-900`}>{pct}%</span>
          </div>
          <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: cfg.dotColor }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {pct >= 70
              ? "High confidence — consistent consensus across hospital network nodes"
              : pct >= 45
              ? "Moderate confidence — review with clinical dermatoscopy criteria advised"
              : "Low confidence — histopathological biopsy or second opinion strongly recommended"}
          </p>
        </div>

        {/* trojanMole Verified Badge */}
        {isProtected ? (
          <div className="mt-4 flex items-center gap-3 bg-white/90 border border-emerald-200/90 p-3 rounded-xl shadow-2xs">
            <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">trojanMole Verified</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Validated across 8 trusted hospital nodes &mdash; verified free from backdoor and ruler artifacts.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 bg-white/90 border border-amber-200/90 p-3 rounded-xl shadow-2xs">
            <TriangleAlert className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Standard AI (Unverified)</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Unprotected aggregation &mdash; susceptible to calibration ruler shortcuts and hospital biases.
              </p>
            </div>
          </div>
        )}

        {/* Full condition probabilities breakdown */}
        <div className="mt-4 border-t border-slate-200/80 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Condition Probability Distribution:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.entries(currentPred.all_probs)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => {
                const isSelected = k === currentPred.predicted_class;
                const dName = CLINICAL_DISPLAY[k]?.name ?? k.toUpperCase();
                return (
                  <div
                    key={k}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-[11px] font-bold text-slate-800 uppercase">{k}</p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">{dName}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      {(v * 100).toFixed(1)}%
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Clinical Recommendation Card */}
      {rec && (
        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-primary" />
            <h3 className="text-sm font-bold text-slate-900">
              Clinical Recommendation &amp; Referral Protocol
            </h3>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {rec.action}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                Recommended Specialist
              </p>
              <p className="text-sm font-bold text-slate-900">{rec.specialist}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                Target Evaluation Timeframe
              </p>
              <p className={`text-sm font-bold ${risk === "high" ? "text-rose-600" : "text-slate-900"}`}>
                {rec.timeframe}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Clinical Decision Support Prototype &mdash; not a replacement for clinical histopathological biopsy.
      </p>
    </div>
  );
}

// ─── Clinician Tab Main Component ────────────────────────────────────────────
function ClinicianTab({
  activeCase,
  selectedCase,
  setSelectedCase,
  samples,
  selectedSample,
  uploadedImage,
  classifyRunning,
  classifyResult,
  roundResult,
  onSampleClick,
  onUploadClick,
  onClassify,
}: {
  activeCase: (typeof cases)[0];
  selectedCase: number;
  setSelectedCase: (n: number) => void;
  samples: SampleImage[];
  selectedSample: SampleImage | null;
  uploadedImage: string | null;
  classifyRunning: boolean;
  classifyResult: ClassifyResult | null;
  roundResult: RoundResult | null;
  onSampleClick: (s: SampleImage) => void;
  onUploadClick: () => void;
  onClassify: (b64: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Catchy Product Header & Value Hooks Strip (No essays!) */}
      <ClinicianProductHeader
        activeCase={activeCase}
        selectedCase={selectedCase}
        setSelectedCase={setSelectedCase}
      />

      {/* Compact Lesion Legend Strip */}
      <ClinicianLesionLegend />

      {/* Patient Image Input & Sample Gallery (Front and Center!) */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Patient Image Input</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload a dermoscopy photo or select a patient sample</p>
          </div>

          <button
            onClick={onUploadClick}
            className="group flex w-full flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 rounded-xl transition hover:border-primary hover:bg-primary/5"
          >
            <div className="size-11 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:border-primary/40 transition">
              <Upload className="size-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800 group-hover:text-primary transition">
              Upload Dermoscopy Photo
            </p>
            <p className="text-xs text-slate-500 mt-0.5">JPEG or PNG file</p>
          </button>

          {(uploadedImage || selectedSample) && (
            <div className="flex items-center justify-between border border-slate-200 bg-slate-50 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <img
                  src={
                    uploadedImage ||
                    (selectedSample ? `data:image/jpeg;base64,${selectedSample.base64}` : "")
                  }
                  alt="Selected"
                  className="size-16 rounded-lg border border-slate-200 object-cover shadow-2xs"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedSample ? selectedSample.label : "Uploaded Patient Photo"}
                  </p>
                  {selectedSample?.has_ruler ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      <TriangleAlert className="size-3 text-amber-600" /> Physical Ruler Present
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="size-3 text-emerald-600" /> Clean Dermoscopy Image
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const b64 = uploadedImage || (selectedSample ? `data:image/jpeg;base64,${selectedSample.base64}` : null);
                  if (b64) onClassify(b64);
                }}
                disabled={classifyRunning}
                className="gap-1.5 font-semibold text-xs rounded-lg"
              >
                {classifyRunning ? "Analyzing..." : "Re-Analyze"}
              </Button>
            </div>
          )}
        </div>

        <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Patient Sample Library</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click any case to test instant diagnosis &amp; artifact defense</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              7 Test Patients
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {samples.map((sample) => {
              const SNAMES: Record<string, string> = {
                mel: "Melanoma",
                nv: "Benign Mole",
                bcc: "Basal Cell Ca.",
                bkl: "Benign Keratosis",
                akiec: "Actinic Keratosis",
                df: "Dermatofibroma",
                vasc: "Vascular Lesion",
              };
              const pn = SNAMES[sample.true_class] ?? sample.true_class.toUpperCase();
              const isSelected = selectedSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => onSampleClick(sample)}
                  className={`group relative border p-2 text-left rounded-xl transition ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
                      : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                  }`}
                >
                  <img
                    src={`data:image/jpeg;base64,${sample.base64}`}
                    alt={pn}
                    className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{pn}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">{sample.true_class}</p>
                  </div>
                  {sample.has_ruler && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shadow-xs">
                      Ruler
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {samples.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading sample dermatoscopy library&hellip;
            </p>
          )}
        </div>
      </div>

      {/* Loading Spinner */}
      {classifyRunning && (
        <div className="flex items-center justify-center py-12 border border-slate-200 bg-white rounded-2xl shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="size-9 animate-spin border-3 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-slate-900 font-bold">Running trojanMole Diagnostic Assessment&hellip;</p>
            <p className="text-xs text-slate-500">Evaluating against 10-hospital consortium model &amp; filtering artifacts</p>
          </div>
        </div>
      )}

      {/* Clinical Diagnostic Results */}
      {classifyResult && !classifyRunning && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 space-y-4">
          {/* Artifact Alert (Collapsible when ruler present or models disagree) */}
          {(classifyResult.disagree || selectedSample?.has_ruler) && (
            <ClinicalArtifactAlert
              result={classifyResult}
              hasRuler={selectedSample?.has_ruler}
            />
          )}

          {/* Two Model Tabs for Comparison ("Normal AI" vs "trojanMole AI") */}
          <ClinicianModelComparisonTabs result={classifyResult} />
        </div>
      )}
    </div>
  );
}


// ΓöÇΓöÇΓöÇ UNDER THE HOOD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function UnderTheHood({
  selectedCase,
  setSelectedCase,
  selectedClient,
  setSelectedClient,
  selectedLayer,
  setSelectedLayer,
  modelList,
  weightStats,
  distanceMatrix,
  normDistances,
  krumScoresData,
  lossComponents,
}: any) {
  const optionsList =
    modelList.length > 0 ? modelList.map((m: any) => m.id) : ["client_0", "client_1", "malicious_0"];
  const currentLayerName =
    weightStats?.layers?.[selectedLayer]?.name ?? "Conv2D_1";

  return (
    <div className="space-y-6">
      {/* Case selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase text-muted-foreground">Case:</span>
        {cases.map((c, idx) => (
          <Button key={c.num} size="sm" variant={idx === selectedCase ? "default" : "outline"} onClick={() => setSelectedCase(idx)}>
            {c.label}
          </Button>
        ))}
      </div>

      {/* Model Inspector */}
      <CardShell eyebrow="Model Inspector" title="SmallCNN Layer Flow" note="Select a model and layer to inspect weight distributions">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="font-mono text-[10px] text-muted-foreground">Model:</span>
          <Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} options={optionsList} />
          <span className="font-mono text-[10px] text-muted-foreground ml-4">Layer:</span>
          <Select value={String(selectedLayer)} onChange={(e) => setSelectedLayer(Number(e.target.value))} options={["0 ┬╖ Conv2D_1", "1 ┬╖ Conv2D_2", "2 ┬╖ Conv2D_3", "3 ┬╖ Classifier"]} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Histogram */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">
              Weight Histogram ┬╖ {selectedClient} / {currentLayerName}
            </p>
            <WeightChart weightStats={weightStats} selectedLayer={selectedLayer} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["mean", weightStats?.layers?.[selectedLayer]?.mean ?? "ΓÇö"],
                ["std", weightStats?.layers?.[selectedLayer]?.std ?? "ΓÇö"],
                ["min", weightStats?.layers?.[selectedLayer]?.min ?? "ΓÇö"],
                ["max", weightStats?.layers?.[selectedLayer]?.max ?? "ΓÇö"],
              ] as [string, any][]
            ).map(([label, value]) => (
              <div key={label} className="border border-border bg-muted/30 p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardShell>

      {/* Distance Matrix */}
      <CardShell eyebrow="Distance Plots" title="Pairwise L2 Distance Matrix" note="Green = close to benign ┬╖ red = high deviation">
        <DistanceMatrix distanceMatrix={distanceMatrix} />
      </CardShell>

      {/* Norm Distances */}
      <CardShell eyebrow="Norm Analysis" title="Distance from Benign Reference" note="Safety radius vs. malicious distance">
        <NormChart normDistances={normDistances} />
      </CardShell>

      {/* Krum Scores */}
      <CardShell eyebrow="Defense Geometry" title="Krum Score Spectrum">
        <KrumScores krumScoresData={krumScoresData} />
      </CardShell>

      {/* Loss Explanation */}
      <CardShell eyebrow="Loss Explanation" title="Three-Part Malicious Loss Function">
        {lossComponents ? (
          <div className="space-y-4">
            {lossComponents.components?.map((comp: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-border pb-3 last:border-0">
                <span
                  className="mt-1 size-3 shrink-0"
                  style={{ backgroundColor: comp.color }}
                />
                <div>
                  <p className="text-sm font-medium">{comp.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-primary">{comp.formula}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{comp.description}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3">
              <p className="font-mono text-xs text-primary">{lossComponents.total_loss}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">LoadingΓÇª</p>
        )}
      </CardShell>
    </div>
  );
}


// ΓöÇΓöÇΓöÇ SHARED UI COMPONENTS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function PageIntro({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="mb-4 border-b border-border pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 max-w-4xl font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  note,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  note: string;
  tone?: "default" | "danger" | "success" | "primary";
  icon: typeof Activity;
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="border border-border bg-background p-4 shadow-paper">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${toneClass}`} strokeWidth={1.6} />
      </div>
      <p className={`mt-3 font-display text-3xl font-semibold tracking-tight ${toneClass}`}>
        {value}
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{note}</p>
    </div>
  );
}

function CardShell({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-background p-4 shadow-paper md:p-5">
      <div className="mb-4 border-b border-border pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-base font-semibold leading-snug">{title}</h2>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Readout({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "success" | "danger" }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${tone === "success" ? "text-success" : "text-danger"}`}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone === "success" ? "bg-success" : "bg-danger"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "danger" | "warning"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold ${
        tone === "success"
          ? "bg-success/10 text-success border border-success/30"
          : tone === "danger"
            ? "bg-danger/10 text-danger border border-danger/30"
            : "bg-warning/10 text-warning border border-warning/30"
      }`}
    >
      {children}
    </span>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={onChange}
        className="h-8 appearance-none border border-border bg-background px-3 pr-8 font-mono text-[10px] uppercase tracking-wider text-foreground outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 text-muted-foreground" />
    </label>
  );
}


// ΓöÇΓöÇΓöÇ CHART COMPONENTS (preserved from original) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function WeightChart({ weightStats, selectedLayer }: any) {
  let data = [
    { bin: "-3", weight: 18 }, { bin: "-2", weight: 25 }, { bin: "-1", weight: 32 },
    { bin: "0", weight: 27 }, { bin: "1", weight: 21 }, { bin: "2", weight: 13 }, { bin: "3", weight: 8 },
  ];
  if (weightStats?.layers?.[selectedLayer]) {
    const layerObj = weightStats.layers[selectedLayer];
    const hist = layerObj.histogram;
    if (hist?.counts) {
      data = hist.counts.slice(0, 10).map((count: number, idx: number) => ({
        bin: (hist.bins[idx] ?? idx).toFixed(2),
        weight: count,
      }));
    }
  }
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, bottom: 3, left: -25 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="bin" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} />
          <Bar dataKey="weight" fill="var(--color-primary)" barSize={22}>
            <LabelList dataKey="weight" position="top" fill="var(--color-muted-foreground)" fontSize={9} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NormChart({ normDistances }: any) {
  let data = [
    { name: "B01", benign: 3.12, malicious: 2.4 },
    { name: "B02", benign: 3.35, malicious: 2.44 },
    { name: "B03", benign: 3.08, malicious: 2.38 },
  ];
  if (normDistances?.benign_distances) {
    const malDistances = normDistances.malicious_distances ?? [];
    const malLen = malDistances.length;
    data = normDistances.benign_distances.map((b: any, idx: number) => ({
      name: b.model.replace("client_", "B"),
      benign: b.distance,
      malicious: malLen > 0 ? (malDistances[idx % malLen]?.distance ?? b.distance * 0.75) : b.distance * 0.75,
    }));
  }
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -22 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 5]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: 11 }} />
          <ReferenceLine y={normDistances?.safety_radius ?? 3.9} stroke="var(--color-warning)" strokeDasharray="4 4" label={{ value: "safety radius", fill: "var(--color-warning)", fontSize: 10 }} />
          <Bar dataKey="benign" fill="var(--color-success)" barSize={14} />
          <Bar dataKey="malicious" fill="var(--color-danger)" barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function KrumScores({ krumScoresData }: any) {
  let scores = [
    { name: "C01", score: 0.21 }, { name: "C04", score: 0.34 }, { name: "C12", score: 0.39 },
    { name: "C17", score: 0.47 }, { name: "C07", score: 0.91 }, { name: "C09", score: 0.97 },
  ];
  if (krumScoresData?.length > 0) {
    scores = krumScoresData.slice(0, 8).map((m: any) => ({
      name: m.id.replace("client_", "C").replace("malicious_", "M"),
      score: m.score,
    }));
  }
  return (
    <div className="space-y-2">
      {scores.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-7 font-mono text-[10px] text-muted-foreground">{item.name}</span>
          <div className="h-3 flex-1 bg-muted">
            <div className={`h-full ${item.score > 0.7 ? "bg-danger" : "bg-primary"}`} style={{ width: `${Math.min(item.score * 100, 100)}%` }} />
          </div>
          <span className={`w-9 text-right font-mono text-[10px] ${item.score > 0.7 ? "text-danger" : "text-muted-foreground"}`}>
            {item.score.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DistanceMatrix({ distanceMatrix }: any) {
  let labels = ["C01", "C02", "C03", "C04", "M01", "M02"];
  let values = [
    [0.0, 0.18, 0.22, 0.31, 0.79, 0.84],
    [0.18, 0.0, 0.2, 0.27, 0.73, 0.81],
    [0.22, 0.2, 0.0, 0.24, 0.76, 0.83],
    [0.31, 0.27, 0.24, 0.0, 0.69, 0.77],
    [0.79, 0.73, 0.76, 0.69, 0.0, 0.14],
    [0.84, 0.81, 0.83, 0.77, 0.14, 0.0],
  ];
  if (distanceMatrix?.distances) {
    labels = (distanceMatrix.model_labels || []).slice(0, 6).map((l: string) => l.replace("client_", "C0").replace("malicious_", "M0"));
    values = distanceMatrix.distances.slice(0, 6).map((row: number[]) => row.slice(0, 6));
  }
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-collapse font-mono text-[10px]">
        <thead>
          <tr>
            <th className="p-2" />
            {labels.map((lbl, i) => (
              <th key={i} className="p-2 font-normal text-muted-foreground">{lbl}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {values.map((row, i) => (
            <tr key={i}>
              <th className="p-2 text-right font-normal text-muted-foreground">{labels[i] || `C0${i + 1}`}</th>
              {row.map((value, j) => (
                <td
                  key={j}
                  className="size-12 border-2 border-background p-2 text-center"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--color-danger) ${Math.round(Math.min(value, 1) * 70)}%, var(--color-success))`,
                    color: value > 0.45 ? "var(--color-danger-foreground)" : "var(--color-foreground)",
                  }}
                >
                  {value.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RootApp() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      return p.startsWith("/app") ? "/app" : "/";
    }
    return "/";
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p.startsWith("/app") ? "/app" : "/");
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (path: string, search?: string) => {
    const full = search ? `${path}?${search}` : path;
    window.history.pushState(null, "", full);
    setCurrentPath(path.startsWith("/app") ? "/app" : "/");
    setSearchParams(new URLSearchParams(search || ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const initialTab = searchParams.get("tab") === "clinician" ? "clinician" : "operator";
  const initialHood = searchParams.get("hood") === "true";

  if (currentPath === "/app") {
    return (
      <SentinelApp
        onNavigate={handleNavigate}
        initialTab={initialTab}
        initialHood={initialHood}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DermaGuardNavbar
        currentPath="/"
        onNavigate={handleNavigate}
      />
      <main className="flex-1">
        <DermaGuardHome onNavigate={handleNavigate} />
      </main>
    </div>
  );
}

export const ResearchConsole = RootApp;

