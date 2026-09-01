import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { RICH_TEXT_MODULES_FULL } from "../lib/richText";

const RichTextEditor = forwardRef(function RichTextEditor({
  value,
  onChange,
  onBlur,
  readOnly = false,
  placeholder = "",
  modules = RICH_TEXT_MODULES_FULL,
  minHeight = 120,
  className = "",
}, ref) {
  const quillRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor?.(),
    focus: () => quillRef.current?.focus?.(),
  }));

  return (
    <div
      className={`rich-text-editor ${className}`.trim()}
      style={{ "--rte-min-height": `${minHeight}px` }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={(content) => onChange?.(content)}
        onBlur={onBlur}
        readOnly={readOnly}
        placeholder={placeholder}
        modules={modules}
      />
    </div>
  );
});

export default RichTextEditor;
