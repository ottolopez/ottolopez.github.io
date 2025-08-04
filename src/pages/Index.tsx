import { DirectoryCard } from "@/components/DirectoryCard";

const directories = [
  {
    name: "Pardot",
    path: "/pardot/"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Directory</h1>
          <p className="text-muted-foreground">Select a folder to navigate</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {directories.map((directory) => (
            <DirectoryCard
              key={directory.path}
              name={directory.name}
              path={directory.path}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
