import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkin } from "@/contexts/SkinContext";
import { BookOpen, Play, HelpCircle, Lightbulb, CheckCircle2, Clock, Users, Search } from "lucide-react";

export default function CRMGuides() {
  const { t } = useSkin();
  const [activeTab, setActiveTab] = useState("guides");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: guides } = trpc.crmGuides.getGuides.useQuery({ level: selectedLevel as any });
  const { data: videos } = trpc.crmGuides.getVideoTutorials.useQuery({});
  const { data: faq } = trpc.crmGuides.getFAQ.useQuery({});
  const { data: tips } = trpc.crmGuides.getQuickTips.useQuery();
  const { data: checklist } = trpc.crmGuides.getOnboardingChecklist.useQuery();
  const { data: kb } = trpc.crmGuides.getKnowledgeBase.useQuery({ searchQuery });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM Guides & Learning</h1>
          <p className="text-muted-foreground">Master Apex CRM with comprehensive guides, tutorials, and resources.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{checklist?.completionRate ? Math.round((checklist.completionRate) * 100) : 0}% Onboarded</p>
          <div className="w-32 h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(checklist?.completionRate ?? 0) * 100}%` }} />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tips">Quick Tips</TabsTrigger>
          <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["beginner", "intermediate", "advanced"].map(level => (
              <Badge
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides?.map(guide => (
              <Card key={guide.id} className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                    </div>
                    <Badge variant="secondary">{guide.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {guide.duration} min
                    </span>
                    <span className="text-muted-foreground">{guide.sections} sections</span>
                  </div>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videos?.map(video => (
              <Card key={video.id} className="hover:shadow-lg transition cursor-pointer overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardContent className="pt-4 space-y-2">
                  <p className="font-medium line-clamp-2">{video.title}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{video.duration} min</span>
                    <span>{video.views.toLocaleString()} views</span>
                  </div>
                  <Button size="sm" className="w-full">Watch</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <div className="space-y-3">
            {faq?.map(item => (
              <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{item.question}</p>
                      <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quick Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips?.map(tip => (
              <Card key={tip.id} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{tip.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="kb" className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {kb?.map(article => (
              <Card key={article.id} className="hover:shadow-md transition cursor-pointer">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{article.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.content}</p>
                    </div>
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.views.toLocaleString()} views</span>
                    <span className="text-green-600">
                      {Math.round(article.helpful * 100)}% helpful
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Onboarding Checklist Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Onboarding Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checklist?.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="rounded border-border"
                />
                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Estimated time remaining: {checklist?.estimatedTimeRemaining} minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
