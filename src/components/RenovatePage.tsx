
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/StatusIndicator";
import { GitPullRequest, Send, RefreshCw, ExternalLink, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PullRequest {
  id: string;
  title: string;
  repositories: PullRequestRepository[];
  status: "draft" | "active";
  validationStatus: string;
  lastMergeSourceCommit: Record<string, string>;
}

interface PullRequestRepository {
  name: string;
  prUrl: string;
}

interface Config {
  azureDevOps: {
    organization: string;
    project: string;
    personalAccessToken: string;
    baseUrl: string; // Added baseUrl to config
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
    id: string;
  };
  repository: {
    name: string;
  };
  url: string; // Added url to AzureDevOpsPR
  isDraft: boolean; // Added isDraft to AzureDevOpsPR
  lastMergeSourceCommit: {
    commitId: string;
  };
  reviewers?: Array<{
    vote: number;
    reviewer: {
      displayName: string;
      uniqueName: string;
    };
  }>;
}

interface RepoBuildStatus {
  [repoName: string]: {
    status: "succeeded" | "failed" | "inProgress" | "cancelling" | "canceled" | "partiallySucceeded" | "notStarted" | "unknown";
    buildUrl?: string;
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
        const repoName = repo.name;
        
        const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/git/repositories/${repoName}/pullrequests?api-version=6.0`;
        
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

        const renovatePRs = pullRequests.filter(pr => 
           pr.createdBy.displayName.toLowerCase().includes(config.renovate.botName.toLowerCase()) ||
           pr.createdBy.uniqueName.toLowerCase().includes(config.renovate.botName.toLowerCase()) ||
           pr.createdBy.id.toLowerCase().includes(config.renovate.botName.toLowerCase()) 
         );

        // Group by title
        renovatePRs.forEach(pr => {
          const prStatus = pr.isDraft ? "draft" : "active";
          if (!groupedPRs[pr.title]) {
            groupedPRs[pr.title] = {
              id: pr.pullRequestId.toString(),
              title: pr.title,
              repositories: [],
              status: prStatus,
              validationStatus: "todo change" as const,
              lastMergeSourceCommit: {},
            };
          }
          console.log(groupedPRs, pr.repository.name);
          //if (!groupedPRs[pr.title].repositories.includes(pr.repository.name)) {
            const pullRequestRepository = {
              name: pr.repository.name,
              prUrl: `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_git/${pr.repository.name}/pullrequest/${pr.pullRequestId}`
            }
            groupedPRs[pr.title].repositories.push(pullRequestRepository);
          //}
          groupedPRs[pr.title].lastMergeSourceCommit[pr.repository.name] = pr.lastMergeSourceCommit?.commitId || "";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renovate PRs</h1>
          <p className="text-gray-600 mt-1">Manage Renovate dependency update pull requests</p>
        </div>
        <div className="flex space-x-2">
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
                 
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Affected Repositories:</p>
                <div className="flex flex-wrap gap-2">
                  {pr.repositories.map((repo) => {
                    const repoConfig = config?.repositories.find(r => r.name === repo.name);
                    const pipelineUrl = repoConfig
                      ? `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_build?definitionId=${repoConfig.pipelineId}&branchName=${encodeURIComponent(repoConfig.branch)}`
                      : null;
                    return (
                      <div key={repo.name} >
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            <a href={repo.prUrl} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded hover:bg-gray-200 flex items-center gap-1">
                              {repo.name}
                              <ExternalLink className="w-4 h-4 text-blue-600" />
                            </a>
                          </Badge>
                          {/* {pipelineUrl && (
                            <a
                              href={pipelineUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 rounded hover:bg-gray-200"
                              title="View Build Pipeline"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-600" />
                            </a>
                          )} */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
