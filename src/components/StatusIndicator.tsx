
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, HelpCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: "success" | "failed" | "running" | "unknown";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StatusIndicator = ({ status, showLabel = false, size = "md" }: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "Success",
          badgeVariant: "default" as const,
          badgeClass: "bg-green-100 text-green-800 border-green-200"
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-600", 
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Failed",
          badgeVariant: "destructive" as const,
          badgeClass: "bg-red-100 text-red-800 border-red-200"
        };
      case "running":
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-50", 
          borderColor: "border-blue-200",
          label: "Running",
          badgeVariant: "default" as const,
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200"
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200", 
          label: "Unknown",
          badgeVariant: "secondary" as const,
          badgeClass: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4";

  if (showLabel) {
    return (
      <Badge className={config.badgeClass}>
        <Icon className={`${iconSize} mr-1 ${status === 'running' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center p-2 rounded-full ${config.bgColor} ${config.borderColor} border`}>
      <Icon className={`${iconSize} ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
    </div>
  );
};
