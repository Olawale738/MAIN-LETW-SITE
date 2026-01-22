import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { QuizCreate, QuizQuestion } from '@/lib/api';

interface QuizCreationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: QuizCreate) => Promise<void>;
    moduleId: string;
}

export default function QuizCreationDialog({ isOpen, onClose, onSubmit, moduleId }: QuizCreationDialogProps) {
    const [title, setTitle] = useState('');
    const [passScore, setPassScore] = useState(70);
    const [questions, setQuestions] = useState<QuizQuestion[]>([
        { question_text: '', options: ['', ''], correct_option_index: 0 }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { question_text: '', options: ['', ''], correct_option_index: 0 }
        ]);
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestionText = (index: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[index].question_text = text;
        setQuestions(newQuestions);
    };

    const handleAddOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push('');
        setQuestions(newQuestions);
    };

    const handleRemoveOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.splice(oIndex, 1);
        // Adjust correct_option_index if necessary
        if (newQuestions[qIndex].correct_option_index >= oIndex && newQuestions[qIndex].correct_option_index > 0) {
            newQuestions[qIndex].correct_option_index -= 1;
        }
        setQuestions(newQuestions);
    };

    const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = text;
        setQuestions(newQuestions);
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correct_option_index = oIndex;
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        // Basic validation
        if (!title) return;
        if (questions.some(q => !q.question_text || q.options.some(o => !o))) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                title,
                pass_score: passScore,
                questions
            });
            onClose();
            // Reset form
            setTitle('');
            setPassScore(70);
            setQuestions([{ question_text: '', options: ['', ''], correct_option_index: 0 }]);
        } catch (error) {
            console.error('Failed to create quiz:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Quiz</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quiz-title">Quiz Title</Label>
                            <Input
                                id="quiz-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Module 1 Assessment"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pass-score">Pass Score (%)</Label>
                            <Input
                                id="pass-score"
                                type="number"
                                min="0"
                                max="100"
                                value={passScore}
                                onChange={(e) => setPassScore(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Questions</h3>
                            <Button onClick={handleAddQuestion} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Add Question
                            </Button>
                        </div>

                        {questions.map((question, qIndex) => (
                            <div key={qIndex} className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 grid gap-2">
                                        <Label>Question {qIndex + 1}</Label>
                                        <Input
                                            value={question.question_text}
                                            onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                            placeholder="Enter question text"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        disabled={questions.length === 1}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900">
                                    <Label className="text-xs text-muted-foreground">Options (Select correct answer)</Label>
                                    {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCorrectOption(qIndex, oIndex)}
                                                className={`flex-shrink-0 ${question.correct_option_index === oIndex ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'
                                                    }`}
                                            >
                                                {question.correct_option_index === oIndex ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <Circle className="w-5 h-5" />
                                                )}
                                            </button>
                                            <Input
                                                value={option}
                                                onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                                                placeholder={`Option ${oIndex + 1}`}
                                                className="flex-1 h-9"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                disabled={question.options.length <= 2}
                                                className="h-8 w-8"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddOption(qIndex)}
                                        className="mt-2 text-xs"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Option
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Quiz'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 18 18" />
        </svg>
    )
}
