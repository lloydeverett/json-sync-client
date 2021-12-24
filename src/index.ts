const params = new URL(window.location.href).searchParams;
const token = params.get("token");
const url = params.get("url");

function onlyShowSection(elementId: string) {
  Array.from(document.getElementById("container").children).forEach(elem => {
    const htmlElem = elem as HTMLElement;
    if (htmlElem && htmlElem.tagName === "SECTION") {
      if (elementId === htmlElem.id) {
        htmlElem.style.display = "block";
      } else {
        htmlElem.style.display = "none";
      }
    }
  });
}

if (!token || !url) {
  // We need to help the user obtain a URL of the right form.
  onlyShowSection("urlgen");

  const urlField = document.getElementById("urlField") as HTMLInputElement;
  const tokenField = document.getElementById("tokenField") as HTMLInputElement;
  const generatedLink = document.getElementById("generatedLink") as HTMLAnchorElement;

  function generateLink() {
    if (!urlField.value || !tokenField.value) {
      generatedLink.style.display = "none";
    } else {
      generatedLink.style.display = "inline-block";
      const currentUrl = new URL(location.href);
      const url = new URL(currentUrl.origin + currentUrl.pathname);
      url.searchParams.set("url", urlField.value);
      url.searchParams.set("token", tokenField.value);
      generatedLink.href = url.href;
      generatedLink.innerText = url.href;
    }
  }

  urlField.addEventListener("input", generateLink);
  tokenField.addEventListener("input", generateLink);
  generateLink();
} else {
  onlyShowSection("loader");
  document.getElementById("error-url").innerText = url; // in case we later show an error

  fetch(url, {
    headers: {
      "X-Auth-Token": token
    }
  }).then((res) => {
    if (res.ok) {
      const jsonField = document.getElementById("jsonField") as HTMLTextAreaElement;
      res.json().then((obj) => {
        // This means we've successfully fetched the current JSON. Start by filling the current
        // value into the textarea.
        jsonField.value = JSON.stringify(obj, null, 2); // spacing level = 2

        // Set up the onclick handler for the save button
        {
          const saveSuccess = document.getElementById("saveSuccess");
          const saveError = document.getElementById("saveError");
          document.getElementById("saveButton").addEventListener("click", function () {
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Auth-Token": token
              },
              body: jsonField.value
            }).then((res) => {
              if (res.ok) {
                saveError.style.display = "none";
                saveSuccess.style.display = "block";
              } else {
                console.error(res);
                saveError.style.display = "block";
                saveSuccess.style.display = "none";
              }             
            }).catch((err) => {
              console.error(err);
              saveError.style.display = "block";
              saveSuccess.style.display = "none";
            });
          })
        }

        onlyShowSection("main");
      }).catch((reason) => {
        console.error("Could not read response text. Reason =", reason);
        onlyShowSection("error");
      });
    } else {
      console.error(res);
      onlyShowSection("error");
    }
  }).catch((err) => {
    console.error(err);
    onlyShowSection("error");
  });
}
