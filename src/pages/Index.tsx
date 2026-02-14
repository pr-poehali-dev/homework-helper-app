import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";

interface Solution {
  subject: string;
  task: string;
  steps: string[];
  answer: string;
}

interface HistoryItem {
  id: string;
  subject: string;
  preview: string;
  solution: Solution;
  timestamp: Date;
}

const subjectIcons: Record<string, string> = {
  "Математика": "Calculator",
  "Физика": "Atom",
  "Химия": "FlaskConical",
  "Русский язык": "BookOpen",
  "Биология": "Leaf",
  "География": "Globe",
  "Информатика": "Monitor",
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
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistory, setViewingHistory] = useState<Solution | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setSolution(null);
      setError(null);
      setViewingHistory(null);
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

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const resp = await fetch(funcUrls["solve-task"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Ошибка сервера");
      }

      setSolution(data);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          subject: data.subject,
          preview: data.task,
          solution: data,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewTask = () => {
    setSelectedImage(null);
    setSolution(null);
    setError(null);
    setViewingHistory(null);
  };

  const activeSolution = viewingHistory || solution;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleNewTask}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="GraduationCap" size={20} className="text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Решалка</span>
          </div>
          {(activeSolution || selectedImage) && (
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" onClick={handleNewTask}>
              <Icon name="Plus" size={16} />
              Новое задание
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {activeSolution ? (
          <section className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Icon name="CheckCircle" size={20} className="text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    {activeSolution.subject}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{activeSolution.task}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Решение по шагам
              </h3>
              <div className="space-y-2.5">
                {activeSolution.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3.5 rounded-xl bg-muted/40 animate-fade-in"
                    style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="Trophy" size={16} className="text-green-600" />
                <span className="text-sm font-semibold">Ответ</span>
              </div>
              <p className="text-base font-medium whitespace-pre-wrap">{activeSolution.answer}</p>
            </div>

            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleNewTask}>
              <Icon name="Camera" size={16} />
              Решить ещё задание
            </Button>
          </section>
        ) : (
          <section className="animate-fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Сфотографируй задание</h1>
              <p className="text-muted-foreground text-sm">Загрузи фото — получи пошаговое решение</p>
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
                    <p className="font-medium text-sm">Нажми или перетащи фото сюда</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG — до 10 МБ</p>
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
                    onClick={() => {
                      setSelectedImage(null);
                      setError(null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                    <Icon name="AlertCircle" size={16} />
                    {error}
                  </div>
                )}

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
        )}

        {history.length > 0 && !activeSolution && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">История</h2>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setHistory([])}
              >
                Очистить
              </button>
            </div>

            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/60 transition-all duration-200 cursor-pointer"
                  onClick={() => setViewingHistory(item.solution)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
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
          </section>
        )}

        {history.length === 0 && !activeSolution && !selectedImage && (
          <section className="text-center py-8">
            <Icon name="Inbox" size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Здесь появятся решённые задачи</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
