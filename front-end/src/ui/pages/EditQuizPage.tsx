import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";

import { getQuizSetApi } from "@/features/quizz/api";
import { useUpdateQuizSet } from "@/features/quizz/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuizQuestion } from "@/features/quizz/types";

export function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: quizSet, isLoading, error } = useQuery({
    queryKey: ["quizSet", id],
    queryFn: () => getQuizSetApi(id!),
    enabled: !!id,
  });

  const updateQuizSet = useUpdateQuizSet();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (quizSet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(quizSet.title || "");
      setQuestions(quizSet.questions ? JSON.parse(JSON.stringify(quizSet.questions)) : []);
    }
  }, [quizSet]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quizSet) {
    return (
      <div className="flex flex-1 items-center justify-center text-destructive">
        Failed to load quiz set.
      </div>
    );
  }

  const handleSave = () => {
    updateQuizSet.mutate(
      { id: id!, payload: { title, questions } },
      {
        onSuccess: () => {
          toast.success("Quiz updated successfully");
          navigate(`/folder/${quizSet.folderId}`);
        },
        onError: (err) => {
          toast.error("Failed to update quiz", { description: err.message });
        }
      }
    );
  };

  const updateQuestion = <K extends keyof QuizQuestion>(index: number, field: K, value: QuizQuestion[K]) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [field]: value };
    setQuestions(newQs);
  };

  const updateOption = (qIndex: number, optIndex: number, text: string) => {
    const newQs = [...questions];
    const newOpts = [...newQs[qIndex].options];
    newOpts[optIndex] = { ...newOpts[optIndex], text };
    newQs[qIndex].options = newOpts;
    setQuestions(newQs);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    const newId = `opt_${Date.now()}`;
    newQs[qIndex].options.push({ id: newId, text: "" });
    setQuestions(newQs);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.splice(optIndex, 1);
    setQuestions(newQs);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `new_${Date.now()}`,
        questionNumber: questions.length + 1,
        type: "multiple-choice",
        questionText: "",
        options: [
          { id: "a", text: "Option A" },
          { id: "b", text: "Option B" }
        ],
        correctAnswerId: "a",
        explanation: "",
      } as QuizQuestion
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-6 p-6 overflow-y-auto">
      <div className="sticky top-0 z-50 flex items-center justify-between shrink-0 rounded-lg bg-background/80 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border border-border/50 shadow-sm -mx-2 -mt-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 px-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Edit Quiz</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateQuizSet.isPending}
          className="gap-2"
        >
          {updateQuizSet.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Changes
        </Button>
      </div>

      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Quiz title" 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
        <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
          <Plus className="size-4" /> Add Question
        </Button>
      </div>

      <div className="space-y-6 pb-12">
        {questions.map((q, qIndex) => (
          <Card key={q.id || qIndex}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {qIndex + 1}
                </span>
                <Select
                  value={q.type}
                  onValueChange={(val) => updateQuestion(qIndex, "type", val as QuizQuestion["type"])}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Question Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="multiple-answer">Multiple Answer</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(qIndex)}>
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label>Question Text</Label>
                <Textarea 
                  value={q.questionText} 
                  onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)} 
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Options & Correct Answer</Label>
                  {q.type !== "true-false" && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => addOption(qIndex)}>
                      <Plus className="size-3 mr-1" /> Add Option
                    </Button>
                  )}
                </div>
                
                {q.type === "true-false" && q.options.length !== 2 && (
                   <span className="text-xs text-destructive">True/False must have exactly 2 options.</span>
                )}

                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input 
                        type={q.type === "multiple-answer" ? "checkbox" : "radio"}
                        name={`correct_${q.id}`}
                        checked={q.type === "multiple-answer" 
                          ? (q.correctAnswerIds?.includes(opt.id) || false)
                          : q.correctAnswerId === opt.id
                        }
                        onChange={(e) => {
                          if (q.type === "multiple-answer") {
                            const current = q.correctAnswerIds || [];
                            const next = e.target.checked 
                              ? [...current, opt.id] 
                              : current.filter(id => id !== opt.id);
                            updateQuestion(qIndex, "correctAnswerIds", next);
                          } else {
                            updateQuestion(qIndex, "correctAnswerId", opt.id);
                          }
                        }}
                        className="size-4 cursor-pointer"
                      />
                      <Input 
                        value={opt.text} 
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)} 
                        className="h-8 flex-1"
                        placeholder="Option text..."
                      />
                      {q.type !== "true-false" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeOption(qIndex, optIndex)}>
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border-t pt-4">
                <Label className="text-muted-foreground">Explanation (Optional)</Label>
                <Textarea 
                  value={q.explanation || ""} 
                  onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)} 
                  rows={1}
                  className="resize-none text-sm"
                  placeholder="Explain why the answer is correct..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
            No questions yet.
          </div>
        )}
      </div>
    </div>
  );
}
