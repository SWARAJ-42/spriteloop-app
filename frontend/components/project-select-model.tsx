"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Plus, X } from "lucide-react";

type Project = {
  id: number;
  name: string;
};

export function ProjectSelectModal({
  projects,
  onSave,
  onCreateProject,
  onClose,
}: {
  projects: Project[];
  onSave: (projectId: number) => void;
  onCreateProject: (name: string) => Promise<Project>;
  onClose: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    setLoading(true);
    try {
      const project = await onCreateProject(newProjectName.trim());
      setSelectedProject(project.id);
      setCreating(false);
      setNewProjectName("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card
        font="retro"
        className="w-full max-w-sm border-border bg-card"
      >
        <CardHeader className="px-4 pt-3 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px]">Save to Project</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">

          {/* Project list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`w-full flex items-center justify-between border px-3 py-2 transition-all text-left ${
                  selectedProject === p.id
                    ? "border-primary bg-primary/10 "
                    : "border-border bg-background/30 hover:border-primary/50"
                }`}
              >
                <span className="retro text-[8px] text-foreground">{p.name}</span>
                {selectedProject === p.id && (
                  <Badge font="retro" className="text-[6px] px-1 py-0">
                    selected
                  </Badge>
                )}
              </button>
            ))}

            {projects.length === 0 && !creating && (
              <p className="retro text-[7px] text-muted-foreground text-center py-4">
                No projects yet — create one below.
              </p>
            )}
          </div>

          {/* Create new project */}
          {creating ? (
            <div className="border border-border bg-background/30 p-3 space-y-2">
              <label className="retro text-[7px] text-muted-foreground">
                Project name
              </label>
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="My sprite animation..."
                className="retro w-full border border-border bg-background/50 px-2 py-1.5 text-[8px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  font="retro"
                  className="flex-1 text-[7px]"
                  onClick={handleCreate}
                  disabled={!newProjectName.trim() || loading}
                >
                  {loading ? "Creating..." : "Create"}
                </Button>
                <Button
                  font="retro"
                  variant="outline"
                  className="flex-1 text-[7px]"
                  onClick={() => {
                    setCreating(false);
                    setNewProjectName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border/60 bg-background/20 py-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Plus size={11} className="text-muted-foreground" />
              <span className="retro text-[7px] text-muted-foreground">New project</span>
            </button>
          )}

          {/* Footer actions */}
          <div className="flex gap-2 pt-1">
            <Button
              font="retro"
              variant="outline"
              className="flex-1 text-[7px]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              font="retro"
              className="flex-1 text-[7px]"
              disabled={selectedProject === null}
              onClick={() => selectedProject !== null && onSave(selectedProject)}
            >
              Save Animation
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
