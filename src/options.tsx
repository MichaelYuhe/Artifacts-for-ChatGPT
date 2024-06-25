import React from "react";
import { createRoot } from "react-dom/client";
import "./options.css";

const Options = () => {
  return (
    <div className="w-screen h-screen flex justify-center p-12">
      <div className="w-full max-w-4xl flex flex-col gap-y-8">
        <h1 className="text-4xl font-semibold border-b border-black pb-2">
          Options Page
        </h1>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
