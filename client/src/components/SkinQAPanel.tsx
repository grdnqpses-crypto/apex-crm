/**
 * SkinQAPanel — Full-featured skin QA switcher for developers and AXIOM owners
 *
 * Features:
 * - Live color swatch + font preview for all 19 skins
 * - One-click skin switch with instant CSS variable application
 * - "QA Mode" indicator badge when viewing a non-default skin
 * - Shows which skin a client is using when impersonating
 * - Accessible from Developer panel and AXIOM Owner Settings → Appearance
 */
import { useSkin, SkinId, SKINS } from "@/contexts/SkinContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Palette, Eye, RotateCcw, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SKIN_META: Record<SkinId, { description: string; userBase: string; colorLabel: string }> = {
  axiom:           { description: "Native AXIOM experience — full feature set",                   userBase: "New users",                    colorLabel: "AXIOM Orange" },
  hubspot:         { description: "Mirrors HubSpot CRM — familiar layout & terms",               userBase: "HubSpot migrants",             colorLabel: "HubSpot Orange-Red (#FF7A59)" },
  salesforce:      { description: "Mirrors Salesforce — Opportunities, Accounts, Leads",         userBase: "Salesforce migrants",          colorLabel: "Salesforce Blue (#0070D2)" },
  pipedrive:       { description: "Mirrors Pipedrive — pipeline-first deal view",                userBase: "Pipedrive migrants",           colorLabel: "Pipedrive Green (#217A4B)" },
  zoho:            { description: "Mirrors Zoho CRM — familiar module structure",                userBase: "Zoho migrants",               colorLabel: "Zoho Red (#E42527)" },
  gohighlevel:     { description: "Mirrors GoHighLevel — dark mode, agency feel",                userBase: "GHL migrants",                colorLabel: "GHL Blue (#2563EB) dark" },
  close:           { description: "Mirrors Close CRM — inbox-first, activity-heavy",             userBase: "Close migrants",              colorLabel: "Close Indigo (#4C5FD5)" },
  apollo:          { description: "Mirrors Apollo.io — prospecting & sequences",                 userBase: "Apollo migrants",             colorLabel: "Apollo Blue (#4285F4)" },
  constantcontact: { description: "Mirrors Constant Contact — email-marketing CRM",             userBase: "Constant Contact migrants",   colorLabel: "CC Blue (#0062EA)" },
  monday:          { description: "Mirrors Monday CRM — colorful board-style layout",           userBase: "Monday migrants",             colorLabel: "Monday Indigo (#6161FF)" },
  freshsales:      { description: "Mirrors Freshsales — Freddy AI, Freshworks suite",           userBase: "Freshsales migrants",         colorLabel: "Freshsales Blue (#0B5FFF)" },
  activecampaign:  { description: "Mirrors ActiveCampaign — automation-first CRM",              userBase: "ActiveCampaign migrants",     colorLabel: "AC Blue (#356AE6)" },
  keap:            { description: "Mirrors Keap / Infusionsoft — SMB automation",               userBase: "Keap / Infusionsoft migrants",colorLabel: "Keap Green (#36A635)" },
  copper:          { description: "Mirrors Copper CRM — Google Workspace native",               userBase: "Copper migrants",             colorLabel: "Copper Pink (#FF3465)" },
  nutshell:        { description: "Mirrors Nutshell CRM — simple sales pipeline",               userBase: "Nutshell migrants",           colorLabel: "Nutshell Orange (#F37021)" },
  insightly:       { description: "Mirrors Insightly — project + CRM hybrid",                   userBase: "Insightly migrants",          colorLabel: "Insightly Red (#E8392C)" },
  sugarcrm:        { description: "Mirrors SugarCRM — enterprise open-source CRM",              userBase: "SugarCRM migrants",           colorLabel: "Sugar Red (#E61718)" },
  streak:          { description: "Mirrors Streak — Gmail-native CRM with pipelines",           userBase: "Streak migrants",             colorLabel: "Streak Blue (#4285F4)" },
  nimble:          { description: "Mirrors Nimble CRM — social-enrichment focused",             userBase: "Nimble migrants",             colorLabel: "Nimble Sky Blue (#00AEEF)" },
};

interface SkinQAPanelProps {
  /** If provided, shows which skin this client is using and allows switching to it */
  clientSkin?: SkinId | null;
  clientName?: string;
  compact?: boolean;
}

export function SkinQAPanel({ clientSkin, clientName, compact = false }: SkinQAPanelProps) {
  const { skin, skinId, setSkin, allSkins } = useSkin();
  const isQAMode = skinId !== "axiom";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Skin QA Switcher</p>
            <p className="text-xs text-muted-foreground">Switch UI mode to test any skin</p>
          </div>
        </div>
        {isQAMode && (
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs gap-1">
              <Eye className="h-3 w-3" /> QA Mode: {skin.name}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs gap-1.5 h-7"
              onClick={() => setSkin("axiom")}
            >
              <RotateCcw className="h-3 w-3" /> Reset to AXIOM
            </Button>
          </div>
        )}
      </div>

      {/* Client skin indicator */}
      {clientSkin && clientName && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700">
              {clientName} is using: <span className="font-bold">{SKINS[clientSkin]?.name ?? clientSkin}</span>
            </p>
            <p className="text-xs text-blue-500 mt-0.5">Click their skin below to preview their exact experience</p>
          </div>
          {clientSkin !== skinId && (
            <Button
              size="sm"
              className="rounded-lg text-xs shrink-0 h-7"
              onClick={() => setSkin(clientSkin)}
            >
              Switch to it
            </Button>
          )}
        </div>
      )}

      {/* Skin grid */}
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
        {allSkins.map((s) => {
          const isActive = skinId === s.id;
          const isClientSkin = clientSkin === s.id;
          const meta = SKIN_META[s.id];

          return (
            <Card
              key={s.id}
              className={cn(
                "rounded-xl cursor-pointer transition-all duration-200 overflow-hidden border-2",
                isActive
                  ? "border-primary shadow-md shadow-primary/10"
                  : "border-border/40 hover:border-primary/40 hover:shadow-sm"
              )}
              onClick={() => setSkin(s.id)}
            >
              {/* Color bar preview */}
              <div
                className="h-2 w-full"
                style={{ background: s.primaryColor }}
              />
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.logo}</span>
                    <div>
                      <p
                        className="text-xs font-bold leading-tight"
                        style={{ fontFamily: s.fontFamily, color: isActive ? s.primaryColor : undefined }}
                      >
                        {s.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{meta.colorLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isClientSkin && (
                      <Badge className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 px-1.5 py-0">Client</Badge>
                    )}
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {!compact && (
                  <>
                    {/* Font preview */}
                    <div
                      className="text-[11px] text-muted-foreground leading-snug"
                      style={{ fontFamily: s.fontFamily }}
                    >
                      {meta.description}
                    </div>

                    {/* Terminology preview */}
                    <div className="flex flex-wrap gap-1">
                      {[s.terms.contacts, s.terms.deals, s.terms.companies].map((term) => (
                        <span
                          key={term}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{
                            background: `${s.primaryColor}18`,
                            color: s.primaryColor,
                          }}
                        >
                          {term}
                        </span>
                      ))}
                    </div>

                    {/* User base */}
                    <p className="text-[10px] text-muted-foreground/60">{meta.userBase}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          Switching skins changes navigation labels, terminology, accent colors, fonts, and record layouts to match that CRM. Client data is never affected. Use this to QA-test the experience your clients see.
        </p>
      </div>
    </div>
  );
}
