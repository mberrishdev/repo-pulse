import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GitBranch, Bot, Settings, Shield, Zap, BarChart3, Github, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const LandingPage = () => {
  const features = [
    {
      icon: GitBranch,
      title: "Repository Management",
      description: "Monitor and manage all your repositories from a single dashboard with real-time status updates.",
      color: "text-blue-500 dark:text-blue-400"
    },
    {
      icon: Bot,
      title: "Automated Renovate",
      description: "Keep dependencies up-to-date with automated pull requests from Renovate bot integration.",
      color: "text-green-500 dark:text-green-400"
    },
    {
      icon: Shield,
      title: "Security Monitoring",
      description: "Track security vulnerabilities and compliance across all your repositories.",
      color: "text-red-500 dark:text-red-400"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Get detailed insights into your repository health, activity, and dependency trends.",
      color: "text-purple-500 dark:text-purple-400"
    }
  ];

  const stats = [
    { label: "Repositories Monitored", value: "150+", icon: Github },
    { label: "Dependencies Updated", value: "2,400+", icon: Bot },
    { label: "Security Issues Resolved", value: "89%", icon: Shield },
    { label: "Time Saved", value: "40hrs/week", icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">RepoPulse</h1>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/repositories" className="text-sm font-medium hover:text-primary transition-colors">
                Repositories
              </Link>
              <Link to="/renovate" className="text-sm font-medium hover:text-primary transition-colors">
                Renovate
              </Link>
              <Link to="/settings" className="text-sm font-medium hover:text-primary transition-colors">
                Settings
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0">
            <Zap className="w-4 h-4 mr-2" />
            Repository Intelligence Platform
          </Badge>
          
          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            Streamline Your
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent"> Repository Management</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            RepoPulse provides comprehensive monitoring, automated dependency management, 
            and security insights for all your repositories in one unified dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-lg px-8 bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity">
              <Link to="/repositories">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 border-gradient-start text-gradient-start hover:bg-gradient-start hover:text-white transition-colors">
              <Link to="/settings">
                <Settings className="mr-2 w-5 h-5" />
                Configure
              </Link>
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative mx-auto max-w-4xl">
            <div className="relative bg-gradient-to-br from-card to-muted/20 rounded-2xl shadow-2xl p-8 border backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gradient-start to-transparent rounded"></div>
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gradient-end to-transparent rounded"></div>
                  <div className="h-4 bg-muted/50 rounded w-2/3"></div>
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-primary to-transparent rounded"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                  <div className="h-4 bg-muted/50 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-stats-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need for Repository Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From automated dependency updates to security monitoring, 
            RepoPulse provides all the tools you need to maintain healthy repositories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-feature-bg/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center mb-4">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gradient-start to-gradient-end text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Take Control of Your Repositories?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join teams who trust RepoPulse to manage their repository ecosystem efficiently and securely.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 bg-white text-gradient-start hover:bg-white/90 transition-colors">
            <Link to="/repositories">
              Start Monitoring Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-gradient-start to-gradient-end rounded"></div>
              <span className="font-semibold">RepoPulse</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 RepoPulse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};