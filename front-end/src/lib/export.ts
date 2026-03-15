import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { QuizQuestion } from "@/features/quizz";
import i18n from "@/config/i18n";

export async function exportQuizToDocx(
  questions: QuizQuestion[],
  title = i18n.t("export.defaultTitle"),
) {
  const children: any[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  ];

  questions.forEach((q, i) => {
    // Question Text
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: i18n.t("export.questionPrefix", { n: i + 1 }),
            bold: true,
          }),
          new TextRun(q.questionText),
        ],
        spacing: { before: 240, after: 120 },
      }),
    );

    // Options
    q.options.forEach((opt, optIdx) => {
      const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}. ${opt.text}`,
            }),
          ],
          indent: { left: 720 }, // Indent options
          spacing: { after: 120 },
        }),
      );
    });
  });

  // Answer Key Page
  children.push(
    new Paragraph({
      text: i18n.t("export.answerKey"),
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: true,
      spacing: { after: 400 },
    }),
  );

  questions.forEach((q, i) => {
    let letter: string;
    if (q.type === "multiple-answer" && q.correctAnswerIds?.length) {
      letter = q.correctAnswerIds
        .map((cid) => {
          const idx = q.options.findIndex((o) => o.id === cid);
          return idx >= 0 ? String.fromCharCode(65 + idx) : cid;
        })
        .join(", ");
    } else {
      const correctOptIndex = q.options.findIndex(
        (o) => o.id === q.correctAnswerId,
      );
      letter =
        correctOptIndex >= 0
          ? String.fromCharCode(65 + correctOptIndex)
          : q.correctAnswerId;
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: i18n.t("export.questionPrefix", { n: i + 1 }), bold: true }),
          new TextRun({ text: letter, bold: true, color: "00aa00" }),
        ],
        spacing: { after: 120 },
      }),
    );

    if (q.explanation) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: i18n.t("export.explanation"), italics: true }),
            new TextRun(q.explanation),
          ],
          indent: { left: 720 },
          spacing: { after: 240 },
        }),
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz_export.docx";
  a.click();
  window.URL.revokeObjectURL(url);
}
