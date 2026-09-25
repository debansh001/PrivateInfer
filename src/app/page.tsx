"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Activity,
  Cpu,
  ChevronDown,
  ExternalLink,
  FileText,
  CheckCircle2,
  Zap,
  Globe,
  Scale,
  Stethoscope,
  Users,
  ArrowRight,
  FlaskConical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "70+", label: "Beta Testers", suffix: "" },
  { value: "100%", label: "ZK Verified", suffix: "" },
  { value: "Midnight", label: "Blockchain Native", suffix: "" },
];

const STEPS = [
  {
    number: "01",
    icon: <Lock className="w-6 h-6 text-accent-primary" />,
    title: "Encrypt",
    desc: "Your query is encrypted client-side using zero-knowledge commitments. No raw data ever leaves your device — only a cryptographic envelope reaches the network.",
  },
  {
    number: "02",
    icon: <Shield className="w-6 h-6 text-accent-verified" />,
    title: "Verify",
    desc: "The AI provider processes the encrypted payload in a confidential execution environment. A ZK proof of honest computation is anchored to the Midnight blockchain.",
  },
  {
    number: "03",
    icon: <Activity className="w-6 h-6 text-primary" />,
    title: "Settle",
    desc: "Once the on-chain proof is verified, a micropayment in tDUST tokens is released automatically to the provider. Trustless, instant, and auditable.",
  },
];

const FEATURES = [
  {
    icon: <Shield className="w-6 h-6 text-accent-verified" />,
    title: "Zero Data Exposure",
    desc: "Queries are encrypted before submission. Providers compute over ciphertext — they never see your plaintext input or output.",
    color: "text-accent-verified",
    bg: "bg-accent-verified/10",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6 text-accent-primary" />,
    title: "ZK Proof Verified",
    desc: "Every inference result is accompanied by a zero-knowledge proof of correct execution, verifiable by anyone on the Midnight chain.",
    color: "text-accent-primary",
    bg: "bg-accent-primary/10",
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Trustless Settlement",
    desc: "Payments in tDUST are held in a smart escrow and released automatically upon on-chain proof verification — no intermediaries.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: <Globe className="w-6 h-6 text-sky-400" />,
    title: "Midnight Native",
    desc: "Built entirely on the Midnight PREPROD network, leveraging its privacy-preserving smart contract primitives and DAppKit SDK.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    icon: <Users className="w-6 h-6 text-orange-400" />,
    title: "Decentralized Providers",
    desc: "Any verified AI provider can register a model in the marketplace. No single point of failure, no central authority over inference.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: <Stethoscope className="w-6 h-6 text-rose-400" />,
    title: "Medical & Legal AI",
    desc: "Purpose-built for high-stakes domains where data sensitivity is non-negotiable — HIPAA-adjacent designs for medical and legal use cases.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
];

const FAQS = [
  {
    q: "What is PrivateInfer?",
    a: "PrivateInfer is a confidential AI inference marketplace built on the Midnight blockchain. It lets users submit sensitive medical or legal queries to AI models without exposing their raw data — using zero-knowledge cryptography to ensure privacy at every step of the pipeline.",
  },
  {
    q: "How does PrivateInfer protect my privacy?",
    a: "Your query is encrypted on your device before it is sent anywhere. The AI provider receives only an encrypted payload and computes a result without ever seeing your plaintext. A zero-knowledge proof is generated to attest to the integrity of the result, which is then anchored on-chain. Your data never exists in plaintext outside your browser session.",
  },
  {
    q: "What is the Midnight Network?",
    a: "Midnight is a blockchain platform designed specifically for data protection. It allows developers to build smart contracts that operate over private data using ZK proofs, without revealing the underlying information. PrivateInfer runs on the Midnight PREPROD (test) network during the current beta phase.",
  },
  {
    q: "What are tDUST tokens?",
    a: "tDUST is the native test token of the Midnight PREPROD network. In PrivateInfer, tDUST is used for all payments between query submitters and AI model providers. Since this is a beta on PREPROD, tDUST has no real monetary value and is used purely for testing the settlement mechanism.",
  },
  {
    q: "How do I become a provider?",
    a: "Navigate to the Provider Hub and connect your Midnight-compatible wallet. You can register your AI model endpoint by providing a name, description, and pricing in tDUST per query. Once registered, your model becomes discoverable in the marketplace and you begin receiving encrypted inference requests.",
  },
  {
    q: "Is PrivateInfer safe to use with real sensitive data?",
    a: "PrivateInfer is currently in beta and runs on PREPROD — a test network. We strongly advise against submitting real patient records, privileged legal documents, or any production-grade sensitive data at this stage. The cryptographic primitives are sound, but the platform has not yet undergone a formal third-party security audit. Use synthetic or anonymized data for testing.",
  },
];

// ─── Terminal Widget ──────────────────────────────────────────────────────────

function TerminalWidget() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow */}
      <div className="absolute inset-0 bg-accent-primary/20 blur-[80px] rounded-full pointer-events-none" />
      <Card className="relative bg-surface/60 backdrop-blur-xl border-border shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-accent-primary to-accent-verified" />
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-raised/50">
          <span className="w-3 h-3 rounded-full bg-rose-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-accent-verified/70" />
          <span className="ml-3 text-xs font-mono text-muted-foreground">privateinfer — inference shell</span>
        </div>
        <CardHeader className="pt-5 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-verified" />
            Live Demo: Medical Analysis
          </CardTitle>
          <CardDescription className="text-xs">
            Your input is encrypted before leaving this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          <div className="p-4 bg-background rounded-lg border border-border text-sm font-mono text-muted-foreground space-y-1">
            <p>
              <span className="text-accent-primary">❯</span> Patient presents with mild chest pain...
            </p>
            <p>
              <span className="text-accent-primary">❯</span>{" "}
              <span className="text-accent-verified">[ENCRYPTING PAYLOAD]</span>
            </p>
            <p>
              <span className="text-accent-primary">❯</span> COMMITMENT:{" "}
              <span className="text-muted-foreground/60">0x4a2f…c91b</span>
            </p>
            <p>
              <span className="text-accent-primary">❯</span> ZK PROOF:{" "}
              <span className="text-muted-foreground/60">π = ⟨G₁, G₂, H⟩</span>
            </p>
            <p>
              <span className="text-accent-primary">❯</span> STATUS:{" "}
              <span className="text-accent-primary animate-pulse font-semibold">● PROCESSING</span>
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-verified" />
              On-chain verified
            </span>
            <span className="flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              Midnight PREPROD
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="flex items-start gap-3">
          <span className="text-xs font-mono text-accent-primary mt-0.5 select-none">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold text-primary group-hover:text-accent-primary transition-colors">
            {q}
          </span>
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground mt-0.5 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-accent-primary" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 pl-8 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col overflow-x-hidden">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative container mx-auto px-4 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-14">
        {/* Background radial */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--accent-primary) 0%, transparent 70%)",
          }}
        />

        {/* Left copy */}
        <motion.div
          className="flex-1 text-center lg:text-left z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-5 flex justify-center lg:justify-start">
            <Badge className="border border-accent-primary/40 bg-accent-primary/10 text-accent-primary font-mono text-xs px-3 py-1 rounded-full">
              🌑 Built on Midnight · PREPROD
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-display font-bold text-primary tracking-tight leading-[1.08] mb-6"
            variants={fadeUp}
          >
            Confidential AI Inference.{" "}
            <span className="text-accent-primary">Zero Exposure.</span>
          </motion.h1>

          <motion.p
            className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-9 leading-relaxed"
            variants={fadeUp}
          >
            Submit sensitive medical and legal queries to verified AI models on the Midnight
            blockchain. Your data stays encrypted end-to-end — every result is cryptographically
            proven, every payment trustlessly settled in tDUST.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            variants={fadeUp}
          >
            <Link href="/query/new">
              <Button
                size="lg"
                className="bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold px-8 gap-2 shadow-lg shadow-accent-primary/25"
              >
                Submit a Query <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/provider">
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-surface-raised px-8 gap-2"
              >
                <Cpu className="w-4 h-4" />
                For Providers
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — terminal widget */}
        <motion.div
          className="flex-1 w-full z-10"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        >
          <TerminalWidget />
        </motion.div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface-raised/50 py-10">
        <motion.div
          className="container mx-auto px-4 grid grid-cols-3 gap-6 md:gap-0 md:divide-x divide-border"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="flex flex-col items-center text-center px-4"
            >
              <span className="text-3xl md:text-4xl font-display font-bold text-accent-primary mb-1">
                {s.value}
              </span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-accent-primary mb-3">
              The Protocol
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-display font-bold text-primary"
            >
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Three cryptographically enforced steps — from encrypted query to verified settlement.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerSlow}
          >
            {/* Connector line (desktop only) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-16 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px border-t border-dashed border-border"
            />

            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative flex flex-col items-center text-center p-8 bg-background rounded-2xl border border-border hover:border-accent-primary/40 transition-all hover:shadow-xl"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-xs font-bold px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
                  {step.number}
                </div>
                <div className="mt-4 mb-5 p-4 rounded-full bg-surface-raised">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-24">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-accent-primary mb-3">
            Why PrivateInfer
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-display font-bold text-primary"
          >
            Privacy-First by Design
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Every layer of the stack — from your browser to the blockchain — is built around your data never being exposed.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerSlow}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full bg-surface border-border hover:border-accent-primary/40 transition-all hover:shadow-lg group">
                <CardHeader className="pb-3">
                  <div className={`inline-flex p-2.5 rounded-xl ${f.bg} mb-3 w-fit`}>
                    {f.icon}
                  </div>
                  <CardTitle className="text-base font-semibold text-primary group-hover:text-accent-primary transition-colors">
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── For Providers CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        {/* Background gradient */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-primary) 0%, transparent 55%), linear-gradient(225deg, var(--accent-verified) 0%, transparent 55%)",
            opacity: 0.12,
          }}
        />
        <div className="absolute inset-0 border-y border-border pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-surface-raised border border-border">
                <Cpu className="w-10 h-10 text-accent-primary" />
              </div>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-accent-primary mb-4">
              Provider Hub
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-display font-bold text-primary mb-5"
            >
              Monetize Your AI Models. <br className="hidden md:block" />
              Keep Your Weights Private.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Register your proprietary model in the marketplace. PrivateInfer handles the
              verifiable custody chain, the encrypted delivery pipeline, and instant tDUST
              settlement — so you focus on building better AI, not payment infrastructure.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/provider">
                <Button
                  size="lg"
                  className="bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold px-8 gap-2 shadow-lg shadow-accent-primary/20"
                >
                  Register Your Model <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/provider">
                <Button size="lg" variant="outline" className="border-border hover:bg-surface-raised px-8 gap-2">
                  <Scale className="w-4 h-4" />
                  View Provider Docs
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
            >
              {[
                { icon: <CheckCircle2 className="w-4 h-4 text-accent-verified" />, text: "On-chain proof of work" },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "Instant tDUST settlement" },
                { icon: <Globe className="w-4 h-4 text-sky-400" />, text: "Midnight PREPROD network" },
              ].map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {b.icon}
                  {b.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-accent-primary mb-3">
              FAQ
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-display font-bold text-primary"
            >
              Common Questions
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-3">
              Everything you need to know about confidential inference on Midnight.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerSlow}
            className="bg-background rounded-2xl border border-border px-6 divide-y divide-border"
          >
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface-raised/40">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left — logo + tagline */}
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 font-display font-bold text-lg text-primary">
                <Image src="/logo.png" alt="PrivateInfer" width={24} height={24} className="rounded" />
                PrivateInfer
              </span>
              <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                Confidential AI Inference Marketplace on the Midnight Blockchain.
              </p>
            </div>

            {/* Center — nav links */}
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Link href="/query/new" className="text-muted-foreground hover:text-primary transition-colors">
                Submit Query
              </Link>
              <Link href="/provider" className="text-muted-foreground hover:text-primary transition-colors">
                Provider Hub
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                GitHub
              </a>
              <a
                href="#"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <FileText className="w-4 h-4" />
                Docs
              </a>
            </nav>

            {/* Right — badges + disclaimer + copyright */}
            <div className="flex flex-col items-start md:items-end gap-2 text-xs text-muted-foreground">
              <Badge className="border border-accent-verified/40 bg-accent-verified/10 text-accent-verified font-mono text-xs rounded-full">
                Midnight PREPROD
              </Badge>
              <span className="text-muted-foreground/70">Beta — Not for production use</span>
              <span>© 2026 PrivateInfer</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
