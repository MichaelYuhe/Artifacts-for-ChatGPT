import { createRoot } from "react-dom/client";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import "./sidePanel.css";
import React, { useEffect, useRef, useState } from "react";
import { Code } from "./content-script";
import { deployToZeabur } from "./deploy";

const SidePanel = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [codes, setCodes] = useState<Code[]>([]);
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [mode, setMode] = useState<"codes" | "preview">("codes");
  const [domain, setDomain] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    // listen for messages from the background script
    chrome.runtime.onMessage.addListener((message) => {
      if (!message) return;

      console.log("Message received in SidePanel:", message);
      const { key, newValue } = message;

      if (key === "codes") {
        setCodes(newValue);
      }
    });
  }, []);

  useEffect(() => {
    setMode("codes");
  }, [selectedCode]);

  return (
    <div className="py-4 px-2">
      {domain && (
        <div className="flex items-center gap-x-2 mb-4">
          <span>Deployed to:</span>

          <a
            href={"https://" + domain}
            target="_blank"
            className="underline underline-offset-2"
          >
            {domain}
          </a>
        </div>
      )}

      <ul className="flex items-center gap-2 flex-wrap">
        {codes.map((code, index) => (
          <li
            className={`border border-black rounded-lg font-medium cursor-pointer px-4 py-2 flex items-center justify-center
            ${
              code.title === selectedCode?.title
                ? "bg-black text-[#ddd]"
                : "text-black"
            }
            `}
            onClick={() => setSelectedCode(code)}
            key={index}
          >
            {code.title}
          </li>
        ))}
      </ul>

      {selectedCode && (
        <div className="flex flex-col gap-y-2 mt-4">
          <div className="flex items-center gap-x-2">
            <button
              className={`border border-black font-medium px-4 py-2 transition-all shadow rounded-lg ${
                mode === "codes"
                  ? "bg-black text-[#ddd] hover:bg-[#2b2a2a]"
                  : "text-black"
              }`}
              onClick={() => setMode("codes")}
            >
              Codes
            </button>

            {selectedCode.language === "html" && (
              <button
                className={`border border-black px-4 py-2 font-medium transition-all shadow rounded-lg ${
                  mode === "preview"
                    ? "bg-black text-[#ddd] hover:bg-[#2b2a2a]"
                    : "text-black"
                }`}
                onClick={() => setMode("preview")}
              >
                Preview
              </button>
            )}

            {selectedCode.language === "html" && (
              <button
                className="relative"
                onClick={async () => {
                  try {
                    setIsDeploying(true);
                    const domainRes = await deployToZeabur(
                      selectedCode.content,
                      selectedCode.title,
                      selectedCode.language
                    );

                    setDomain(domainRes);
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setIsDeploying(false);
                  }
                }}
              >
                <img
                  src="https://zeabur.com/button.svg"
                  alt="Deploy to Zeabur"
                />

                {isDeploying && (
                  <div className="w-full h-full top-0 absolute rounded-lg bg-black/40 animate-pulse"></div>
                )}
              </button>
            )}
          </div>

          {mode === "preview" && selectedCode.language === "html" && (
            <iframe
              ref={iframeRef}
              className="border"
              srcDoc={selectedCode.content}
              style={{
                width: "100%",
                height: "800px",
              }}
            />
          )}

          {mode === "codes" && (
            <SyntaxHighlighter language={selectedCode.language} style={docco}>
              {selectedCode.content}
            </SyntaxHighlighter>
          )}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);
