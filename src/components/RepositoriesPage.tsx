
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
  status: "success" | "failed" | "running" | "unknown";
}

interface Config {
  repositories: Repository[];
  azureDevOps: {
    baseUrl: string;
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

  const refreshStatuses = async () => {
    setIsRefreshing(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate status updates
    setConfig(prev => prev ? {
      ...prev,
      repositories: prev.repositories.map(repo => ({
        ...repo,
        status: Math.random() > 0.3 ? "success" : Math.random() > 0.5 ? "failed" : "running"
      }))
    } : prev);
    setIsRefreshing(false);
    toast({
      title: "Status Updated",
      description: "Pipeline statuses have been refreshed.",
    });
  };

  const triggerSinglePipeline = async (repoName: string) => {
    if (!config) return;
    const repoConfig = config.repositories.find(r => r.name === repoName);
    if (!repoConfig) return;
    const apiUrl = `${config.azureDevOps.baseUrl}/${repoConfig.name}/_apis/build/builds?api-version=6.0`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          definition: { id: repoConfig.pipelineId },
          sourceBranch: `refs/heads/${repoConfig.branch}`,
        }),
      });
      if (!response.ok) {
        toast({
          title: 'Pipeline Trigger Failed',
          description: `Failed to trigger pipeline for ${repoName}.`,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Pipeline Triggered',
        description: `Pipeline triggered for ${repoName} on branch ${repoConfig.branch}.`,
      });
    } catch (error) {
      toast({
        title: 'Pipeline Trigger Failed',
        description: `Failed to trigger pipeline for ${repoName}.`,
        variant: 'destructive',
      });
    }
  };

  const triggerAllPipelines = async () => {
    if (!config) return;
    for (const repo of config.repositories) {
      await triggerSinglePipeline(repo.name);
    }
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
                    <p className="text-sm text-gray-500">Pipeline ID: {repo.pipelineId}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <StatusIndicator status={repo.status} showLabel />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => triggerSinglePipeline(repo.name)}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-3 h-3" />
                    <span>Trigger CI</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
