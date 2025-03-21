import { createReactBlockSpec } from "@blocknote/react";
import { useMemo } from "react";

export const CustomFile = () => {
  return useMemo(() => {
    return createReactBlockSpec(
      {
        type: "file",
        propSchema: {
            backgroundColor: {
                default: "default"
            },
            name: {
                default: ""
            },
            url: {
                default: ""
            },
            caption: {
                default: ""
            },
        },
        content: "none",
        isFileBlock: true
      },
      {
        render: ({ block }) => {
            const fileUrl = block.props.url || "#";
            return (
            <div style={{"width": "100%"}}>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                📄 {block.props.name || "Add File"}
                </a>
                {block.props.name.includes(".pdf") ? 
                <object data={fileUrl} type="application/pdf" width="100%" height="600px"><p>Unable to display PDF file.</p>
                </object> : ""}
            </div>
            );
        }
      }
    );
  }, []);
};