
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Config {
  azureDevOps: {
    organization: string;
    project: string;
    personalAccessToken: string;
    baseUrl: string;
  };
  repositories: Array<{
    name: string;
    url: string;
    pipelineId: string;
    branch: string;
  }>;
  renovate: {
    enabled: boolean;
    botName: string;
    autoMerge: boolean;
  };
}

export const SettingsPage = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<Config | null>(null);

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

  const copyToClipboard = () => {
    if (config) {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      toast({
        title: "Copied to Clipboard",
        description: "Configuration has been copied to clipboard.",
      });
    }
  };

  const downloadConfig = (customConfig?: Config) => {
    const cfg = customConfig || config;
    if (cfg) {
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
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
    }
  };

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  // Handlers for editing
  const handleEditField = (section: string, field: string, value: string | boolean) => {
    if (!editConfig) return;
    if (section === "azureDevOps") {
      setEditConfig({
        ...editConfig,
        azureDevOps: { ...editConfig.azureDevOps, [field]: value },
      });
    } else if (section === "renovate") {
      setEditConfig({
        ...editConfig,
        renovate: { ...editConfig.renovate, [field]: value },
      });
    }
  };

  const handleRepoField = (index: number, field: string, value: string) => {
    if (!editConfig) return;
    const newRepos = editConfig.repositories.map((repo, i) =>
      i === index ? { ...repo, [field]: value } : repo
    );
    setEditConfig({ ...editConfig, repositories: newRepos });
  };

  const handleAddRepo = () => {
    if (!editConfig) return;
    setEditConfig({
      ...editConfig,
      repositories: [
        ...editConfig.repositories,
        { name: "", url: "", pipelineId: "", branch: "" },
      ],
    });
  };

  const handleRemoveRepo = (index: number) => {
    if (!editConfig) return;
    setEditConfig({
      ...editConfig,
      repositories: editConfig.repositories.filter((_, i) => i !== index),
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
          <Button variant="outline" onClick={() => downloadConfig()} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditConfig(config); setEditOpen(true); }}>
            <Edit className="w-4 h-4" />
            <span>Edit Config</span>
          </Button>
        </div>
      </div>

      {/* Modal for editing config as a form */}
      {editOpen && editConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-2">Edit Configuration</h2>
            <div className="space-y-4">
              {/* Azure DevOps Section */}
              <div>
                <h3 className="font-semibold mb-2">Azure DevOps</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Organization</label>
                    <input className="w-full border rounded p-1 text-sm" value={editConfig.azureDevOps.organization} onChange={e => handleEditField("azureDevOps", "organization", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Project</label>
                    <input className="w-full border rounded p-1 text-sm" value={editConfig.azureDevOps.project} onChange={e => handleEditField("azureDevOps", "project", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Personal Access Token</label>
                    <input className="w-full border rounded p-1 text-sm" value={editConfig.azureDevOps.personalAccessToken} onChange={e => handleEditField("azureDevOps", "personalAccessToken", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Base URL</label>
                    <input className="w-full border rounded p-1 text-sm" value={editConfig.azureDevOps.baseUrl} onChange={e => handleEditField("azureDevOps", "baseUrl", e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Repositories Section */}
              <div>
                <h3 className="font-semibold mb-2">Repositories</h3>
                {editConfig.repositories.map((repo, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2 bg-gray-50">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Name</label>
                        <input className="w-full border rounded p-1 text-xs" value={repo.name} onChange={e => handleRepoField(idx, "name", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">URL</label>
                        <input className="w-full border rounded p-1 text-xs" value={repo.url} onChange={e => handleRepoField(idx, "url", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Pipeline ID</label>
                        <input className="w-full border rounded p-1 text-xs" value={repo.pipelineId} onChange={e => handleRepoField(idx, "pipelineId", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Branch</label>
                        <input className="w-full border rounded p-1 text-xs" value={repo.branch} onChange={e => handleRepoField(idx, "branch", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-end mt-1">
                      <Button variant="outline" size="sm" onClick={() => handleRemoveRepo(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddRepo}>Add Repository</Button>
              </div>
              {/* Renovate Section */}
              <div>
                <h3 className="font-semibold mb-2">Renovate</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Bot Name</label>
                    <input className="w-full border rounded p-1 text-sm" value={editConfig.renovate.botName} onChange={e => handleEditField("renovate", "botName", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Auto Merge</label>
                    <select className="w-full border rounded p-1 text-sm" value={editConfig.renovate.autoMerge ? "true" : "false"} onChange={e => handleEditField("renovate", "autoMerge", e.target.value === "true") }>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setConfig(editConfig);
                  setEditOpen(false);
                  downloadConfig(editConfig);
                  toast({ title: "Config Updated", description: "Configuration updated and downloaded." });
                }}
              >
                Save & Download
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-gray-600 text-sm break-all">{repo.url.startsWith('http') ? repo.url : `${config.azureDevOps.baseUrl}${repo.url}`}</p>
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
