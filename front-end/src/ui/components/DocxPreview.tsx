import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import mammoth from "mammoth";
import { Loader2 } from "lucide-react";

interface DocxPreviewProps {
  url: string;
}

export function DocxPreview({ url }: DocxPreviewProps) {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(url)
      .then((res) => res.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        return mammoth.convertToHtml({ arrayBuffer });
      })
      .then((result) => {
        if (isMounted) {
          setHtml(result.value);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(t("docxPreview.error"));
          setLoading(false);
          console.error("Error rendering docx:", err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center p-12 text-muted-foreground border rounded-lg bg-muted/10 h-[65vh]">
        <Loader2 className="mr-2 size-5 animate-spin" />
        {t("docxPreview.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full items-center justify-center p-12 text-destructive border border-destructive/20 rounded-lg bg-destructive/5 h-[65vh]">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-black border rounded-lg p-8 h-[65vh] overflow-y-auto shadow-inner">
      <style>{`
        .docx-preview table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        .docx-preview td, .docx-preview th { border: 1px solid #ccc; padding: 0.5rem; }
        .docx-preview p { margin-bottom: 0.75rem; }
        .docx-preview h1, .docx-preview h2, .docx-preview h3 { font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .docx-preview h1 { font-size: 1.5rem; }
        .docx-preview h2 { font-size: 1.25rem; }
        .docx-preview ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.75rem; }
        .docx-preview ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.75rem; }
      `}</style>
      <div
        className="docx-preview font-sans text-sm leading-relaxed max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
