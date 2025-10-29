import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import ColorAnalyzerDisplay from "../tools/ColorAnalyzerDisplay"
import ImageZipDownloadDisplay from "../tools/ImageZipDownloadDisplay"
import ChromeLink from "../ui/ChromeLink"

import "highlight.js/styles/github-dark.css"

export default function MarkdownRenderer({
    markdown
}: { markdown: string }) {
    if (markdown.includes('__PAGEPLUS__TOOL__COLORANALYZER__')) {
      return (
        <ColorAnalyzerDisplay content={markdown} />
      )
    }
    if (markdown.includes('__PAGEPLUS__TOOL__IMAGEZIPDOWNLOAD__')) {
      return (
        <ImageZipDownloadDisplay content={markdown} />
      )
    }
    return (
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{
              a: ({ href, children, ...props }) => (
                <ChromeLink href={href || '#'} {...props}>
                  {children}
                </ChromeLink>
              )
            }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }