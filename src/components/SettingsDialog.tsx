import * as React from "react";
import { Settings2, Moon, Sun, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  onClearHistory: () => void;
}

export function SettingsDialog({ onClearHistory }: SettingsDialogProps) {
  return (
    <div className="space-y-6 p-1">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Appearance</h4>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm">Theme</div>
            <div className="text-[12px] text-muted-foreground">
              Switch between light and dark mode
            </div>
          </div>
          <div className="flex bg-muted p-1 rounded-lg">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
              <Sun className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-md shadow-sm">
              <Moon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm">Clear History</div>
            <div className="text-[12px] text-muted-foreground">
              Permanently delete all chat sessions
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
                onClearHistory();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">About</h4>
        <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 text-primary" />
          <div className="text-[12px] leading-relaxed text-muted-foreground">
            Lumina AI is a high-performance chatbot interface built with React, Tailwind CSS, and Google's Gemini 3.0 Flash model.
          </div>
        </div>
      </div>
    </div>
  );
}
