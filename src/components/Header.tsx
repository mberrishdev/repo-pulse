
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Activity } from "lucide-react";

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <SidebarTrigger className="mr-4" />
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">RepoPulse</h1>
      </div>
    </header>
  );
};
