import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PdfEntry } from "../backend.d";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useAddPdf, useDeletePdf, useListPdfs } from "../hooks/useQueries";
import { StorageClient } from "../utils/StorageClient";

interface AdminDashboardProps {
  token: string;
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

function AdminPdfViewer({
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
        data-ocid="admin.pdf.viewer_modal"
        className="max-w-4xl w-full h-[90vh] flex flex-col bg-card border-border p-0 gap-0"
      >
        <DialogHeader className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-display text-base text-foreground truncate">
              {pdf?.title ?? "PDF Viewer"}
            </DialogTitle>
            <Button
              data-ocid="admin.pdf.viewer.close_button"
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
              data-ocid="admin.pdf.viewer.loading_state"
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
              data-ocid="admin.pdf.viewer.error_state"
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

function formatDate(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PdfListItem({
  pdf,
  index,
  token,
  onDeleted,
  onView,
}: {
  pdf: PdfEntry;
  index: number;
  token: string;
  onDeleted: () => void;
  onView: (pdf: PdfEntry) => void;
}) {
  const deleteMutation = useDeletePdf();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ token, id: pdf.id });
      toast.success("PDF deleted successfully");
      setDeleteOpen(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete PDF");
    }
  };

  return (
    <motion.div
      data-ocid={`admin.pdf.item.${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 bg-secondary/20 border border-border rounded-xl hover:bg-secondary/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate font-display">
          {pdf.title}
        </p>
        {pdf.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {pdf.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatDate(pdf.uploadedAt)}
        </p>
      </div>

      <Button
        data-ocid={`admin.pdf.view_button.${index}`}
        variant="ghost"
        size="icon"
        onClick={() => onView(pdf)}
        className="flex-shrink-0 w-8 h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        title="View PDF"
      >
        <Eye className="w-4 h-4" />
      </Button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            data-ocid={`admin.pdf.delete_button.${index}`}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          data-ocid="admin.pdf.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete PDF?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">"{pdf.title}"</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.pdf.cancel_button"
              className="border-border bg-transparent hover:bg-secondary/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.pdf.confirm_button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default function AdminDashboard({
  token,
  onLogout,
}: AdminDashboardProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: pdfs, isLoading, refetch } = useListPdfs();
  const addPdfMutation = useAddPdf();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleError, setTitleError] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfEntry | null>(null);

  const handleOpenPdf = (pdf: PdfEntry) => {
    setSelectedPdf(pdf);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setTimeout(() => setSelectedPdf(null), 300);
  };

  const isUploading = addPdfMutation.isPending || uploadProgress !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }
    setFileError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    // Check actor readiness first — if not ready, bail immediately
    if (!actor) {
      toast.error("App not ready. Please wait a moment and try again.");
      return;
    }

    let hasError = false;
    if (!title.trim()) {
      setTitleError("Title is required");
      hasError = true;
    }
    if (!selectedFile) {
      setFileError("Please select a PDF file");
      hasError = true;
    }
    if (hasError) return;

    try {
      setUploadProgress(0);

      // Get config and build storage client
      const config = await loadConfig();
      const agent = new HttpAgent({
        host: config.backend_host,
      });

      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );

      const fileBytes = new Uint8Array(await selectedFile!.arrayBuffer());
      const { hash } = await storageClient.putFile(fileBytes, (pct) => {
        setUploadProgress(Math.min(pct, 99));
      });

      const blobId = SENTINEL + hash;

      await addPdfMutation.mutateAsync({
        token,
        title: title.trim(),
        description: description.trim(),
        blobId,
      });

      setUploadProgress(100);
      toast.success("PDF uploaded successfully!");
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setTimeout(() => setUploadProgress(null), 500);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadProgress(null);
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(`Upload failed: ${message}`);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setTitleError("");
    setFileError("");
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background bg-mesh">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">
              Admin Panel
            </span>
          </div>
          <Button
            data-ocid="admin.logout_button"
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">
              PDF Library
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isLoading
                ? "Loading..."
                : `${pdfs?.length ?? 0} document${(pdfs?.length ?? 0) !== 1 ? "s" : ""} uploaded`}
            </p>
          </div>
          <Button
            data-ocid="admin.upload_button"
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) handleResetForm();
            }}
            className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add PDF
              </>
            )}
          </Button>
        </motion.div>

        {/* Upload Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Upload New PDF
                </h3>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pdf-title"
                    className="text-foreground/80 text-sm"
                  >
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pdf-title"
                    data-ocid="admin.pdf_title_input"
                    placeholder="Enter document title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleError("");
                    }}
                    className={`bg-input/50 border-border focus:border-primary/50 transition-colors ${
                      titleError ? "border-destructive" : ""
                    }`}
                  />
                  {titleError && (
                    <p
                      data-ocid="admin.title_error_state"
                      className="text-destructive text-xs"
                    >
                      {titleError}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pdf-desc"
                    className="text-foreground/80 text-sm"
                  >
                    Description{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="pdf-desc"
                    data-ocid="admin.pdf_description_input"
                    placeholder="Brief description of the document"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="bg-input/50 border-border focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                {/* File picker */}
                <div className="space-y-1.5">
                  <Label className="text-foreground/80 text-sm">
                    PDF File <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    className={`relative w-full border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer group ${
                      selectedFile
                        ? "border-primary/50 bg-primary/5"
                        : fileError
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border hover:border-primary/30 hover:bg-primary/5"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Select PDF file"
                  >
                    <input
                      ref={fileInputRef}
                      data-ocid="admin.pdf_file_input"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-6 h-6 text-muted-foreground mx-auto group-hover:text-primary transition-colors" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a PDF file
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          Only .pdf files accepted
                        </p>
                      </div>
                    )}
                  </button>
                  {fileError && (
                    <p
                      data-ocid="admin.file_error_state"
                      className="text-destructive text-xs"
                    >
                      {fileError}
                    </p>
                  )}
                </div>

                {/* Upload progress */}
                {uploadProgress !== null && (
                  <div
                    data-ocid="admin.upload_loading_state"
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  data-ocid="admin.upload_button"
                  onClick={handleUpload}
                  disabled={isUploading || actorFetching}
                  className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {uploadProgress !== null
                        ? `Uploading ${uploadProgress}%...`
                        : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload PDF
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">
            All Documents
          </h3>

          {isLoading && (
            <div data-ocid="admin.pdf.loading_state" className="space-y-3">
              {(["sk1", "sk2", "sk3"] as const).map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-4 p-4 bg-secondary/20 border border-border rounded-xl"
                >
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!pdfs || pdfs.length === 0) && (
            <motion.div
              data-ocid="admin.pdf.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center border border-border border-dashed rounded-2xl bg-secondary/10"
            >
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No PDFs uploaded yet
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Click "Add PDF" to upload your first document
              </p>
            </motion.div>
          )}

          {!isLoading && pdfs && pdfs.length > 0 && (
            <AnimatePresence>
              {pdfs.map((pdf, i) => (
                <PdfListItem
                  key={pdf.id}
                  pdf={pdf}
                  index={i + 1}
                  token={token}
                  onDeleted={() => refetch()}
                  onView={handleOpenPdf}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

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

      {/* PDF Viewer Dialog */}
      <AdminPdfViewer
        pdf={selectedPdf}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
}
