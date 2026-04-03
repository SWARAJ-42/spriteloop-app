"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import {
  fetchProjects,
  createProject,
  deleteProject,
} from "@/lib/api-projects";
import { onAuthStateChanged } from "firebase/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ProjectCard, CreateProjectCard } from "@/components/project-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/8bit/dialog";
import { Input } from "@/components/ui/8bit/input";
import { Button } from "@/components/ui/8bit/button";
import { fetchProjectGenerations } from "@/lib/api-generate";
import { deleteGenerations } from "@/lib/api-generate";
import CreditCounter from "@/components/credit-counter";

interface Project {
  id: number;
  name: string;
  images: string[];
  createdAt: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [generations, setGenerations] = useState<any[]>([]);

  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMdScreen, setIsMdScreen] = useState(false);
  
  // Track screen size for responsive sidebar margin
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsMdScreen(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMdScreen(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleGeneration = (id: number) => {
    setSelectedGenerations((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleDeleteGenerations = async () => {
    if (selectedGenerations.length === 0) return;

    await deleteGenerations({
      generation_ids: selectedGenerations,
    });

    setGenerations(
      generations.filter((g) => !selectedGenerations.includes(g.generation_id)),
    );

    setSelectedGenerations([]);
  };

  const openProject = async (project: Project) => {
    setSelectedProject(project);
    const res = await fetchProjectGenerations(project.id);
    if (res.success) {
      setGenerations(res.generations);
    }
  };

  // Auth protection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Loading projects
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadProjects = async () => {
      const data = await fetchProjects();
      setProjects(data);
    };
    loadProjects();
  }, [isAuthenticated]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    const project = await createProject(projectName);
    setProjects([...projects, project]);
    setProjectName("");
    setCreateDialogOpen(false);
  };

  const handleDeleteProject = async (id: number) => {
    await deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex w-screen h-screen bg-background items-center justify-center">
        <div className="retro text-sm text-cyan-400 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

return (
    <div className="relative min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <DashboardSidebar onCollapseChange={setSidebarCollapsed} />

      <CreditCounter />

      {/* Main Content - takes remaining space */}
      {/* On mobile (<md): always use 80px margin (sidebar overlays when expanded) */}
      {/* On desktop (md+): margin adjusts based on sidebar state */}
      <div 
        className="relative min-h-screen transition-[margin] duration-300 ease-in-out"
        style={{ 
          marginLeft: isMdScreen 
            ? (sidebarCollapsed ? '80px' : '350px') 
            : '80px'
        }}
      >
        <div className="p-8">
          <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="retro text-3xl text-cyan-400  mb-2">
                  Your Projects
                </h1>
                <p className="retro text-sm text-foreground/70">
                  Manage your generations
                </p>
              </div>
            </div>

            {/* Projects Grid */}
            <CreateProjectCard onCreate={() => setCreateDialogOpen(true)} />
            <div className="flex flex-wrap">
              {projects.map((project) => (
                <div key={project.id} className="my-1 mx-2">
                  <ProjectCard
                    project={project}
                    onDelete={handleDeleteProject}
                    onOpen={openProject}
                  />
                </div>
              ))}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="retro text-lg text-foreground/50 mb-4">
                  No projects yet
                </div>
                <p className="retro text-xs text-foreground/40">
                  Create your first project to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-blue-900/10 backdrop-blur-xl rounded-none border-2 border-b-4 border-r-4 border-black/80">
          <DialogHeader>
            <DialogTitle className="retro text-sm text-cyan-400">
              Create New Project
            </DialogTitle>
            <DialogDescription className="retro text-xs text-foreground/70">
              Enter a name for your new project
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateProject();
              }}
              className="retro text-xs bg-black/30 placeholder:text-foreground/40 rounded-none"
            />
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
              className="bg-red-500 hover:bg-red-600"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProject}
              className="mx-4 bg-green-500 hover:bg-green-600"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Generations Dialog */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={() => setSelectedProject(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl bg-blue-900/10 backdrop-blur-xl rounded-none border-2 border-b-4 border-r-4 border-black/80">
          <DialogHeader>
            <DialogTitle className="retro text-sm text-cyan-400">
              {selectedProject?.name} Generations
            </DialogTitle>
            <DialogDescription className="retro text-xs text-foreground/70">
              Download generated animations
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden pr-4">
            {selectedGenerations.length > 0 && (
              <Button
                onClick={handleDeleteGenerations}
                className="mb-3 bg-red-600 hover:bg-red-700 text-[10px]"
              >
                Delete Selected ({selectedGenerations.length})
              </Button>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
              {generations.map((gen) => {
                const selected = selectedGenerations.includes(
                  gen.generation_id,
                );

                return (
                  <div
                    key={gen.generation_id}
                    onClick={() => toggleGeneration(gen.generation_id)}
                    className={`flex flex-col items-center gap-3 p-3 cursor-pointer
      border-2 border-b-4 border-r-4 border-black/80
      ${selected ? "bg-red-900/40" : "bg-background/40"}`}
                  >
                    <div className="w-full aspect-square flex items-center justify-center bg-black/30 border border-cyan-900/50 overflow-hidden">
                      <img
                        src={gen.gif_url}
                        alt="Generated sprite"
                        className="pixelated max-w-full max-h-full object-contain rounded-2xl"
                      />
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/generation-edit?gif=${encodeURIComponent(gen.gif_url)}&project=${selectedProject?.id}`,
                        );
                      }}
                      className="w-full bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 border-yellow-900 h-7 px-2 text-[10px]"
                    >
                      Edit
                    </Button>
                  </div>
                );
              })}

              {generations.length === 0 && (
                <div className="retro text-xs text-foreground/40 col-span-full py-8 text-center">
                  No generations yet
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
