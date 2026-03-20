import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Factory, Warehouse, ShoppingCart, Briefcase, HeartPulse,
  HardHat, Building2, DollarSign, Code2, Building, CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkin } from "@/contexts/SkinContext";

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, Factory, Warehouse, ShoppingCart, Briefcase, HeartPulse,
  HardHat, Building2, DollarSign, Code2, Building,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BusinessCategorySelector({
  onComplete }: { onComplete?: () => void } & Record<string, any>) {
  const { t } = useSkin();
  const { data: categories, isLoading } = trpc.businessCategory.list.useQuery();
  const { data: myCategory } = trpc.businessCategory.myCategory.useQuery();
  const updateCategory = trpc.businessCategory.update.useMutation({
    onSuccess: () => {
      toast.success("Business category updated! Your CRM is now tailored to your industry.");
      onComplete?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(myCategory?.categoryKey ?? null);
  const [selectedSubType, setSelectedSubType] = useState<string | null>(myCategory?.subType ?? null);
  const [step, setStep] = useState<"category" | "subtype">("category");

  const selectedCategoryData = categories?.find(c => c.key === selectedCategory);

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key);
    setSelectedSubType(null);
    const cat = categories?.find(c => c.key === key);
    if (cat && cat.subTypes.length > 1) {
      setStep("subtype");
    } else {
      // Single sub-type — auto-select and save
      updateCategory.mutate({ categoryKey: key, subType: cat?.subTypes[0]?.key });
    }
  };

  const handleSubTypeSelect = (subTypeKey: string) => {
    setSelectedSubType(subTypeKey);
    if (selectedCategory) {
      updateCategory.mutate({ categoryKey: selectedCategory, subType: subTypeKey });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">What type of business are you?</h2>
        <p className="text-muted-foreground">
          We'll tailor your CRM experience — modules, terminology, and AI assistance — to match your industry.
        </p>
        {myCategory && myCategory.categoryKey !== 'general' && (
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">
            Currently: {myCategory.categoryLabel}
            {myCategory.subType && ` · ${myCategory.subType}`}
          </Badge>
        )}
      </div>

      {step === "category" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories?.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? Building;
            const isSelected = selectedCategory === cat.key;
            const isCurrent = myCategory?.categoryKey === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat.key)}
                disabled={updateCategory.isPending}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 text-center transition-all hover:border-orange-500/60 hover:bg-orange-500/5 group",
                  isSelected ? "border-orange-500 bg-orange-500/10" : "border-border bg-card",
                  "cursor-pointer"
                )}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                  </span>
                )}
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  isSelected ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-orange-500/20 group-hover:text-orange-500"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className={cn("font-semibold text-sm", isSelected ? "text-orange-500" : "text-foreground")}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === "subtype" && selectedCategoryData && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("category")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to categories
          </button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = ICON_MAP[selectedCategoryData.icon] ?? Building; return <Icon className="h-5 w-5 text-orange-500" />; })()}
                {selectedCategoryData.label}
              </CardTitle>
              <CardDescription>Select your specific business type for the best experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedCategoryData.subTypes.map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => handleSubTypeSelect(sub.key)}
                    disabled={updateCategory.isPending}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all hover:border-orange-500/60 hover:bg-orange-500/5",
                      selectedSubType === sub.key ? "border-orange-500 bg-orange-500/10" : "border-border bg-card"
                    )}
                  >
                    <span className="font-medium text-sm">{sub.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature preview */}
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-500">What you'll get</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {selectedCategoryData.highlightedFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {updateCategory.isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
          Updating your CRM configuration...
        </div>
      )}
    </div>
  );
}
