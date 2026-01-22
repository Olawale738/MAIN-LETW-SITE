'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Trophy, RotateCcw, AlertCircle } from 'lucide-react'
import { Quiz, skillsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface QuizPlayerProps {
    quiz: Quiz
    onComplete: (passed: boolean) => void
}

export default function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
    const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions?.length || 0).fill(-1))
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const { showToast, ToastComponent } = useToast()

    // Debug: Log quiz data
    useEffect(() => {
        console.log('Quiz data:', quiz)
        console.log('Questions:', quiz.questions)
        console.log('Questions length:', quiz.questions?.length)
    }, [quiz])

    const handleSubmit = async () => {
        if (answers.some(a => a === -1)) {
            showToast('Please answer all questions before submitting', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const res = await skillsApi.submitQuiz(quiz.id, answers)
            setResult(res)
            setSubmitted(true)
            onComplete(res.passed)
        } catch (error) {
            console.error('Quiz submission failed:', error)
            showToast('Failed to submit quiz. Please try again.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRetry = () => {
        setAnswers(new Array(quiz.questions?.length || 0).fill(-1))
        setSubmitted(false)
        setResult(null)
    }

    if (submitted && result) {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className={cn(
                    "rounded-2xl p-8 text-center space-y-6",
                    result.passed ? "bg-green-500/10 border-2 border-green-500" : "bg-red-500/10 border-2 border-red-500"
                )}>
                    {result.passed ? (
                        <Trophy className="w-20 h-20 mx-auto text-green-500" />
                    ) : (
                        <XCircle className="w-20 h-20 mx-auto text-red-500" />
                    )}
                    <h2 className="text-3xl font-bold text-white">
                        {result.passed ? 'Congratulations!' : 'Not Quite There'}
                    </h2>
                    <p className="text-xl text-gray-300">
                        Your Score: <span className="font-bold text-white">{Math.round(result.score)}%</span>
                    </p>
                    <p className="text-gray-400">
                        {result.passed 
                            ? `You passed! (Required: ${quiz.pass_score}%)`
                            : `You need ${quiz.pass_score}% to pass. Keep learning!`
                        }
                    </p>
                    {!result.passed && (
                        <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
                            <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    // Check if quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="max-w-3xl mx-auto p-6 md:p-8">
                <ToastComponent />
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Questions Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">This quiz doesn't have any questions yet.</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <ToastComponent />
            <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-8">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl p-6 border-2 border-primary/30">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quiz.title}</h2>
                    <p className="text-gray-700 dark:text-gray-300">Pass Score: {quiz.pass_score}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{quiz.questions.length} Questions</p>
                </div>

                <div className="space-y-6">
                    {quiz.questions.map((question, qIndex) => (
                        <div key={question.id || qIndex} className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-800 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Question {qIndex + 1}: {question.question_text}
                            </h3>
                            <div className="space-y-3">
                                {question.options.map((option, oIndex) => (
                                    <button
                                        key={oIndex}
                                        onClick={() => {
                                            const newAnswers = [...answers]
                                            newAnswers[qIndex] = oIndex
                                            setAnswers(newAnswers)
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-lg border-2 transition-all",
                                            answers[qIndex] === oIndex
                                                ? "bg-accent/20 border-accent text-gray-900 dark:text-white font-semibold"
                                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                                answers[qIndex] === oIndex
                                                    ? "border-accent bg-accent"
                                                    : "border-gray-400 dark:border-gray-500"
                                            )}>
                                                {answers[qIndex] === oIndex && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            <span className="flex-1">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || answers.some(a => a === -1)}
                        size="lg"
                        className="bg-accent hover:bg-accent/90 text-primary font-bold px-12"
                    >
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                        ) : (
                            <>Submit Quiz</>
                        )}
                    </Button>
                </div>
            </div>
        </>
    )
}

