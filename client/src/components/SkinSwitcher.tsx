/**
 * SkinSwitcher — lets users switch between competitor UI modes
 * Shows as a compact dropdown in the sidebar footer
 */
import { useSkin, SkinId, SKINS } from "@/contexts/SkinContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

const SKIN_DESCRIPTIONS: Record<SkinId, string> = {
  axiom: "Native AXIOM experience",
  hubspot: "Migrating from HubSpot",
  salesforce: "Migrating from Salesforce",
  pipedrive: "Migrating from Pipedrive",
  zoho: "Migrating from Zoho CRM",
  gohighlevel: "Migrating from GoHighLevel",
  close: "Migrating from Close",
};

export function SkinSwitcher() {
  const { skin, skinId, setSkin, allSkins } = useSkin();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-medium opacity-70 hover:opacity-100"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{skin.logo} {skin.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-gray-500">
          UI Mode — match your previous CRM
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allSkins.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setSkin(s.id)}
            className="flex items-start gap-3 py-2 cursor-pointer"
          >
            <span className="text-base mt-0.5">{s.logo}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{s.name}</span>
                {skinId === s.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div className="text-xs text-gray-400 truncate">{SKIN_DESCRIPTIONS[s.id]}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-gray-400">
          Switching modes changes navigation labels and terminology to match your previous CRM. Your data is never affected.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
