import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PdfEntry } from "../backend.d";
import { useActor } from "./useActor";

export function useListPdfs() {
  const { actor, isFetching } = useActor();
  return useQuery<PdfEntry[]>({
    queryKey: ["pdfs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPdfs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPdf() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      title,
      description,
      blobId,
    }: {
      token: string;
      title: string;
      description: string;
      blobId: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addPdf(token, title, description, blobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfs"] });
    },
  });
}

export function useDeletePdf() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, id }: { token: string; id: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deletePdf(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfs"] });
    },
  });
}
