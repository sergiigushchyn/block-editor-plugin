import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  defaultBlockSpecs
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  DefaultReactSuggestionItem,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { useGetKey, useGetSet } from "@brevity-builder/react";
import { useEffect, useMemo } from "react";
import { useMention } from "./mention";
import { CustomFile } from "./customfile";

async function uploadFile(file: File) {
  const headers = {};

  if (file.type.startsWith("image")) {
    const { width, height } = await getImageSize(file);
    headers["X-Image-Width"] = width.toString();
    headers["X-Image-Height"] = height.toString();
  }
  const result = await fetch(
    `https://app.boldapproved.com/api/upload/public/${file.name}`,
    {
      method: "PUT",
      headers: headers,
      body: file,
    },
  );

  if (!result.ok) {
    throw await result.text();
  }

  const data = await result.json();
  return data.src as string;
}

type Dimensions = {
  width: number;
  height: number;
};

function getImageSize(file: File): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function onload() {
      const { width, height } = img;
      resolve({ width, height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const getMentionMenuItems = (
  editor: typeof schema.BlockNoteEditor,
  users: user[],
): DefaultReactSuggestionItem[] => {
  return users.map((user) => ({
    title: `${user.given_name} ${user.family_name}`,
    subtext: user.email,
    key: user.email,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            user: user.email,
            userId: user.id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  }));
};

type user = {
  email: string;
  given_name: string;
  family_name: string;
  profile_image_url: {
    src: string | null;
  };
  id: string;
};
export default function Block({
  readOnly,
  defaultValue,
  users = [],
  onTextChange,
  ...props
}: {
  readOnly: boolean;
  defaultValue: string;
  users: user[];
  onTextChange: (value: any) => void;
}) {
  const Mention = useMention(users);
  const File = CustomFile();
  const key = useGetKey(props);
  const initialValue = useMemo(
    () => ({ value: defaultValue as string }),
    [defaultValue],
  );

  const schema = useMemo(() => {
    return BlockNoteSchema.create({
      inlineContentSpecs: {
        // Adds all default inline content.
        ...defaultInlineContentSpecs,
        // Adds the mention tag.
        mention: Mention
      },
      blockSpecs: {
        // enable the default blocks if desired
        ...defaultBlockSpecs,
        //file: undefined,
        customFile: File
      },
    });
  }, []);

  const editor = useCreateBlockNote({
    schema,
    uploadFile: uploadFile,
  });

  const [_, setState] = useGetSet<{
    value: string;
  }>(key, initialValue);

  useEffect(() => {
    async function loadInitialHTML() {
      const blocks = await editor.tryParseHTMLToBlocks(defaultValue);
      editor.replaceBlocks(editor.document, blocks);
    }
    if (defaultValue) {
      loadInitialHTML();
    }
  }, [editor, defaultValue]);

  const onChange = async () => { console.log("EDITOR", editor);
    // Converts the editor's contents from Block objects to HTML and store to state.
    const html = await editor.blocksToHTMLLossy(editor.document);
    setState({
      value: html.replaceAll("<p></p>", "<p>&nbsp;</p>"),
    });
    console.log("SAVED TO DB", html);
    if (onTextChange) {
      onTextChange(html);
    }
  };

  return (
    <BlockNoteView
      editor={editor}
      editable={!readOnly}
      theme={"light"}
      onChange={onChange}
    >
      <SuggestionMenuController
        triggerCharacter="@"
        getItems={async (query) =>
          // Gets the mentions menu items
          filterSuggestionItems(getMentionMenuItems(editor, users), query)
        }
      />
    </BlockNoteView>
  );
}