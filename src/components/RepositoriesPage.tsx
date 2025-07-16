
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ExternalLink, Play, RefreshCw, PlayCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Repository {
  name: string;
  url: string;
  pipelineId: string;
  branch: string;
  status: string;
  buildUrl: string;
}

interface Config {
  repositories: Repository[];
  azureDevOps: {
    project: any;
    organization: any;
    baseUrl: string;
    personalAccessToken: string;
  };
}

export const RepositoriesPage = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeringAll, setTriggeringAll] = useState(false);
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        const configData: Config = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();

  }, []);

  useEffect(() => {
    if (config) {
      refreshStatuses();
    }
  }, [config]);

  const refreshStatuses = async () => {
    setIsRefreshing(true);

    if (!config) return;

    for (const repo of config.repositories) {

      const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/pipelines/${repo.pipelineId}/runs?api-version=6.0`;

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to trigger pipeline for ${repo.name}`);
        }

        const data = await response.json();

        if(data.value[0].result)
        {

          repo.status = data.value[0].result;
        }
        else
        {
          repo.status = data.value[0].state;
        }

        repo.buildUrl = data.value[0]._links['pipeline.web'].href;

        localStorage.setItem(`${repo.name}-buildTime`, data.value[0].createdDate);

      } catch (error) {
        console.error(`Failed to trigger pipeline for ${repo.name}:`, error);
      }
    }

    setIsRefreshing(false);
  };

  const triggerSinglePipeline = async (repoName: string, triggerAll: boolean) => {
    if (!config) return;
  
    const repoConfig = config.repositories.find(r => r.name === repoName);
    if (!repoConfig) return;
  
    const apiUrl = `${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis/pipelines/${repoConfig.pipelineId}/runs?api-version=7.1`;
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(':' + config.azureDevOps.personalAccessToken)}`,
        },
        body: JSON.stringify({
          resources: {
            repositories: {
              self: {
                refName: `refs/heads/${repoConfig.branch}`
              }
            }
          },
          templateParameters: {},
          variables: {}
        }),
      });
  
      if (!response.ok) {
        toast({
          title: 'Pipeline Trigger Failed',
          description: `Failed to trigger pipeline for ${repoName}. Status: ${response.status}`,
          variant: 'destructive',
        });
        return;
      }
  
      if(!triggerAll) await refreshStatuses();
  
    } catch (error) {
      toast({
        title: 'Pipeline Trigger Failed',
        description: `Failed to trigger pipeline for ${repoName}. Error: ${error}`,
        variant: 'destructive',
      });
    }

  };
  


  const triggerAllPipelines = async () => {
    if (!config) return;
    setTriggeringAll(true);
    for (const repo of config.repositories) {
      await triggerSinglePipeline(repo.name, true);
    }
    setTriggeringAll(false);
    await refreshStatuses();
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
          <p className="text-gray-600 mt-1">Monitor and manage CI pipelines for all repositories</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={refreshStatuses}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
          <Button
            onClick={triggerAllPipelines}
            disabled={triggeringAll}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{triggeringAll ? 'Triggering...' : 'Trigger All CI Pipelines'}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {config.repositories.map((repo) => (
          <Card key={repo.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg text-gray-900">{repo.name}</h3>
                      <a
                        href={repo.url.startsWith('http') ? repo.url : `${config.azureDevOps.baseUrl}${repo.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Pipeline ID: {repo.pipelineId}</p>
                      <a
                          href={`${config.azureDevOps.baseUrl}/${config.azureDevOps.organization}/${config.azureDevOps.project}/_build?definitionId=${repo.pipelineId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <a href={repo.buildUrl} target="_blank" rel="noopener noreferrer">
                    <StatusIndicator status={repo.status} showLabel />
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerSinglePipeline(repo.name, false)}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-3 h-3" />
                    <span>Trigger CI</span>
                  </Button>

                  <span className="text-xs text-gray-500">
                    Build Time: {localStorage.getItem(`${repo.name}-buildTime`) 
                      ? new Date(localStorage.getItem(`${repo.name}-buildTime`)).toLocaleString()
                      : 'Never'}
                  </span>

                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
