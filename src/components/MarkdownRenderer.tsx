import { Blockquote, Card, Flex, Code, Text, Link } from "@radix-ui/themes";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import { open } from "@tauri-apps/plugin-shell";

interface MarkdownRendererProps {
  content: string;
}
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        blockquote(props) {
          const { children } = props;
          return <Blockquote>{children}</Blockquote>;
        },
        a(props) {
          const { children, href } = props;
          return (
            <Link
              href=""
              onClick={(e) => {
                e.preventDefault();
                if (href) open(href);
              }}
            >
              {children}
            </Link>
          );
        },
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <Card variant="surface" style={{ overflow: "auto", padding: 0 }}>
              <Flex gap="1" direction="column" overflow="auto">
                <Text
                  size="1"
                  color="gray"
                  align="right"
                  weight="bold"
                  style={{
                    borderBottom: "1px solid var(--gray-6)",
                    padding: "var(--space-2)",
                  }}
                >
                  {match[1].toUpperCase()}
                </Text>
                <code {...rest} className={className}>
                  {children}
                </code>
              </Flex>
            </Card>
          ) : (
            <Code className={className}>{children}</Code>
          );
        },
      }}
    >
      {content
        .replaceAll("\\[", "$$")
        .replaceAll("\\]", "$$")
        .replaceAll("\\(", " $")
        .replaceAll("\\)", "$ ")}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
