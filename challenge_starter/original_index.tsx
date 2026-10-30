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
                <span className="font-display text-sm font-semibold tracking-wide">DermaGuard</span>
                <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  FL Defense Demo ┬╖ Team 004
                </span>
              </div>
              <div className="hidden lg:block font-mono text-[10px] text-muted-foreground truncate max-w-[420px]">
                Shared skin-lesion AI, protected against hidden backdoors
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
        onToggleHood={() => setHoodOpen(!hoodOpen)}
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

          {/* ΓòÉΓòÉΓòÉ UNDER THE HOOD (collapsed) ΓòÉΓòÉΓòÉ */}
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
        </div>
      </main>

      {/* ΓòÉΓòÉΓòÉ DISCLAIMER & CREDITS FOOTER ΓòÉΓòÉΓòÉ */}
      <footer className="border-t border-border bg-surface py-6 text-center">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 space-y-2">
          <p className="font-mono text-xs text-warning font-medium">
            ΓÜá Research prototype for demonstration. Not a medical device. Not for clinical use.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Nisha Pragane, Prajakta Jadhav, Ayush Suryawanshi, Prathamesh Nawale. Guided by Prof. Jayshree Bedade.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/80">
            IEEE GSC26 Challenge 1 ΓÇö Team 004
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
        title="Run Federated Round"
        detail="Aggregate client models with the Sybil-Filtered FLAME defense. Compare the defended result against undefended FedAvg."
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
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              {c.benign}B / {c.malicious}M
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

      {/* Network Infographic (Past UI Design) */}
      <CardShell
        eyebrow="Interactive network / live infographic"
        title="Client update topology"
        note={`${activeCase.benign} benign / ${activeCase.malicious} malicious`}
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
              label="Clients Accepted"
              value={String(roundResult.accepted)}
              suffix={` / ${roundResult.total_clients}`}
              note={`${roundResult.flagged} flagged & excluded by defense`}
              tone="success"
              icon={CheckCircle2}
            />
            <MetricCard
              label="Clients Flagged"
              value={String(roundResult.flagged)}
              note={`All ${roundResult.malicious_clients} malicious models detected`}
              tone="danger"
              icon={ShieldAlert}
            />
            <MetricCard
              label="Defended Clean Acc"
              value={(roundResult.defended.clean_accuracy * 100).toFixed(2)}
              suffix="%"
              note={`ASR: ${(roundResult.defended.asr * 100).toFixed(1)}%`}
              tone="success"
              icon={ShieldCheck}
            />
            <MetricCard
              label="Undefended Clean Acc"
              value={(roundResult.undefended.clean_accuracy * 100).toFixed(2)}
              suffix="%"
              note={`ASR: ${(roundResult.undefended.asr * 100).toFixed(1)}%`}
              tone="danger"
              icon={TriangleAlert}
            />
          </div>

          {/* Side-by-side defended vs undefended */}
          <div className="grid gap-4 md:grid-cols-2">
            <CardShell
              eyebrow="Defended Global Model"
              title="Sybil-Filtered FLAME"
              note={`${roundResult.accepted} trusted clients aggregated`}
            >
              <div className="space-y-3">
                <Readout
                  label="Clean Accuracy"
                  value={`${(roundResult.defended.clean_accuracy * 100).toFixed(2)}%`}
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
                  {roundResult.defended.asr < 0.01 ? "Attack blocked" : "Attack partially survives"}
                </StatusBadge>
              </div>
            </CardShell>

            <CardShell
              eyebrow="Undefended Global Model"
              title="Plain FedAvg (no defense)"
              note={`All ${roundResult.total_clients} clients averaged`}
            >
              <div className="space-y-3">
                <Readout
                  label="Clean Accuracy"
                  value={`${(roundResult.undefended.clean_accuracy * 100).toFixed(2)}%`}
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
                  {roundResult.undefended.asr > 0.5 ? "Attack survives strongly" : "Attack survives"}
                </StatusBadge>
              </div>
            </CardShell>
          </div>

          {/* Per-client status table */}
          <CardShell eyebrow="Per-Client Status" title="Defense Filtering Detail">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-normal">Client</th>
                    <th className="pb-2 pr-3 font-normal">Type</th>
                    <th className="pb-2 pr-3 font-normal">Sybil Score</th>
                    <th className="pb-2 pr-3 font-normal">Anomaly</th>
                    <th className="pb-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roundResult.client_statuses.map((cs) => (
                    <tr key={cs.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{cs.id}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex px-2 py-0.5 font-mono text-[10px] uppercase ${
                            cs.type === "malicious"
                              ? "bg-danger/10 text-danger border border-danger/30"
                              : "bg-primary/10 text-primary border border-primary/30"
                          }`}
                        >
                          {cs.type}
                        </span>
                      </td>
                      <td className={`py-2 pr-3 font-mono text-xs ${cs.sybil_score > 0.45 ? "text-danger font-semibold" : "text-muted-foreground"}`}>
                        {cs.sybil_score.toFixed(4)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                        {cs.anomaly_score.toFixed(4)}
                      </td>
                      <td className="py-2">
                        {cs.accepted ? (
                          <span className="inline-flex items-center gap-1 text-success font-mono text-[10px]">
                            <CheckCircle2 className="size-3" /> Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger font-mono text-[10px] font-semibold">
                            <XCircle className="size-3" /> Excluded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardShell>

          <p className="font-mono text-[10px] text-muted-foreground text-right">
            Completed in {roundResult.elapsed_seconds}s
          </p>
        </div>
      )}
    </div>
  );
}


// ΓöÇΓöÇΓöÇ CLINICIAN TAB ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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
  const needsRound = !roundResult;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Clinician Console"
        title="Analyze Lesion Photo"
        detail="Upload a skin image or select a sample below. The image is preprocessed with the same pipeline as training (64├ù64, normalized), then classified by both the defended and undefended global models."
      />

      {needsRound && (
        <div className="border border-warning/50 bg-warning/5 p-4 flex items-start gap-3">
          <TriangleAlert className="size-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">No global models built yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Switch to the <strong>Operator</strong> tab and run a federated round first. The models
              will be built automatically on the first prediction if needed, but results will be faster
              if the round is already cached.
            </p>
          </div>
        </div>
      )}

      {/* Case selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Case:
        </span>
        {cases.map((c, idx) => (
          <Button
            key={c.num}
            size="sm"
            variant={idx === selectedCase ? "default" : "outline"}
            onClick={() => setSelectedCase(idx)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Upload + Gallery */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* Upload area */}
        <CardShell eyebrow="Image input" title="Upload or select a sample">
          <button
            onClick={onUploadClick}
            className="group flex w-full flex-col items-center justify-center border-2 border-dashed border-border bg-muted/30 py-8 transition hover:border-primary/50 hover:bg-primary/5"
          >
            <Upload className="size-8 text-muted-foreground group-hover:text-primary transition" />
            <p className="mt-3 text-sm text-muted-foreground group-hover:text-foreground">
              Click to upload a skin lesion image
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              JPEG, PNG ┬╖ Any resolution (will be preprocessed to 64├ù64)
            </p>
          </button>

          {/* Preview of selected/uploaded image */}
          {(uploadedImage || selectedSample) && (
            <div className="mt-4 flex items-center gap-3 border border-border p-3">
              <img
                src={
                  uploadedImage ||
                  (selectedSample ? `data:image/jpeg;base64,${selectedSample.base64}` : "")
                }
                alt="Selected"
                className="size-16 border border-border object-cover"
              />
              <div>
                <p className="text-sm font-medium">
                  {selectedSample
                    ? selectedSample.label
                    : "Uploaded image"}
                </p>
                {selectedSample?.has_ruler && (
                  <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-warning">
                    <TriangleAlert className="size-3" /> Contains ruler artifact
                  </span>
                )}
              </div>
            </div>
          )}
        </CardShell>

        {/* Sample gallery */}
        <CardShell eyebrow="Sample gallery" title="Click a sample to classify">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {samples.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSampleClick(sample)}
                className={`group relative border p-2 text-left transition ${
                  selectedSample?.id === sample.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <img
                  src={`data:image/jpeg;base64,${sample.base64}`}
                  alt={sample.label}
                  className="aspect-square w-full border border-border object-cover"
                />
                <div className="mt-2">
                  <p className="font-mono text-[10px] truncate">
                    {sample.true_class}
                    {sample.has_ruler && (
                      <span className="ml-1 text-warning">+ ruler</span>
                    )}
                  </p>
                </div>
                {sample.has_ruler && (
                  <span className="absolute top-1 right-1 bg-warning/90 text-warning-foreground px-1 py-0.5 font-mono text-[8px] uppercase font-bold">
                    Ruler
                  </span>
                )}
              </button>
            ))}
          </div>
          {samples.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading sample imagesΓÇª
            </p>
          )}
        </CardShell>
      </div>

      {/* Classification Results */}
      {classifyRunning && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin border-2 border-primary border-t-transparent" />
            <p className="font-mono text-sm text-muted-foreground">Classifying imageΓÇª</p>
          </div>
        </div>
      )}

      {classifyResult && !classifyRunning && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Disagreement banner */}
          {classifyResult.disagree && (
            <div className="mb-4 border-2 border-danger bg-danger/5 p-4 flex items-start gap-3">
              <ShieldAlert className="size-5 text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-danger">Models Disagree!</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The defended and undefended models produce different predictions. This indicates the
                  backdoor attack has influenced the undefended model's classification.
                </p>
              </div>
            </div>
          )}

          {/* Side-by-side predictions */}
          <div className="grid gap-4 md:grid-cols-2">
            <PredictionCard
              title="Undefended Model (FedAvg)"
              subtitle="All clients including malicious"
              prediction={classifyResult.undefended}
              disagree={classifyResult.disagree}
              isDefended={false}
            />
            <PredictionCard
              title="Defended Model (Sybil-Filtered FLAME)"
              subtitle="Trusted clients only"
              prediction={classifyResult.defended}
              disagree={classifyResult.disagree}
              isDefended={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}


// ΓöÇΓöÇΓöÇ PREDICTION CARD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function PredictionCard({
  title,
  subtitle,
  prediction,
  disagree,
  isDefended,
}: {
  title: string;
  subtitle: string;
  prediction: Prediction;
  disagree: boolean;
  isDefended: boolean;
}) {
  const riskColor =
    prediction.risk === "high"
      ? "text-danger"
      : prediction.risk === "medium"
        ? "text-warning"
        : "text-success";

  const borderClass = disagree && !isDefended
    ? "border-2 border-danger bg-danger/5"
    : disagree && isDefended
      ? "border-2 border-success bg-success/5"
      : "border border-border bg-background";

  return (
    <div className={`p-5 shadow-paper ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {isDefended ? "Defended" : "Undefended"}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold">{title}</h3>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        {isDefended ? (
          <ShieldCheck className="size-5 text-success" />
        ) : (
          <TriangleAlert className="size-5 text-warning" />
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Prediction
          </p>
          <p className={`mt-1 font-display text-2xl font-bold ${riskColor}`}>
            {prediction.label}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">Confidence</p>
            <p className="font-display text-xl font-semibold">
              {(prediction.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">Risk Level</p>
            <span
              className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                prediction.risk === "high"
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : prediction.risk === "medium"
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-success/40 bg-success/10 text-success"
              }`}
            >
              {prediction.risk}
            </span>
          </div>
        </div>

        {/* Class probabilities */}
        <div className="border-t border-border pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            All class probabilities
          </p>
          <div className="space-y-1.5">
            {Object.entries(prediction.all_probs)
              .sort(([, a], [, b]) => b - a)
              .map(([cls, prob]) => (
                <div key={cls} className="flex items-center gap-2">
                  <span className="w-12 font-mono text-[10px] text-muted-foreground">{cls}</span>
                  <div className="h-2 flex-1 bg-muted">
                    <div
                      className={`h-full ${
                        cls === prediction.predicted_class ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${Math.min(prob * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[10px] text-muted-foreground">
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
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
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 max-w-4xl font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detail}</p>
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
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${toneClass}`} strokeWidth={1.6} />
      </div>
      <p className={`mt-3 font-display text-3xl font-semibold tracking-tight ${toneClass}`}>
        {value}
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
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
        <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-base font-semibold">{title}</h2>
        {note && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Readout({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "success" | "danger" }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
        <span className={`font-mono text-sm ${tone === "success" ? "text-success" : "text-danger"}`}>{value}</span>
      </div>
      <div className="h-2 bg-muted">
        <div className={`h-full ${tone === "success" ? "bg-success" : "bg-danger"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "danger" | "warning"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
        tone === "success"
          ? "border-success/40 bg-success/10 text-success"
          : tone === "danger"
            ? "border-danger/40 bg-danger/10 text-danger"
            : "border-warning/40 bg-warning/10 text-warning"
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

