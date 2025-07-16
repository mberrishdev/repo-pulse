import { SidebarTrigger } from "@/components/ui/sidebar";
import { Activity } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-6 justify-between supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-background" />
          </div>
          <h1 className="text-xl font-bold text-foreground">RepoPulse</h1>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
};
