import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, Target, CheckCircle2, Zap, BookOpen } from "lucide-react";

interface GuideSection {
  icon: "purpose" | "expect" | "actions" | "outcomes" | "tips";
  title: string;
  content: string;
}

interface PageGuideProps {
  title: string;
  description: string;
  sections: GuideSection[];
}

const sectionIcons: Record<string, React.ReactNode> = {
  purpose: <Target className="h-4 w-4 text-blue-400" />,
  expect: <BookOpen className="h-4 w-4 text-emerald-400" />,
  actions: <Zap className="h-4 w-4 text-amber-400" />,
  outcomes: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  tips: <Lightbulb className="h-4 w-4 text-yellow-400" />,
};

export default function PageGuide({ title, description, sections }: PageGuideProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {sections.map((section, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/40 bg-background/50 p-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {sectionIcons[section.icon] || <HelpCircle className="h-4 w-4" />}
                  <span className="text-xs font-semibold text-foreground">
                    {section.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
