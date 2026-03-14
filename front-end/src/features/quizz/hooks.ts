import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateQuizApi,
  extractTextApi,
  getQuizSetsApi,
  deleteQuizSetApi,
} from "./api";
import type {
  GenerateQuizResponse,
  ExtractTextResponse,
  GenerateQuizOptions,
  ExtractTextOptions,
} from "./api";
import type { QuizConfig, QuizSetSummary } from "./types";

interface GenerateQuizInput {
  options: GenerateQuizOptions;
  config: QuizConfig;
}

/**
 * Hook to generate quiz from any input source (files / youtube / text)
 */
export function useGenerateQuiz() {
  return useMutation<GenerateQuizResponse, Error, GenerateQuizInput>({
    mutationFn: ({ options, config }) => generateQuizApi(options, config),
    onError: (error: Error) => {
      console.error("Quiz generation failed:", error.message);
    },
  });
}

/**
 * Hook to extract text preview from any input source
 */
export function useExtractText() {
  return useMutation<ExtractTextResponse, Error, ExtractTextOptions>({
    mutationFn: (opts) => extractTextApi(opts),
    onError: (error: Error) => {
      console.error("Text extraction failed:", error.message);
    },
  });
}

/**
 * Hook to list quiz sets for a folder (or all quiz sets)
 */
export function useQuizSets(folderId?: string) {
  return useQuery<QuizSetSummary[], Error>({
    queryKey: ["quizSets", folderId ?? "all"],
    queryFn: () => getQuizSetsApi(folderId),
  });
}

/**
 * Hook to delete a quiz set; auto-invalidates the list
 */
export function useDeleteQuizSet() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteQuizSetApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizSets"] });
    },
  });
}
