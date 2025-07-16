
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/StatusIndicator";
import { GitPullRequest, Send, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PullRequest {
  id: string;
  title: string;
  repositories: string[];
  status: "draft" | "active";
  validationStatus: "success" | "failed" | "running" | "unknown";
  prUrl: string;
  lastMergeSourceCommit: Record<string, string>;
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
  const [buildStatuses, setBuildStatuses] = useState<Record<string, RepoBuildStatus>>({}); // pr.id -> repoName -> status

  const fetchRenovatePRs = async (config: Config) => {
    if (!config.renovate.enabled) return [];

    const groupedPRs: Record<string, PullRequest> = {};

    console.log(config.repositories);
    for (const repo of config.repositories) {
      try {
        // Extract repository name from URL or use name directly
        const repoName = repo.name;
        
        // Azure DevOps REST API call
        // const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/git/repositories/${repoName}/pullrequests?searchCriteria.status=active&searchCriteria.status=draft&api-version=6.0`;
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

        console.log(data.value);
        
        // Filter for Renovate PRs
        // const renovatePRs = pullRequests.filter(pr => 
        //   pr.createdBy.displayName.toLowerCase().includes('renovate') ||
        //   pr.createdBy.uniqueName.toLowerCase().includes('renovate') ||
        //   config.renovate.botName.toLowerCase() === pr.createdBy.displayName.toLowerCase()
        // );

        const renovatePRs = pullRequests;

        // Group by title
        renovatePRs.forEach(pr => {
          const prStatus = pr.isDraft ? "draft" : "active";
          if (!groupedPRs[pr.title]) {
            groupedPRs[pr.title] = {
              id: pr.pullRequestId.toString(),
              title: pr.title,
              repositories: [],
              status: prStatus,
              validationStatus: "unknown" as const,
              prUrl: `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_git/${pr.repository.name}/pullrequest/${pr.pullRequestId}`,
              lastMergeSourceCommit: {},
            };
          }
          if (!groupedPRs[pr.title].repositories.includes(pr.repository.name)) {
            groupedPRs[pr.title].repositories.push(pr.repository.name);
          }
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

  // Fetch build status for each PR/repo after PRs are loaded
  useEffect(() => {
    const fetchBuildStatuses = async () => {
      if (!config) return;
      const statuses: Record<string, RepoBuildStatus> = {};
      for (const pr of pullRequests) {
        statuses[pr.id] = {};
        for (const repoName of pr.repositories) {
          const repoConfig = config.repositories.find(r => r.name === repoName);
          if (!repoConfig) continue;
          const branchNames = [
            `refs/pull/${pr.id}/merge`,
            `refs/pull/${pr.id}/head`,
            `refs/heads/${repoConfig.branch}`
          ];
          let build = null;
          for (const branchName of branchNames) {
            const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/build/builds?definitions=${repoConfig.pipelineId}&branchName=${encodeURIComponent(branchName)}&reason=pullRequest&$top=1&api-version=6.0`;
            try {
              const response = await fetch(apiUrl, {
                headers: {
                  'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
                  'Content-Type': 'application/json',
                },
              });
              if (!response.ok) throw new Error('Failed to fetch build status');
              const data = await response.json();
              console.log(data);
              if (data.value && data.value.length > 0) {
                build = data.value[0];
                break;
              }
            } catch (e) {
              console.error(`Failed to fetch build status for ${repoName} on branch ${branchName}:`, e);
            }
          }
          let status: RepoBuildStatus[string]["status"] = "unknown";
          let buildUrl: string | undefined = undefined;
          if (build) {
            switch (build.result) {
              case "succeeded": status = "succeeded"; break;
              case "failed": status = "failed"; break;
              case "canceled": status = "canceled"; break;
              case "partiallySucceeded": status = "partiallySucceeded"; break;
              default:
                switch (build.status) {
                  case "inProgress": status = "inProgress"; break;
                  case "cancelling": status = "cancelling"; break;
                  case "notStarted": status = "notStarted"; break;
                  default: status = "unknown";
                }
            }
            buildUrl = build._links?.web?.href || build.url;
          }
          statuses[pr.id][repoName] = { status, buildUrl };
        }
      }
      setBuildStatuses(statuses);
    };
    if (pullRequests.length && config) {
      fetchBuildStatuses();
    }
  }, [pullRequests, config]);

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

  const publishPR = async (prId: string, prTitle: string, repoNames: string[]) => {
    if (!config) return;
    let allSuccess = true;
    for (const repoName of repoNames) {
      const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/git/repositories/${repoName}/pullRequests/${prId}?api-version=6.0`;
      try {
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isDraft: false }),
        });
        if (!response.ok) {
          allSuccess = false;
          toast({
            title: "Error",
            description: `Failed to publish PR for ${repoName}.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        allSuccess = false;
        toast({
          title: "Error",
          description: `Failed to publish PR for ${repoName}.`,
          variant: "destructive",
        });
      }
    }
    if (allSuccess) {
      toast({
        title: "PR Published",
        description: `"${prTitle}" has been published for all affected repositories.`,
      });
    }
    // Optionally, refresh PRs after publishing
    refreshPRs();
  };

  const publishAllPRs = async () => {
    for (const pr of pullRequests) {
      await publishPR(pr.id, pr.title, pr.repositories);
    }
  };

  const handleAdd = (pr: PullRequest) => {
    toast({
      title: "Add Action",
      description: `Add action triggered for PR: ${pr.title}`,
    });
  };

  const handleComplete = async (pr: PullRequest) => {
    if (!config) return;
    let allSuccess = true;
    for (const repoName of pr.repositories) {
      const commitId = pr.lastMergeSourceCommit[repoName];
      const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/git/repositories/${repoName}/pullRequests/${pr.id}?api-version=6.0`;
      try {
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: "completed",
            lastMergeSourceCommit: { commitId },
          }),
        });
        if (!response.ok) {
          allSuccess = false;
          toast({
            title: "Error",
            description: `Failed to complete PR for ${repoName}.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        allSuccess = false;
        toast({
          title: "Error",
          description: `Failed to complete PR for ${repoName}.`,
          variant: "destructive",
        });
      }
    }
    if (allSuccess) {
      toast({
        title: "PR Completed",
        description: `Pull request has been merged for all affected repositories.`,
      });
    }
    refreshPRs();
  };

  const triggerBuild = async (repoName: string) => {
    if (!config) return;
    const repoConfig = config.repositories.find(r => r.name === repoName);
    if (!repoConfig) return;
    const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/build/builds?api-version=6.0`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          definition: { id: repoConfig.pipelineId },
          sourceBranch: `refs/heads/${repoConfig.branch}`,
        }),
      });
      if (!response.ok) {
        toast({
          title: 'Build Trigger Failed',
          description: `Failed to trigger build for ${repoName}.`,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Build Triggered',
        description: `Build triggered for ${repoName} on branch ${repoConfig.branch}.`,
      });
    } catch (error) {
      toast({
        title: 'Build Trigger Failed',
        description: `Failed to trigger build for ${repoName}.`,
        variant: 'destructive',
      });
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
          <Button
            onClick={publishAllPRs}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
            <span>Publish All PRs</span>
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
                  <StatusIndicator status={pr.validationStatus} showLabel />
                  {pr.status === "draft" && (
                    <Button 
                      onClick={() => publishPR(pr.id, pr.title, pr.repositories)}
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
                  {pr.repositories.map((repo) => {
                    const repoConfig = config?.repositories.find(r => r.name === repo);
                    const pipelineUrl = repoConfig
                      ? `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_build?definitionId=${repoConfig.pipelineId}&branchName=${encodeURIComponent(repoConfig.branch)}`
                      : null;
                    const buildStatus = buildStatuses[pr.id]?.[repo]?.status || "unknown";
                    const buildUrl = buildStatuses[pr.id]?.[repo]?.buildUrl;
                    return (
                      <span key={repo} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {repo}
                        </Badge>
                        {buildStatus !== "unknown" && (
                          <span title={`Build status: ${buildStatus}`}>{
                            buildStatus === "succeeded" ? "✅" :
                            buildStatus === "failed" ? "❌" :
                            buildStatus === "inProgress" ? "⏳" :
                            buildStatus === "canceled" ? "🚫" :
                            buildStatus === "partiallySucceeded" ? "⚠️" :
                            buildStatus === "notStarted" ? "🕒" :
                            "❔"
                          }</span>
                        )}
                        {buildUrl && (
                          <a
                            href={buildUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 rounded hover:bg-gray-200"
                            title="View Latest Build"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        )}
                        {pipelineUrl && !buildUrl && (
                          <a
                            href={pipelineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 rounded hover:bg-gray-200"
                            title="View Build Pipeline"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        )}
                        <Button
                          size="icon"
                          variant="outline"
                          className="ml-1"
                          title="Trigger Build"
                          onClick={() => triggerBuild(repo)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </span>
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
