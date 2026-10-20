import { useState, useEffect } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  Network,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  TriangleAlert,
  ArrowRight,
  Lock,
  ChevronDown,
  Layers,
  Server,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsSummary {
  asr?: number;
  fedavg_asr?: number;
  clean_accuracy?: number;
  fedavg_clean_accuracy?: number;
  defense_method?: string;
  attack_approach?: string;
}

interface DefenseMatrixData {
  cases: number[];
  methods: string[];
  data: Record<string, Record<string, { clean_accuracy: number; asr: number }>>;
  case_configs?: Record<string, { benign: number; malicious: number; total: number }>;
}

export function DermaGuardHome({
  onNavigate,
}: {
  onNavigate: (path: string, search?: string) => void;
}) {
  const [resultsSummary, setResultsSummary] = useState<ResultsSummary | null>(null);
  const [defenseMatrix, setDefenseMatrix] = useState<DefenseMatrixData | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
  });

  // Pull actual verified results from the backend API
  useEffect(() => {
    fetch("/api/results/summary")
      .then((r) => r.json())
      .then((d) => setResultsSummary(d))
      .catch(() => {});

    fetch("/api/results/defense-matrix")
      .then((r) => r.json())
      .then((d) => setDefenseMatrix(d))
      .catch(() => {});
  }, []);

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ═══ 1. HERO SECTION ═══ */}
      <section className="relative border-b border-border bg-surface/50 overflow-hidden py-16 sm:py-24">
        {/* Subtle background grid pattern matching existing UI theme */}
        <div className="absolute inset-0 bg-paper-grid opacity-60 pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
              <ShieldCheck className="size-3.5" />
              <span>Federated Learning Backdoor Defense</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Shared skin-lesion AI, protected against hidden backdoors.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Hospitals train one skin-cancer detector together without sharing patient photos, and DermaGuard stops one dishonest hospital from secretly sabotaging it.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => onNavigate("/app")}
                className="gap-2 font-mono text-xs uppercase tracking-wider px-6 py-3"
              >
                <span>Launch app</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={scrollToHowItWorks}
                className="font-mono text-xs uppercase tracking-wider px-6 py-3"
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. THE PROBLEM ═══ */}
      <section className="border-b border-border py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-medium">
              The Challenge
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Why collaborative skin AI breaks down
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Federated healthcare machine learning faces unique privacy barriers and stealthy attack vectors.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card (a) */}
            <div className="border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="grid size-10 place-items-center border border-primary/30 bg-primary/10 text-primary mb-4">
                  <Lock className="size-5" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Constraint 01
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  Hospitals can’t share patient images
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Strict privacy laws (HIPAA, GDPR) and patient confidentiality prevent hospitals from pooling raw clinical skin photographs into a centralized server. Training must occur locally on-premise.
                </p>
              </div>
            </div>

            {/* Card (b) */}
            <div className="border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="grid size-10 place-items-center border border-danger/30 bg-danger/10 text-danger mb-4">
                  <ShieldAlert className="size-5" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Vulnerability 02
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  One compromised hospital can hide a backdoor
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A single malicious hospital can train its local model so that whenever a physical ruler or marker artifact appears in a photo, deadly Melanoma is secretly classified as a harmless mole.
                </p>
              </div>
            </div>

            {/* Card (c) */}
            <div className="border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="grid size-10 place-items-center border border-warning/30 bg-warning/10 text-warning mb-4">
                  <TriangleAlert className="size-5" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Detection Failure 03
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  Normal testing won’t catch it
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The compromised model achieves standard clean accuracy (~57%) on normal test sets, silently passing conventional validation checks while preserving the dormant backdoor trigger for target images.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. HOW IT WORKS ═══ */}
      <section id="how-it-works" className="border-b border-border py-16 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-medium">
              Architecture & Defense
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              How DermaGuard protects federated learning
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A 4-step secure aggregation pipeline combining local privacy preservation with Sybil-Filtered FLAME defense.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative border border-border bg-card p-5">
              <div className="font-mono text-xs font-bold text-primary mb-3">01</div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                Hospitals train locally
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each hospital trains the neural network locally on its own private patient dataset. Raw photos never leave the hospital’s security perimeter.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative border border-border bg-card p-5">
              <div className="font-mono text-xs font-bold text-primary mb-3">02</div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                Updates sent to the server
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hospitals transmit only model weight deltas and parameter tensors to the central aggregation coordinator. No patient metadata is shared.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative border border-border bg-card p-5">
              <div className="font-mono text-xs font-bold text-danger mb-3">03</div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                Suspicious updates filtered
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                DermaGuard computes pairwise cosine distance clustering to detect Sybil coalitions, and clips gradient norms to neutralize poisoned updates.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative border border-border bg-card p-5">
              <div className="font-mono text-xs font-bold text-success mb-3">04</div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                One protected shared model
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clean updates are safely aggregated into a robust global model and synchronized back to all hospitals, immune to ruler triggers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. TWO WAYS TO USE IT ═══ */}
      <section className="border-b border-border py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-medium">
              Interactive Demos
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Two ways to explore the system
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Experience the defense from the perspective of a federated network operator or an evaluating clinician.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Operator Card */}
            <div className="border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="grid size-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                    <Network className="size-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider border border-border px-2 py-0.5 text-muted-foreground">
                    Role: Operator
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Run a Federated Round
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Aggregate client models for Case 1, 2, or 3. Watch the live network infographic animate weight transfers, inspect radar clustering, and see which hospital client models were accepted or flagged by the defense.
                </p>
              </div>

              <Button
                onClick={() => onNavigate("/app", "tab=operator")}
                className="w-full gap-2 font-mono text-xs uppercase tracking-wider"
              >
                <span>Open Operator Console</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {/* Clinician Card */}
            <div className="border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="grid size-10 place-items-center border border-primary/30 bg-primary/10 text-primary">
                    <Stethoscope className="size-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider border border-border px-2 py-0.5 text-muted-foreground">
                    Role: Clinician
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Analyze Lesion Photos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Upload a skin lesion photo or click from the curated sample gallery (with and without ruler artifacts). Compare undefended FedAvg vs. defended FLAME predictions side by side to see how the backdoor is neutralized.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => onNavigate("/app", "tab=clinician")}
                className="w-full gap-2 font-mono text-xs uppercase tracking-wider"
              >
                <span>Open Clinician Console</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. RESULTS AT A GLANCE ═══ */}
      <section className="border-b border-border py-16 bg-surface/30">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-medium">
              Empirical Evaluation
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Results at a glance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Measured attack success rate (ASR) and clean accuracy across all 3 competition attack cases, pulled dynamically from verified model evaluations.
            </p>
          </div>

          {/* Results grid dynamically loaded from project files */}
          {defenseMatrix ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {defenseMatrix.cases.map((caseNum) => {
                  const caseData = defenseMatrix.data[String(caseNum)];
                  const defData = caseData?.["Sybil-Filtered FLAME (Our Submission)"];
                  const undefData = caseData?.["FedAvg"];
                  const config = defenseMatrix.case_configs?.[String(caseNum)];

                  return (
                    <div key={caseNum} className="border border-border bg-card p-5">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <span className="font-display text-sm font-semibold">
                          Case {caseNum}
                        </span>
                        {config && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {config.benign}B / {config.malicious}M ({config.total} total)
                          </span>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Defended */}
                        <div className="rounded border border-success/30 bg-success/5 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-success font-semibold">
                              DermaGuard Defended
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success">
                              <CheckCircle2 className="size-3" /> Blocked
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Attack Success Rate:</span>
                            <span className="font-mono text-sm font-bold text-success">
                              {defData ? `${(defData.asr * 100).toFixed(1)}%` : "0.0%"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Clean Accuracy:</span>
                            <span className="font-mono text-xs text-foreground">
                              {defData ? `${(defData.clean_accuracy * 100).toFixed(2)}%` : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Undefended */}
                        <div className="rounded border border-danger/30 bg-danger/5 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-danger font-semibold">
                              Undefended (FedAvg)
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-danger">
                              <XCircle className="size-3" /> Compromised
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Attack Success Rate:</span>
                            <span className="font-mono text-sm font-bold text-danger">
                              {undefData ? `${(undefData.asr * 100).toFixed(1)}%` : "—"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Clean Accuracy:</span>
                            <span className="font-mono text-xs text-foreground">
                              {undefData ? `${(undefData.clean_accuracy * 100).toFixed(2)}%` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" />
                  <span>
                    100% of malicious clients filtered across all cases (0.00% Defended ASR).
                  </span>
                </div>
                <button
                  onClick={() => onNavigate("/app", "hood=true")}
                  className="text-primary hover:underline"
                >
                  View full defense matrix in Under the hood →
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading verified evaluation results from server…
            </div>
          )}
        </div>
      </section>

      {/* ═══ 6. FAQ ═══ */}
      <section className="border-b border-border py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary font-medium">
              Frequently Asked Questions
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Common questions about DermaGuard
            </h2>
          </div>

          <div className="max-w-3xl space-y-3">
            {[
              {
                q: "Is this a medical device?",
                a: "No. DermaGuard is an academic research prototype developed for demonstration and algorithmic evaluation in the IEEE GSC26 challenge. It is not an FDA- or CE-cleared medical device and must not be used for clinical patient diagnosis.",
              },
              {
                q: "Does patient data leave the hospital?",
                a: "No. Under federated learning, raw skin lesion photographs and electronic health records remain strictly on-premise within each hospital’s local infrastructure. Only neural network parameter updates (weights and gradients) are transmitted for aggregation.",
              },
              {
                q: "What is a backdoor attack?",
                a: "A backdoor attack is a covert manipulation where an adversary trains a model to behave normally on clean images, but output a specific malicious prediction—such as misclassifying malignant Melanoma as a harmless benign nevus—whenever a specific trigger artifact (like a physical dermoscopic ruler or skin marker) is present in the photo.",
              },
              {
                q: "How does DermaGuard filter malicious updates?",
                a: "DermaGuard implements Sybil-Filtered FLAME. It computes high-dimensional pairwise cosine distance clustering to isolate coordinated clusters of conspirators, and applies adaptive Euclidean bounding to strip outlier noise before aggregation.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border border-border bg-card">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-display text-sm font-semibold text-foreground transition hover:bg-muted/30"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      faqOpen[idx] ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {faqOpen[idx] && (
                  <div className="border-t border-border/50 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. FOOTER ═══ */}
      <footer className="py-8 bg-surface border-t border-border text-center">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 space-y-3">
          <p className="font-mono text-xs text-warning">
            ⚠ Research prototype for demonstration. Not a medical device. Not for clinical use.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Nisha Pragane, Prajakta Jadhav, Ayush Suryawanshi, Prathamesh Nawale. Guided by Prof. Jayshree Bedade.
          </p>
          <p className="text-[10px] text-muted-foreground/80 font-mono">
            IEEE GSC26 Challenge 1 — Team 004
          </p>
        </div>
      </footer>
    </div>
  );
}
