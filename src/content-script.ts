export interface Code {
  title: string;
  language: string;
  content: string;
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      const pres = document.querySelectorAll("pre");
      if (!pres) return;

      const codes: Code[] = [];

      pres.forEach((pre) => {
        const header = pre.children[0].children[0];
        if (!header) return;

        const language = header.children[0];
        if (!language) return;

        const content = pre.children[0].children[1].children[0];
        if (!content) return;

        // if codes already has a code with the same title, add a number to the title
        const title = language.textContent || "";
        let newTitle = title;

        let i = 1;
        while (codes.some((code) => code.title === newTitle)) {
          newTitle = `${title}-${i}`;
          i++;
        }

        codes.push({
          title: newTitle || "",
          language: language.textContent || "",
          content: content.textContent || "",
        });
      });

      chrome.storage.local.set({ codes: codes });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });