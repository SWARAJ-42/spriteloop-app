"use client";

import { Card } from "@/components/ui/8bit/card";
import { Badge } from "@/components/ui/8bit/badge";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Project {
  id: number;
  name: string;
  images: string[];
  createdAt: Date;
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
  onOpen: (project: Project) => void;
}

export function ProjectCard({ project, onDelete, onOpen }: ProjectCardProps) {
  return (
    <Card
      onClick={() => onOpen(project)}
      className="p-4 bg-blue-900/10 hover:border-cyan-400/50 transition-all h-[300px] w-[300px] max-w-sm flex flex-col cursor-pointer"
    >

      {/* Header */}
      <div className="flex justify-between items-start">
        <h3 className="retro text-sm text-cyan-400">{project.name}</h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="p-1 hover:bg-red-900/30 rounded transition-all"
        >
          <Trash2 size={16} className="text-red-300" />
        </button>
      </div>

      {/* Image Section */}
      <div className="flex-1 flex items-center justify-center bg-gray-500/20 my-3 overflow-hidden gap-1">

        {project.images && project.images.length > 0 ? (
          project.images.slice(0, 3).map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square w-20 overflow-hidden border border-cyan-400/20"
            >
              <Image
                src={img}
                alt={`Generation ${idx}`}
                fill
                className="object-cover bg-black"
              />
            </div>
          ))
        ) : (
          <div className="text-foreground/50 retro text-xs text-center">
            No generations yet
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex flex-col justify-between items-center text-xs">

        <Badge variant="secondary" className="retro text-[10px]">
          {project.images?.length || 0} generations
        </Badge>

        <span className="retro text-[10px] text-foreground/50 mt-2">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>

      </div>
    </Card>
  );
}

export function CreateProjectCard({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      onClick={onCreate}
      className={cn(
        "w-fit max-w-sm h-[50px] aspect-square mb-4",
        "p-4 bg-blue-900/10 border-2 border-dashed border-cyan-400/50",
        "hover:border-cyan-400 hover:bg-blue-900/20",
        "transition-all cursor-pointer",
        "flex items-center justify-center"
      )}
    >
      <div className="flex items-center gap-2">
        <Plus size={32} className="text-cyan-400" />

        {/* <span className="retro text-xs text-cyan-400">
          New Project
        </span> */}
      </div>
    </div>
  );
}