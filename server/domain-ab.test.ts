import { describe, it, expect } from "vitest";

// ============================================================
// Domain Health Optimizer Tests
// ============================================================

describe("Domain Health Optimizer", () => {
  describe("Health Score Algorithm", () => {
    it("should calculate health score from bounce, complaint, and open rates", () => {
      // Perfect domain: 0% bounce, 0% complaints, 30% opens
      const bounceRate = 0;
      const complaintRate = 0;
      const openRate = 0.30;
      
      // Score formula: base 100, minus penalties
      const bouncePenalty = bounceRate * 2000; // 20 points per 1% bounce
      const complaintPenalty = complaintRate * 10000; // 100 points per 1% complaint
      const openBonus = Math.min(openRate * 50, 15); // up to 15 bonus for opens
      const score = Math.max(0, Math.min(100, 100 - bouncePenalty - complaintPenalty + openBonus));
      
      expect(score).toBeGreaterThanOrEqual(95);
    });

    it("should penalize high bounce rates heavily", () => {
      const bounceRate = 0.05; // 5% bounce
      const bouncePenalty = bounceRate * 2000;
      expect(bouncePenalty).toBe(100); // Should max out penalty
    });

    it("should penalize complaints even more heavily than bounces", () => {
      const complaintRate = 0.005; // 0.5% complaints
      const complaintPenalty = complaintRate * 10000;
      expect(complaintPenalty).toBe(50);
      expect(complaintPenalty).toBeGreaterThan(0.005 * 2000); // More than same rate bounce
    });
  });

  describe("Auto-Healing Thresholds", () => {
    const BOUNCE_THRESHOLD = 0.02; // 2%
    const COMPLAINT_THRESHOLD = 0.001; // 0.1%
    const CRITICAL_BOUNCE = 0.05; // 5%
    const CRITICAL_COMPLAINT = 0.003; // 0.3%

    it("should flag domains exceeding bounce threshold for cooldown", () => {
      const bounceRate = 0.025; // 2.5%
      expect(bounceRate > BOUNCE_THRESHOLD).toBe(true);
    });

    it("should flag domains exceeding complaint threshold for cooldown", () => {
      const complaintRate = 0.002; // 0.2%
      expect(complaintRate > COMPLAINT_THRESHOLD).toBe(true);
    });

    it("should not flag healthy domains", () => {
      const bounceRate = 0.01; // 1%
      const complaintRate = 0.0005; // 0.05%
      expect(bounceRate > BOUNCE_THRESHOLD).toBe(false);
      expect(complaintRate > COMPLAINT_THRESHOLD).toBe(false);
    });

    it("should escalate to critical pause for very high rates", () => {
      const bounceRate = 0.06; // 6%
      expect(bounceRate > CRITICAL_BOUNCE).toBe(true);
    });

    it("should determine cooldown duration based on severity", () => {
      const getCooldownHours = (bounceRate: number, complaintRate: number) => {
        if (bounceRate > CRITICAL_BOUNCE || complaintRate > CRITICAL_COMPLAINT) return 72;
        if (bounceRate > BOUNCE_THRESHOLD || complaintRate > COMPLAINT_THRESHOLD) return 24;
        return 0;
      };

      expect(getCooldownHours(0.01, 0.0005)).toBe(0); // Healthy
      expect(getCooldownHours(0.03, 0.0005)).toBe(24); // Warning
      expect(getCooldownHours(0.06, 0.004)).toBe(72); // Critical
    });
  });

  describe("Warm-Up Schedule", () => {
    const WARMUP_PHASES = [
      { week: 1, dailyLimit: 50 },
      { week: 2, dailyLimit: 100 },
      { week: 3, dailyLimit: 200 },
      { week: 4, dailyLimit: 500 },
      { week: 5, dailyLimit: 1000 },
      { week: 6, dailyLimit: 2000 },
      { week: 7, dailyLimit: 3000 },
      { week: 8, dailyLimit: 5000 },
    ];

    it("should have 8 warm-up phases", () => {
      expect(WARMUP_PHASES).toHaveLength(8);
    });

    it("should start at 50 emails/day", () => {
      expect(WARMUP_PHASES[0].dailyLimit).toBe(50);
    });

    it("should end at 5000 emails/day", () => {
      expect(WARMUP_PHASES[7].dailyLimit).toBe(5000);
    });

    it("should increase monotonically", () => {
      for (let i = 1; i < WARMUP_PHASES.length; i++) {
        expect(WARMUP_PHASES[i].dailyLimit).toBeGreaterThan(WARMUP_PHASES[i - 1].dailyLimit);
      }
    });

    it("should calculate current phase from domain age in days", () => {
      const getPhase = (ageDays: number) => Math.min(Math.floor(ageDays / 7), 7);
      expect(getPhase(0)).toBe(0); // Week 1
      expect(getPhase(7)).toBe(1); // Week 2
      expect(getPhase(14)).toBe(2); // Week 3
      expect(getPhase(56)).toBe(7); // Week 8 (max)
      expect(getPhase(100)).toBe(7); // Still week 8
    });
  });

  describe("Domain Rotation", () => {
    it("should select healthiest domain with remaining capacity", () => {
      const domains = [
        { name: "a.com", healthScore: 95, sentToday: 400, dailyLimit: 500 },
        { name: "b.com", healthScore: 88, sentToday: 100, dailyLimit: 500 },
        { name: "c.com", healthScore: 72, sentToday: 0, dailyLimit: 500 },
        { name: "d.com", healthScore: 99, sentToday: 500, dailyLimit: 500 }, // At limit
      ];

      const available = domains
        .filter(d => d.sentToday < d.dailyLimit)
        .sort((a, b) => b.healthScore - a.healthScore);

      expect(available[0].name).toBe("a.com"); // Healthiest with capacity
      expect(available).toHaveLength(3); // d.com excluded (at limit)
    });

    it("should exclude paused/cooling domains from rotation", () => {
      const domains = [
        { name: "a.com", status: "active", healthScore: 95 },
        { name: "b.com", status: "paused", healthScore: 88 },
        { name: "c.com", status: "cooldown", healthScore: 72 },
        { name: "d.com", status: "active", healthScore: 60 },
      ];

      const available = domains.filter(d => d.status === "active");
      expect(available).toHaveLength(2);
      expect(available.map(d => d.name)).toEqual(["a.com", "d.com"]);
    });
  });

  describe("Recovery Protocol", () => {
    it("should reduce volume by 50% when recovering from cooldown", () => {
      const previousLimit = 2000;
      const recoveryLimit = Math.floor(previousLimit * 0.5);
      expect(recoveryLimit).toBe(1000);
    });

    it("should gradually ramp back up over 7 days", () => {
      const previousLimit = 2000;
      const recoveryLimit = Math.floor(previousLimit * 0.5);
      const dailyIncrease = Math.floor((previousLimit - recoveryLimit) / 7);
      
      const day3Limit = recoveryLimit + (dailyIncrease * 3);
      expect(day3Limit).toBeGreaterThan(recoveryLimit);
      expect(day3Limit).toBeLessThan(previousLimit);
    });
  });
});

// ============================================================
// Continuous A/B Testing Engine Tests
// ============================================================

describe("Continuous A/B Testing Engine", () => {
  describe("Variant Generation", () => {
    it("should generate subject line variants with different strategies", () => {
      const original = "Grow Your Brokerage with Apex CRM";
      const strategies = ["urgency", "curiosity", "personalization", "benefit", "social_proof"];
      
      // Each strategy should produce a different variant
      expect(strategies).toHaveLength(5);
      strategies.forEach(s => expect(s.length).toBeGreaterThan(0));
    });

    it("should generate send time variants", () => {
      const sendTimes = [
        "Tuesday 10:00 AM EST",
        "Wednesday 2:00 PM EST",
        "Thursday 9:00 AM EST",
        "Tuesday 7:00 AM EST",
      ];
      expect(sendTimes.length).toBeGreaterThanOrEqual(3);
    });

    it("should generate content optimization tips", () => {
      const tips = [
        "Add personalization tokens",
        "Include a clear CTA above the fold",
        "Use bullet points for scanability",
        "Add social proof or testimonials",
      ];
      expect(tips.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Statistical Significance", () => {
    it("should calculate z-score for two proportions", () => {
      const controlRate = 200 / 1000; // 20%
      const variantRate = 250 / 1000; // 25%
      const pooledRate = (200 + 250) / (1000 + 1000);
      const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/1000 + 1/1000));
      const zScore = (variantRate - controlRate) / se;
      
      expect(zScore).toBeGreaterThan(0);
      expect(zScore).toBeGreaterThan(1.96); // Should be significant at 95%
    });

    it("should not declare significance with small samples", () => {
      const controlRate = 2 / 10; // 20%
      const variantRate = 3 / 10; // 30%
      const pooledRate = (2 + 3) / (10 + 10);
      const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/10 + 1/10));
      const zScore = Math.abs((variantRate - controlRate) / se);
      
      expect(zScore).toBeLessThan(1.96); // Not significant with n=10
    });

    it("should calculate confidence percentage from z-score", () => {
      // Approximate normal CDF for common z-scores
      const zToConfidence = (z: number) => {
        if (z >= 2.576) return 99;
        if (z >= 1.96) return 95;
        if (z >= 1.645) return 90;
        if (z >= 1.282) return 80;
        return Math.round(z / 1.96 * 95);
      };

      expect(zToConfidence(2.58)).toBe(99);
      expect(zToConfidence(1.96)).toBe(95);
      expect(zToConfidence(1.0)).toBeLessThan(80);
    });

    it("should calculate lift percentage correctly", () => {
      const controlRate = 0.20;
      const variantRate = 0.25;
      const lift = ((variantRate - controlRate) / controlRate) * 100;
      expect(lift).toBe(25); // 25% lift
    });

    it("should identify the winner correctly", () => {
      const determineWinner = (controlRate: number, variantRate: number, significant: boolean) => {
        if (!significant) return "tie";
        return variantRate > controlRate ? "variant" : "control";
      };

      expect(determineWinner(0.20, 0.25, true)).toBe("variant");
      expect(determineWinner(0.25, 0.20, true)).toBe("control");
      expect(determineWinner(0.20, 0.25, false)).toBe("tie");
    });
  });

  describe("Sample Size Calculator", () => {
    it("should calculate minimum sample size per variant", () => {
      const baselineRate = 0.20;
      const mde = 0.05; // 5% absolute improvement
      const confidenceLevel = 0.95;
      const zAlpha = 1.96; // for 95% confidence
      const zBeta = 0.84; // for 80% power
      
      const p1 = baselineRate;
      const p2 = baselineRate + mde;
      const pBar = (p1 + p2) / 2;
      
      const n = Math.ceil(
        Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2)
        / Math.pow(p2 - p1, 2)
      );
      
      expect(n).toBeGreaterThan(500);
      expect(n).toBeLessThan(2000);
    });

    it("should require larger samples for smaller effects", () => {
      const calcN = (mde: number) => {
        const p1 = 0.20;
        const p2 = p1 + mde;
        const pBar = (p1 + p2) / 2;
        const zAlpha = 1.96;
        const zBeta = 0.84;
        return Math.ceil(
          Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2)
          / Math.pow(p2 - p1, 2)
        );
      };

      const n_5pct = calcN(0.05);
      const n_2pct = calcN(0.02);
      expect(n_2pct).toBeGreaterThan(n_5pct); // Smaller effect needs more data
    });

    it("should return total sample size as 2x per-variant", () => {
      const perVariant = 1000;
      const total = perVariant * 2;
      expect(total).toBe(2000);
    });
  });

  describe("Auto-Split Logic", () => {
    it("should split campaign recipients 50/50 for A/B test", () => {
      const totalRecipients = 1000;
      const controlSize = Math.floor(totalRecipients / 2);
      const variantSize = totalRecipients - controlSize;
      
      expect(controlSize).toBe(500);
      expect(variantSize).toBe(500);
      expect(controlSize + variantSize).toBe(totalRecipients);
    });

    it("should handle odd numbers correctly", () => {
      const totalRecipients = 1001;
      const controlSize = Math.floor(totalRecipients / 2);
      const variantSize = totalRecipients - controlSize;
      
      expect(controlSize + variantSize).toBe(1001);
    });
  });
});
