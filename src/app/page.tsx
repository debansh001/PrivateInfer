import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Activity, Cpu } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-primary tracking-tight mb-6">
            Confidential AI Inference on Midnight.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Submit sensitive medical and legal queries to trusted AI models. 
            Zero query exposure. Zero model exposure. 100% cryptographically verified.
          </p>
          <div className="flex items-center justify-center lg:justify-start gap-4">
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
          </div>
        </div>

        {/* Hero Visual Widget */}
        <div className="flex-1 w-full max-w-lg relative">
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
                > Patient presents with mild...{"\n"}
                > [ENCRYPTING PAYLOAD]{"\n"}
                > COMMITMENT: 0x8f4c...3b92{"\n"}
                > STATUS: <span className="text-accent-primary animate-pulse">PROCESSING</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={i} className="flex flex-col items-center text-center p-6 bg-background rounded-xl border border-border hover:border-accent-primary/50 transition-colors">
                <div className="mb-4 p-4 rounded-full bg-surface-raised">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USPs & Call to action */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Cpu className="w-12 h-12 mx-auto text-accent-primary mb-6" />
        <h2 className="text-3xl font-display font-bold mb-4">Are you an AI Model Provider?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Monetize your proprietary models without exposing your weights or logic. 
          PrivateInfer handles the verifiable custody chain and instant settlement.
        </p>
        <Link href="/provider">
          <Button size="lg" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Register your Model
          </Button>
        </Link>
      </section>
    </main>
  );
}
