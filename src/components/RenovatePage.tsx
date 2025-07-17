import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadConfigFromLocalStorage } from "@/lib/configService";
import type { Config } from "@/components/SettingsPage";
import { useNavigate } from "react-router-dom";

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
  branch: string;
  prUrl: string;
  status: string;
  buildStatus: {
    id: number;
    status: string;
    result: string;
    url: string;
  } | null;
}

interface AzureDevOpsPR {
  pullRequestId: number;
  title: string;
  status: string;
  sourceRefName: string;
  createdBy: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
  repository: {
    name: string;
  };
  url: string;
  isDraft: boolean;
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

export const RenovatePage = () => {
  const navigate = useNavigate();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  const fetchRenovatePRs = async (config: Config) => {
    if (!config.renovate.enabled) return [];

    const groupedPRs: Record<string, PullRequest> = {};

    for (const repo of config.repositories) {
      try {
        const repoName = repo.name;

        const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${repo.project}/_apis/git/repositories/${repoName}/pullrequests?api-version=6.0`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(
              ":" + config.azureDevOps.personalAccessToken
            )}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const pullRequests: AzureDevOpsPR[] = data.value || [];

        const renovatePRs = pullRequests.filter(
          (pr) =>
            pr.createdBy.displayName
              .toLowerCase()
              .includes(config.renovate.botName.toLowerCase()) ||
            pr.createdBy.uniqueName
              .toLowerCase()
              .includes(config.renovate.botName.toLowerCase()) ||
            pr.createdBy.id
              .toLowerCase()
              .includes(config.renovate.botName.toLowerCase())
        );

        // Group by title
        for (const pr of renovatePRs) {
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
          const buildUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${repo.project}/_apis/build/builds?branchName=refs/pull/${pr.pullRequestId}/merge&$top=1&api-version=7.1`;

          const buildResponse = await fetch(buildUrl, {
            method: "GET",
            headers: {
              Authorization: `Basic ${btoa(
                ":" + config.azureDevOps.personalAccessToken
              )}`,
              "Content-Type": "application/json",
            },
          });

          let buildStatus = null;
          if (buildResponse.ok) {
            const buildData = await buildResponse.json();
            const latestBuild = buildData.value?.[0];
            if (latestBuild) {
              buildStatus = {
                id: latestBuild.id,
                status: latestBuild.status,
                result: latestBuild.result,
                url: latestBuild._links.web.href,
              };
            }
          }

          const pullRequestRepository = {
            name: pr.repository.name,
            prUrl: `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${repo.project}/_git/${pr.repository.name}/pullrequest/${pr.pullRequestId}`,
            branch: pr.sourceRefName,
            status: prStatus,
            buildStatus: buildStatus,
          };
          groupedPRs[pr.title].repositories.push(pullRequestRepository);
          groupedPRs[pr.title].lastMergeSourceCommit[pr.repository.name] =
            pr.lastMergeSourceCommit?.commitId || "";
        }
      } catch (error) {
        console.error(`Failed to fetch PRs for ${repo.name}:`, error);
      }
    }

    return Object.values(groupedPRs);
  };

  useEffect(() => {
    const configData = loadConfigFromLocalStorage();

    console.log("asda");
    if (!configData) {
      navigate("/settings");
      return;
    }

    console.log(configData);
    setConfig(configData);

    if (configData.renovate.enabled) {
      fetchRenovatePRs(configData).then((renovatePRs) => {
        setPullRequests(renovatePRs);
      });
    }
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

  const createUpdatePRFromMainBrench = async (
    repoName: string,
    sourceBranch: string,
    targetBranch: string
  ) => {
    if (!config) return;
    const repoConfig = config.repositories.find((r) => r.name === repoName);

    const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${repoConfig.project}/_apis/git/repositories/${repoName}/pullrequests?api-version=6.0`;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            ":" + config.azureDevOps.personalAccessToken
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceRefName: `refs/heads/${sourceBranch}`,
          targetRefName: `${targetBranch}`,
          title: `Update ${targetBranch} from ${sourceBranch}`,
          description: `Automated PR to update ${targetBranch} with latest changes from ${sourceBranch}`,
        }),
      });
      if (!response.ok) throw new Error("Failed to create PR");
      const data = await response.json();

      const prUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${repoConfig.project}/_git/${repoName}/pullrequest/${data.pullRequestId}`;

      return prUrl;
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to create update PR",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {pullRequests.length} Renovate PRs
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshPRs}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh PRs</span>
          </Button>
        </div>
      </div>

      { config && !config.renovate.enabled && (
        <p className="text-sm text-red-600 mt-2">
          ⚠️ Renovate is currently disabled. Enable it in your configuration to receive dependency updates.
        </p>
      )}

      <div className="grid gap-4">
        {pullRequests.map((pr) => (
          <Card key={pr.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <GitPullRequest className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <CardTitle className="text-lg font-medium text-foreground">
                      {pr.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {pr.repositories.length} repositories
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Affected Repositories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {pr.repositories.map((repo) => {
                    const repoConfig = config?.repositories.find(
                      (r) => r.name === repo.name
                    );
                    const pipelineUrl = repoConfig
                      ? `${config.azureDevOps.baseUrl}/${
                          config.azureDevOps.organization
                        }/${repoConfig.project}/_build?definitionId=${
                          repoConfig.pipelineId
                        }&branchName=${encodeURIComponent(repoConfig.branch)}`
                      : null;
                    return (
                      <div
                        key={repo.name}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={
                              pr.status === "draft" ? "secondary" : "default"
                            }
                          >
                            {repo.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <a
                              href={repo.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 rounded hover:bg-accent flex items-center gap-1"
                            >
                              {repo.name}
                              <ExternalLink className="w-4 h-4 text-primary" />
                            </a>
                          </Badge>

                          {repo.buildStatus && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Badge variant="outline">
                                <a
                                  href={repo.buildStatus.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 rounded hover:bg-accent flex items-center gap-1"
                                >
                                  Build {repo.buildStatus.result}
                                  <ExternalLink className="w-4 h-4 text-primary" />
                                </a>
                              </Badge>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={async () => {
                              const prUrl = await createUpdatePRFromMainBrench(
                                repo.name,
                                repoConfig.branch,
                                repo.branch
                              );
                              if (prUrl) {
                                window.open(prUrl, "_blank");
                              }
                            }}
                          >
                            Update from master
                          </Button>
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
