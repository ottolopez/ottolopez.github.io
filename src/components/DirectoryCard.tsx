import { Folder } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DirectoryCardProps {
  name: string;
  path: string;
}

export const DirectoryCard = ({ name, path }: DirectoryCardProps) => {
  const handleClick = () => {
    window.location.href = path;
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border-directory-border hover:bg-directory-hover"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 p-6">
        <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
          <Folder className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{path}</p>
        </div>
      </div>
    </Card>
  );
};