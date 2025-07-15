
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeringAll, setTriggeringAll] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        const config: Config = await response.json();
        setRepositories(config.repositories);
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
    setRepositories(prev => prev.map(repo => ({
      ...repo,
      status: Math.random() > 0.3 ? "success" : Math.random() > 0.5 ? "failed" : "running"
    })));
    
    setIsRefreshing(false);
    toast({
      title: "Status Updated",
      description: "Pipeline statuses have been refreshed.",
    });
  };

  const triggerAllPipelines = async () => {
    setTriggeringAll(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setRepositories(prev => prev.map(repo => ({ ...repo, status: "running" })));
    setTriggeringAll(false);
    
    toast({
      title: "Pipelines Triggered",
      description: "All CI pipelines have been triggered successfully.",
    });
  };

  const triggerSinglePipeline = async (repoName: string) => {
    setRepositories(prev => prev.map(repo => 
      repo.name === repoName ? { ...repo, status: "running" } : repo
    ));
    
    toast({
      title: "Pipeline Triggered",
      description: `CI pipeline for ${repoName} has been triggered.`,
    });
  };

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
        {repositories.map((repo) => (
          <Card key={repo.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg text-gray-900">{repo.name}</h3>
                      <a 
                        href={repo.url} 
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
