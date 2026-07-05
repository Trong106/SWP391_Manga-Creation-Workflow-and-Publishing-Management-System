"use client"

import { useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"
import type { Editor as TinyMceEditor } from "tinymce"
import { toast } from "sonner"
interface SynopsisRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const textToHtml = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replaceAll("\n", "<br>")}</p>`)
    .join("")

export default function SynopsisRichTextEditor({ value, onChange, disabled = false }: SynopsisRichTextEditorProps) {
  const editorRef = useRef<TinyMceEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const importTextFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      toast.error("Only TXT files can be imported.")
      return
    }
    if (file.size > MAX_TEXT_FILE_SIZE) {
      toast.error("The TXT file cannot exceed 5 MB.")
      return
    }
    if (value.trim() && !window.confirm("Importing this file will replace the current synopsis. Continue?")) return

    try {
      const html = textToHtml(await file.text())
      editorRef.current?.setContent(html)
      onChange(html)
      toast.success(`${file.name} was imported successfully.`)
    } catch {
      toast.error("The TXT file could not be read.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={(event) => void importTextFile(event.target.files?.[0])}
      />
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        disabled={disabled}
        onInit={(_, editor) => { editorRef.current = editor }}
        onEditorChange={onChange}
        init={{
          height: 410,
          menubar: "edit view insert format tools",
          plugins: "autolink lists link wordcount searchreplace visualblocks",
          toolbar: "importtxt | undo redo | blocks | bold italic underline | bullist numlist blockquote | link | alignleft aligncenter alignright | removeformat | wordcount",
          toolbar_mode: "sliding",
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          skin: "oxide-dark",
          content_css: "dark",
          placeholder: "Write a detailed synopsis, story premise, characters, conflict, and planned direction...",
          setup: (editor) => {
            editor.ui.registry.addButton("importtxt", {
              text: "Import TXT",
              tooltip: "Import synopsis from a TXT file",
              onAction: () => fileInputRef.current?.click(),
            })
          },
          content_style: "body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.7; }",
        }}
      />
    </div>
  )
}
