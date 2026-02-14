import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface HistoryItem {
  id: string;
  imageUrl: string;
  subject: string;
  preview: string;
  timestamp: Date;
}

const DEMO_HISTORY: HistoryItem[] = [
  {
    id: "1",
    imageUrl: "",
    subject: "Математика",
    preview: "Решение квадратного уравнения x² + 5x - 6 = 0",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    imageUrl: "",
    subject: "Физика",
    preview: "Задача на второй закон Ньютона, F = ma",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    imageUrl: "",
    subject: "Химия",
    preview: "Уравнивание реакции: Fe + O₂ → Fe₂O₃",
    timestamp: new Date(Date.now() - 172800000),
  },
];

const subjectIcons: Record<string, string> = {
  "Математика": "Calculator",
  "Физика": "Atom",
  "Химия": "FlaskConical",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Вчера";
  return `${days} дн назад`;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="GraduationCap" size={20} className="text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Решалка</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Icon name="Settings" size={18} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="animate-fade-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Сфотографируй задание
            </h1>
            <p className="text-muted-foreground text-sm">
              Загрузи фото — получи пошаговое решение
            </p>
          </div>

          {!selectedImage ? (
            <div
              className={`
                relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                transition-all duration-200 group
                ${isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon name="Camera" size={26} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Нажми или перетащи фото сюда
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG — до 10 МБ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-scale-in space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img
                  src={selectedImage}
                  alt="Загруженное задание"
                  className="w-full max-h-80 object-contain bg-muted/30"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full h-12 rounded-xl text-sm font-medium"
                size="lg"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    Анализирую задание...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="Sparkles" size={18} />
                    Решить задание
                  </span>
                )}
              </Button>
            </div>
          )}
        </section>

        <section className="animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">История</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Очистить
            </button>
          </div>

          <div className="space-y-2">
            {DEMO_HISTORY.map((item, i) => (
              <div
                key={item.id}
                className="group flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/60 transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${0.15 + i * 0.05}s`, animationFillMode: "both" }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                  <Icon
                    name={subjectIcons[item.subject] || "BookOpen"}
                    size={18}
                    className="text-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-primary">{item.subject}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 truncate">{item.preview}</p>
                </div>
                <Icon
                  name="ChevronRight"
                  size={16}
                  className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
                />
              </div>
            ))}
          </div>

          {DEMO_HISTORY.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Inbox" size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Здесь появятся решённые задачи</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
