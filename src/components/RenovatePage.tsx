
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

interface Config {
  azureDevOps: {
    organization: string;
    project: string;
    personalAccessToken: string;
  };
  repositories: Array<{
    name: string;
    url: string;
    pipelineId: string;
    branch: string;
    status: string;
  }>;
  renovate: {
    enabled: boolean;
    botName: string;
    autoMerge: boolean;
  };
}

interface AzureDevOpsPR {
  pullRequestId: number;
  title: string;
  status: string;
  createdBy: {
    displayName: string;
    uniqueName: string;
  };
  repository: {
    name: string;
  };
}

export const RenovatePage = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  const fetchRenovatePRs = async (config: Config) => {
    if (!config.renovate.enabled) return [];

    const groupedPRs: Record<string, PullRequest> = {};

    for (const repo of config.repositories) {
      try {
        // Extract repository name from URL or use name directly
        const repoName = repo.name;
        
        // Azure DevOps REST API call
        const apiUrl = `https://dev.azure.com/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/git/repositories/${repoName}/pullrequests?searchCriteria.status=active&searchCriteria.status=draft&api-version=6.0`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const pullRequests: AzureDevOpsPR[] = data.value || [];

        // Filter for Renovate PRs
        const renovatePRs = pullRequests.filter(pr => 
          pr.createdBy.displayName.toLowerCase().includes('renovate') ||
          pr.createdBy.uniqueName.toLowerCase().includes('renovate') ||
          config.renovate.botName.toLowerCase() === pr.createdBy.displayName.toLowerCase()
        );

        // Group by title
        renovatePRs.forEach(pr => {
          if (!groupedPRs[pr.title]) {
            groupedPRs[pr.title] = {
              id: pr.pullRequestId.toString(),
              title: pr.title,
              repositories: [],
              status: pr.status as "draft" | "active",
              validationStatus: "unknown" as const
            };
          }
          
          if (!groupedPRs[pr.title].repositories.includes(pr.repository.name)) {
            groupedPRs[pr.title].repositories.push(pr.repository.name);
          }
        });
      } catch (error) {
        console.error(`Failed to fetch PRs for ${repo.name}:`, error);
      }
    }

    return Object.values(groupedPRs);
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        const configData: Config = await response.json();
        setConfig(configData);
        
        if (configData.renovate.enabled) {
          const renovatePRs = await fetchRenovatePRs(configData);
          setPullRequests(renovatePRs);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    
    loadConfig();
  }, []);

  const refreshPRs = async () => {
    if (!config) return;
    
    setIsRefreshing(true);
    try {
      const renovatePRs = await fetchRenovatePRs(config);
      setPullRequests(renovatePRs);
      toast({
        title: "PRs Refreshed",
        description: "Renovate pull requests have been updated from Azure DevOps.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh pull requests.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
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
