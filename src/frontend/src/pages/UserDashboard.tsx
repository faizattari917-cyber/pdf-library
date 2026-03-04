import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  LogOut,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PdfEntry } from "../backend.d";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useListPdfs } from "../hooks/useQueries";
import { StorageClient } from "../utils/StorageClient";

interface UserDashboardProps {
  name: string;
  onLogout: () => void;
}

const SENTINEL = "!caf!";

async function getBlobUrl(blobId: string): Promise<string> {
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
  const hash = blobId.startsWith(SENTINEL)
    ? blobId.substring(SENTINEL.length)
    : blobId;
  const directUrl = await storageClient.getDirectURL(hash);
  // Fetch the raw bytes and re-wrap as application/pdf so the browser
  // renders it inline regardless of the stored Content-Type.
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF: ${response.status} ${response.statusText}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

function formatDate(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PdfCard({
  pdf,
  index,
  onClick,
}: {
  pdf: PdfEntry;
  index: number;
  onClick: (pdf: PdfEntry) => void;
}) {
  return (
    <motion.button
      data-ocid={`user.pdf.item.${index}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick(pdf)}
      className="w-full text-left pdf-card-glow bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0 mt-1" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 leading-snug">
          {pdf.title}
        </h3>
        {pdf.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {pdf.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(pdf.uploadedAt)}</span>
      </div>
    </motion.button>
  );
}

function PdfViewer({
  pdf,
  open,
  onClose,
}: {
  pdf: PdfEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !pdf) {
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setUrlError(null);
      return;
    }
    let cancelled = false;
    setLoadingUrl(true);
    setUrlError(null);
    getBlobUrl(pdf.blobId)
      .then((resolvedUrl) => {
        if (!cancelled) {
          setUrl(resolvedUrl);
          setLoadingUrl(false);
        } else {
          URL.revokeObjectURL(resolvedUrl);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUrlError(
            err instanceof Error ? err.message : "Failed to load PDF",
          );
          setLoadingUrl(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, pdf]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="pdf.viewer_modal"
        className="max-w-4xl w-full h-[90vh] flex flex-col bg-card border-border p-0 gap-0"
      >
        <DialogHeader className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-display text-base text-foreground truncate">
              {pdf?.title ?? "PDF Viewer"}
            </DialogTitle>
            <Button
              data-ocid="pdf.viewer.close_button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {pdf?.description && (
            <p className="text-xs text-muted-foreground truncate -mt-1">
              {pdf.description}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          {loadingUrl && (
            <div
              data-ocid="pdf.viewer.loading_state"
              className="absolute inset-0 flex items-center justify-center bg-card"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Loading PDF...</p>
              </div>
            </div>
          )}
          {urlError && (
            <div
              data-ocid="pdf.viewer.error_state"
              className="absolute inset-0 flex items-center justify-center bg-card"
            >
              <div className="text-center space-y-2 px-6">
                <p className="text-destructive font-medium">
                  Failed to load PDF
                </p>
                <p className="text-muted-foreground text-sm">{urlError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="mt-2 border-border"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          {url && !loadingUrl && !urlError && (
            <object
              data={url}
              type="application/pdf"
              className="w-full h-full rounded-b-lg"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
                <p className="text-muted-foreground text-sm text-center px-6">
                  Your browser cannot display this PDF inline.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF
                </a>
              </div>
            </object>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDashboard({ name, onLogout }: UserDashboardProps) {
  const { isFetching: actorFetching } = useActor();
  const { data: pdfs, isLoading } = useListPdfs();
  const [search, setSearch] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<PdfEntry | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const filteredPdfs = (pdfs ?? []).filter(
    (pdf) =>
      pdf.title.toLowerCase().includes(search.toLowerCase()) ||
      pdf.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenPdf = (pdf: PdfEntry) => {
    setSelectedPdf(pdf);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setTimeout(() => setSelectedPdf(null), 300);
  };

  return (
    <div className="min-h-screen bg-background bg-mesh">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">
              PDF Library
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Hi, {name}
            </span>
            <Button
              data-ocid="user.logout_button"
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Page title + search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">
              Documents
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLoading || actorFetching
                ? "Loading documents..."
                : `${pdfs?.length ?? 0} document${(pdfs?.length ?? 0) !== 1 ? "s" : ""} available`}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="user.pdf.search_input"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input/50 border-border focus:border-primary/50 transition-colors"
            />
          </div>
        </motion.div>

        {/* Loading state */}
        {(isLoading || actorFetching) && (
          <div
            data-ocid="user.pdf.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((k) => (
              <div
                key={k}
                className="bg-card border border-border rounded-2xl p-5 space-y-3"
              >
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !actorFetching && filteredPdfs.length === 0 && (
          <motion.div
            data-ocid="user.pdf.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center border border-border border-dashed rounded-2xl bg-secondary/10"
          >
            <FileText className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="text-foreground font-semibold font-display text-lg">
              {search ? "No documents found" : "No documents available"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1 max-w-xs">
              {search
                ? `No documents match "${search}". Try a different search term.`
                : "The library is empty. Check back later!"}
            </p>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="mt-4 text-primary/80 hover:text-primary"
              >
                Clear search
              </Button>
            )}
          </motion.div>
        )}

        {/* PDF Grid */}
        {!isLoading && !actorFetching && filteredPdfs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredPdfs.map((pdf, i) => (
                <PdfCard
                  key={pdf.id}
                  pdf={pdf}
                  index={i + 1}
                  onClick={handleOpenPdf}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* PDF Viewer Dialog */}
      <PdfViewer
        pdf={selectedPdf}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-8">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary/80 hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
