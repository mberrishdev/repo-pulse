import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Config {
  azureDevOps: {
    organization: string;
    personalAccessToken: string;
    baseUrl: string;
  };
  repositories: Array<{
    name: string;
    project: string;
    url: string;
    pipelineId: string;
    branch: string;
    status?: string | null;
    buildUrl?: string | null;
  }>;
  renovate: {
    enabled: boolean;
    botName: string;
  };
}

export type { Config };
export const SettingsPage = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<Config | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditField = (
    section: string,
    field: string,
    value: string | boolean
  ) => {
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
        {
          name: "",
          project: "",
          url: "",
          pipelineId: "",
          branch: "",
        },
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

  // Only load config from localStorage
  useEffect(() => {
    const localConfig = localStorage.getItem("repopulse-config");
    if (localConfig) {
      setConfig(JSON.parse(localConfig));
    } else {
      setConfig(null);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (config) {
      localStorage.setItem("repopulse-config", JSON.stringify(config));
    }
  }, [config]);

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
      const blob = new Blob([JSON.stringify(cfg, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "config.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Config Downloaded",
        description: "Configuration file has been downloaded.",
      });
    }
  };

  const handleConfigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setConfig(parsed);
        toast({
          title: "Config Uploaded",
          description: "Configuration loaded and saved to your browser.",
        });
      } catch {
        toast({
          title: "Invalid Config",
          description: "Could not parse config.json.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // If no config, show import/create prompt and block rest of app
  if (!config) {
    // Sample config object
    const sampleConfig: Config = {
      azureDevOps: {
        organization: "your-org",
        personalAccessToken: "your-pat-token",
        baseUrl: "https://dev.azure.com/your-org",
      },
      repositories: [
        {
          name: "example-repo",
          project: "your-project",
          url: "/your-project/_git/example-repo",
          pipelineId: "1",
          branch: "main",
        },
      ],
      renovate: {
        enabled: true,
        botName: "Renovate bot name or bot user id",
      },
    };

    const downloadSampleConfig = () => {
      const blob = new Blob([JSON.stringify(sampleConfig, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-config.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Sample Config Downloaded",
        description: "Sample configuration file has been downloaded.",
      });
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          No configuration found
        </h2>
        <p className="mb-4 text-muted-foreground">
          Your configuration is empty. Please import a <code>config.json</code>{" "}
          or create a new one to get started.
        </p>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={handleConfigUpload}
          className="mb-4"
          style={{ display: "none" }}
        />
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Import config.json
          </Button>
          <Button
            onClick={() => {
              setEditConfig({
                azureDevOps: {
                  organization: "",
                  personalAccessToken: "",
                  baseUrl: "",
                },
                repositories: [],
                renovate: { enabled: true, botName: "" },
              });
              setEditOpen(true);
            }}
          >
            Create New Config
          </Button>
          <Button variant="outline" onClick={downloadSampleConfig}>
            Download Sample config.json
          </Button>
        </div>
        {/* Modal for creating new config */}
        {editOpen && editConfig && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-lg font-bold mb-2 text-foreground">
                Create Configuration
              </h2>
              {/* ... reuse the form UI for editing config ... */}
              <div className="space-y-4">
                {/* Azure DevOps Section */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">
                    Azure DevOps
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Base URL
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm text-foreground"
                        value={editConfig.azureDevOps.baseUrl}
                        onChange={(e) =>
                          handleEditField(
                            "azureDevOps",
                            "baseUrl",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Organization
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm text-foreground"
                        value={editConfig.azureDevOps.organization}
                        onChange={(e) =>
                          handleEditField(
                            "azureDevOps",
                            "organization",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Personal Access Token
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm text-foreground"
                        value={editConfig.azureDevOps.personalAccessToken}
                        onChange={(e) =>
                          handleEditField(
                            "azureDevOps",
                            "personalAccessToken",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
                {/* Repositories Section */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">
                    Repositories
                  </h3>
                  {editConfig.repositories.map((repo, idx) => (
                    <div key={idx} className="border rounded p-2 mb-2 bg-muted">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Name
                          </label>
                          <input
                            className="w-full border rounded p-1 text-xs text-foreground"
                            value={repo.name}
                            onChange={(e) =>
                              handleRepoField(idx, "name", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Project
                          </label>
                          <input
                            className="w-full border rounded p-1 text-xs text-foreground"
                            value={repo.project}
                            onChange={(e) =>
                              handleRepoField(idx, "project", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Repo Path
                          </label>
                          <input
                            className="w-full border rounded p-1 text-xs text-foreground"
                            value={repo.url}
                            onChange={(e) =>
                              handleRepoField(idx, "url", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Pipeline ID
                          </label>
                          <input
                            className="w-full border rounded p-1 text-xs text-foreground"
                            value={repo.pipelineId}
                            onChange={(e) =>
                              handleRepoField(idx, "pipelineId", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Main Branch
                          </label>
                          <input
                            className="w-full border rounded p-1 text-xs text-foreground"
                            value={repo.branch}
                            onChange={(e) =>
                              handleRepoField(idx, "branch", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRepo(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddRepo}>
                    Add Repository
                  </Button>
                </div>
                {/* Renovate Section */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">
                    Renovate
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Enabled
                      </label>
                      <input
                        type="checkbox"
                        checked={editConfig.renovate.enabled}
                        onChange={(e) =>
                          handleEditField(
                            "renovate",
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Bot Name
                      </label>
                      <input
                        className="w-full border rounded p-1 text-sm text-foreground"
                        value={editConfig.renovate.botName}
                        onChange={(e) =>
                          handleEditField("renovate", "botName", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setConfig(editConfig);
                    setEditOpen(false);
                    toast({
                      title: "Config Created",
                      description: "Configuration created and saved.",
                    });
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage RepoPulse configuration
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadConfig()}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
            onClick={() => {
              setEditConfig(config);
              setEditOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
            <span>Edit Config</span>
          </Button>
        </div>
      </div>

      {/* Modal for editing config as a form */}
      {editOpen && editConfig && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-2 text-foreground">
              Edit Configuration
            </h2>
            <div className="space-y-4">
              {/* Azure DevOps Section */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  Azure DevOps
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Base URL
                    </label>
                    <input
                      className="w-full border rounded p-1 text-sm text-foreground"
                      value={editConfig.azureDevOps.baseUrl}
                      onChange={(e) =>
                        handleEditField(
                          "azureDevOps",
                          "baseUrl",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Organization
                    </label>
                    <input
                      className="w-full border rounded p-1 text-sm text-foreground"
                      value={editConfig.azureDevOps.organization}
                      onChange={(e) =>
                        handleEditField(
                          "azureDevOps",
                          "organization",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Personal Access Token
                    </label>
                    <input
                      className="w-full border rounded p-1 text-sm text-foreground"
                      value={editConfig.azureDevOps.personalAccessToken}
                      onChange={(e) =>
                        handleEditField(
                          "azureDevOps",
                          "personalAccessToken",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Repositories Section */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  Repositories
                </h3>
                {editConfig.repositories.map((repo, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2 bg-muted">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Name
                        </label>
                        <input
                          className="w-full border rounded p-1 text-xs text-foreground"
                          value={repo.name}
                          onChange={(e) =>
                            handleRepoField(idx, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Project
                        </label>
                        <input
                          className="w-full border rounded p-1 text-xs text-foreground"
                          value={repo.project}
                          onChange={(e) =>
                            handleRepoField(idx, "project", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Repo Path
                        </label>
                        <input
                          className="w-full border rounded p-1 text-xs text-foreground"
                          value={repo.url}
                          onChange={(e) =>
                            handleRepoField(idx, "url", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Pipeline ID
                        </label>
                        <input
                          className="w-full border rounded p-1 text-xs text-foreground"
                          value={repo.pipelineId}
                          onChange={(e) =>
                            handleRepoField(idx, "pipelineId", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Main Branch
                        </label>
                        <input
                          className="w-full border rounded p-1 text-xs text-foreground"
                          value={repo.branch}
                          onChange={(e) =>
                            handleRepoField(idx, "branch", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRepo(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddRepo}>
                  Add Repository
                </Button>
              </div>
              {/* Renovate Section */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Renovate</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mr-2">
                      Enabled
                    </label>
                    <input
                      type="checkbox"
                      checked={editConfig.renovate.enabled}
                      onChange={(e) =>
                        handleEditField("renovate", "enabled", e.target.checked)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Bot Name
                    </label>
                    <input
                      className="w-full border rounded p-1 text-sm text-foreground"
                      value={editConfig.renovate.botName}
                      onChange={(e) =>
                        handleEditField("renovate", "botName", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setConfig(editConfig);
                  setEditOpen(false);
                }}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setConfig(editConfig);
                  setEditOpen(false);
                  downloadConfig(editConfig);
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
        <Card className="w-full">
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <span>Azure DevOps Configuration</span>
              <Badge variant="outline">Connected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Base Url
                </label>
                <p className="text-foreground">
                  {config.azureDevOps.baseUrl}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Organization
                </label>
                <p className="text-foreground">
                  {config.azureDevOps.organization}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Personal Access Token
                </label>
                <p className="text-foreground text-wrap break-all">
                  {config.azureDevOps.personalAccessToken}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repositories Configuration */}
        <Card className="w-full">
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="text-lg sm:text-xl">
              Repositories ({config.repositories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="space-y-4">
              {config.repositories.map((repo, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-2 sm:p-4 bg-muted"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 gap-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Name
                      </label>
                      <p className="text-foreground font-mono text-sm">
                        {repo.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Project
                      </label>
                      <p className="text-foreground font-mono text-sm">
                        {repo.project}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Pipeline ID
                      </label>
                      <p className="text-foreground">{repo.pipelineId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Branch
                      </label>
                      <p className="text-foreground">{repo.branch}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      URL
                    </label>
                    <p className="text-muted-foreground text-sm break-all">
                      {repo.url.startsWith("http")
                        ? repo.url
                        : `${config.azureDevOps.baseUrl}${repo.url}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Renovate Configuration */}
        <Card className="w-full">
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Enabled
                </label>
                <p className="text-foreground">
                  {config.renovate.enabled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Bot Name
                </label>
                <p className="text-foreground">{config.renovate.botName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON Configuration */}
        <Card className="w-full">
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="text-lg sm:text-xl">
              Raw Configuration (config.json)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="overflow-x-auto">
              <pre className="bg-muted p-2 sm:p-4 rounded-lg text-xs sm:text-sm border min-w-[300px]">
                <code>{JSON.stringify(config, null, 2)}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
