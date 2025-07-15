
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const mockConfig = {
  azureDevOps: {
    organization: "myorg",
    project: "myproject",
    personalAccessToken: "***hidden***"
  },
  repositories: [
    {
      name: "frontend-app",
      url: "https://dev.azure.com/myorg/myproject/_git/frontend-app",
      pipelineId: "123",
      branch: "main"
    },
    {
      name: "backend-api", 
      url: "https://dev.azure.com/myorg/myproject/_git/backend-api",
      pipelineId: "124",
      branch: "main"
    },
    {
      name: "shared-components",
      url: "https://dev.azure.com/myorg/myproject/_git/shared-components", 
      pipelineId: "125",
      branch: "main"
    },
    {
      name: "data-pipeline",
      url: "https://dev.azure.com/myorg/myproject/_git/data-pipeline",
      pipelineId: "126", 
      branch: "main"
    },
    {
      name: "auth-service",
      url: "https://dev.azure.com/myorg/myproject/_git/auth-service",
      pipelineId: "127",
      branch: "main"
    }
  ],
  renovate: {
    enabled: true,
    botName: "renovate[bot]",
    autoMerge: false
  }
};

export const SettingsPage = () => {
  const [config] = useState(mockConfig);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast({
      title: "Copied to Clipboard",
      description: "Configuration has been copied to clipboard.",
    });
  };

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Config Downloaded",
      description: "Configuration file has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">View and manage RepoPulse configuration</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={copyToClipboard} className="flex items-center space-x-2">
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </Button>
          <Button variant="outline" onClick={downloadConfig} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4" />
            <span>Edit Config</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Azure DevOps Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Azure DevOps Configuration</span>
              <Badge variant="outline">Connected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Organization</label>
                <p className="text-gray-900">{config.azureDevOps.organization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project</label>
                <p className="text-gray-900">{config.azureDevOps.project}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Personal Access Token</label>
                <p className="text-gray-900">{config.azureDevOps.personalAccessToken}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repositories Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Repositories ({config.repositories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {config.repositories.map((repo, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900 font-mono text-sm">{repo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pipeline ID</label>
                      <p className="text-gray-900">{repo.pipelineId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Branch</label>
                      <p className="text-gray-900">{repo.branch}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-700">URL</label>
                    <p className="text-gray-600 text-sm break-all">{repo.url}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Renovate Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Renovate Configuration</span>
              <Badge variant={config.renovate.enabled ? "default" : "secondary"}>
                {config.renovate.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bot Name</label>
                <p className="text-gray-900">{config.renovate.botName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Merge</label>
                <p className="text-gray-900">{config.renovate.autoMerge ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Configuration (config.json)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border">
              <code>{JSON.stringify(config, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
