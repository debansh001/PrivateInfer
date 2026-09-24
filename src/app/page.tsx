"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-5xl lg:text-6xl font-display font-bold text-primary tracking-tight mb-6"
            variants={fadeUp}
          >
            Confidential AI Inference on Midnight.
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed"
            variants={fadeUp}
          >
            Submit sensitive medical and legal queries to trusted AI models.{" "}
            Zero query exposure. Zero model exposure. 100% cryptographically verified.
          </motion.p>
          <motion.div
            className="flex items-center justify-center lg:justify-start gap-4"
            variants={fadeUp}
          >
            <Link href="/query/new">
              <Button size="lg" className="bg-accent-primary hover:bg-accent-primary/90 text-primary-foreground font-semibold px-8">
                Submit a Query
              </Button>
            </Link>
            <Link href="/provider">
              <Button size="lg" variant="outline" className="border-border hover:bg-surface-raised px-8">
                For Providers
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Visual Widget */}
        <motion.div
          className="flex-1 w-full max-w-lg relative"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-accent-primary/20 blur-[100px] rounded-full" />
          <Card className="relative bg-surface/50 backdrop-blur-xl border-border shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-accent-primary to-accent-verified" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent-verified" />
                Live Demo: Medical Analysis
              </CardTitle>
              <CardDescription>Your input is encrypted before leaving this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background rounded-md border border-border text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                &gt; Patient presents with mild...{"\n"}
                &gt; [ENCRYPTING PAYLOAD]{"\n"}
                &gt; COMMITMENT: [GENERATING_SECURE_HASH]{"\n"}
                &gt; STATUS: <span className="text-accent-primary animate-pulse">PROCESSING</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-surface py-24">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-3xl font-display font-bold text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <Lock className="w-8 h-8 text-accent-primary" />,
                title: "1. Encrypt",
                desc: "Your sensitive query is encrypted locally. Only the model provider can decrypt it."
              },
              {
                icon: <Shield className="w-8 h-8 text-accent-verified" />,
                title: "2. Verify",
                desc: "The AI processes the query and anchors a proof of custody on the Midnight blockchain."
              },
              {
                icon: <Activity className="w-8 h-8 text-primary" />,
                title: "3. Settle",
                desc: "Once verified, a micropayment in tDUST is released to the provider instantly."
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center text-center p-6 bg-background rounded-xl border border-border hover:border-accent-primary/50 transition-colors hover:shadow-lg"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="mb-4 p-4 rounded-full bg-surface-raised">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* USPs & Call to action */}
      <section className="container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Cpu className="w-12 h-12 mx-auto text-accent-primary mb-6" />
          <h2 className="text-3xl font-display font-bold mb-4">Are you an AI Model Provider?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Monetize your proprietary models without exposing your weights or logic.{" "}
            PrivateInfer handles the verifiable custody chain and instant settlement.
          </p>
          <Link href="/provider">
            <Button size="lg" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Register your Model
            </Button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
