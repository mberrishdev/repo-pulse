
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/StatusIndicator";
import { GitPullRequest, Send, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PullRequest {
  id: string;
  title: string;
  repositories: string[];
  status: "draft" | "active";
  validationStatus: "success" | "failed" | "running" | "unknown";
}

export const RenovatePage = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in real app this would query Azure DevOps API
  useEffect(() => {
    const mockPRs: PullRequest[] = [
      {
        id: "1",
        title: "Update dependency @types/node to v20.10.0",
        repositories: ["frontend-app", "backend-api"],
        status: "draft",
        validationStatus: "unknown"
      },
      {
        id: "2", 
        title: "Update dependency typescript to v5.3.0",
        repositories: ["frontend-app", "shared-components", "auth-service"],
        status: "active",
        validationStatus: "running"
      },
      {
        id: "3",
        title: "Update dependency react to v18.2.0",
        repositories: ["frontend-app", "shared-components"],
        status: "draft",
        validationStatus: "unknown"
      },
      {
        id: "4",
        title: "Update dependency express to v4.18.0",
        repositories: ["backend-api", "auth-service"],
        status: "active",
        validationStatus: "success"
      },
    ];
    setPullRequests(mockPRs);
  }, []);

  const refreshPRs = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast({
      title: "PRs Refreshed",
      description: "Renovate pull requests have been updated.",
    });
  };

  const publishPR = async (prId: string, prTitle: string) => {
    // Update PR status to active and trigger validation
    setPullRequests(prev => prev.map(pr => 
      pr.id === prId 
        ? { ...pr, status: "active" as const, validationStatus: "running" as const }
        : pr
    ));

    toast({
      title: "PR Published",
      description: `"${prTitle}" has been published and validation pipeline triggered.`,
    });

    // Simulate pipeline completion
    setTimeout(() => {
      setPullRequests(prev => prev.map(pr => 
        pr.id === prId 
          ? { ...pr, validationStatus: Math.random() > 0.3 ? "success" as const : "failed" as const }
          : pr
      ));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renovate PRs</h1>
          <p className="text-gray-600 mt-1">Manage Renovate dependency update pull requests</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshPRs} 
          disabled={isRefreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh PRs</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {pullRequests.map((pr) => (
          <Card key={pr.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <GitPullRequest className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <CardTitle className="text-lg font-medium text-gray-900">
                      {pr.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={pr.status === "draft" ? "secondary" : "default"}>
                        {pr.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {pr.repositories.length} repositories
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusIndicator status={pr.validationStatus} showLabel />
                  {pr.status === "draft" && (
                    <Button 
                      onClick={() => publishPR(pr.id, pr.title)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publish PR</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Affected Repositories:</p>
                <div className="flex flex-wrap gap-2">
                  {pr.repositories.map((repo) => (
                    <Badge key={repo} variant="outline" className="text-xs">
                      {repo}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
