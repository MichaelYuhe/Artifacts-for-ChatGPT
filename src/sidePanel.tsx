import { createRoot } from "react-dom/client";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import "./sidePanel.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Code } from "./content-script";
import { deployToZeabur } from "./deploy";

const SidePanel = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [codes, setCodes] = useState<Code[]>([]);
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [mode, setMode] = useState<"codes" | "preview">("codes");
  const [domain, setDomain] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [projectID, setProjectID] = useState("");

  const chatID =
    useMemo(() => {
      const splited = currentUrl.split("/");
      if (splited.length < 5) return "";

      return splited[4];
    }, [currentUrl]) || "";

  const dashURL =
    useMemo(() => {
      return "https://dash.zeabur.com/projects/" + projectID;
    }, [projectID]) || "";

  // listen for messages from the background script
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (!message) return;

      console.log("Message received in SidePanel:", message);
      const { key, newValue } = message;

      if (key === "codes") {
        setCodes(newValue);
      }
    });
  }, []);

  // get the current tab URL
  useEffect(() => {
    const getCurrentUrl = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        setCurrentUrl(tabs[0].url || "");
      });
    };

    getCurrentUrl();

    // Optional: Set up a listener for tab updates
    const tabUpdateListener = (tabId: any, changeInfo: any, tab: any) => {
      if (changeInfo.status === "complete") {
        getCurrentUrl();
      }
    };

    chrome.tabs.onUpdated.addListener(tabUpdateListener);

    return () => {
      chrome.tabs.onUpdated.removeListener(tabUpdateListener);
    };
  }, []);

  useEffect(() => {
    setMode("codes");
  }, [selectedCode]);

  function getAllSavedArtifacts() {
    chrome.storage.local.get(["chatID", "codes"], (result) => {
      console.log(result);
    });
  }

  function saveArtifactsToProject() {
    chrome.storage.local.set({
      chatID,
      codes,
    });
  }

  return (
    <div className="py-4 px-2">
      {/* <button
        className="bg-black text-[#ddd] hover:bg-[#2b2a2a] font-medium px-4 py-2 transition-all shadow rounded-lg"
        onClick={getAllSavedArtifacts}
      >
        Explore All Artifacts
      </button> */}

      <div className="flex flex-col gap-y-2">
        {domain && (
          <div className="flex items-center gap-x-2">
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

        {projectID && (
          <a
            target="_blank"
            className="underline underline-offset-2"
            href={dashURL}
          >
            Claim the project on Zeabur
          </a>
        )}
      </div>

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
          <div className="flex items-center gap-2 flex-wrap">
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
                    const res = await deployToZeabur(
                      selectedCode.content,
                      selectedCode.title,
                      selectedCode.language
                    );

                    setDomain(res.domain);
                    setProjectID(res.projectID);
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

            <button
              className="bg-black text-[#ddd] hover:bg-[#2b2a2a] font-medium px-4 py-2 transition-all shadow rounded-lg"
              onClick={saveArtifactsToProject}
            >
              Save Artifact
            </button>
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
