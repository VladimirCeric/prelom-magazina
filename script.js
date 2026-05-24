const API_URL = "https://script.google.com/macros/s/AKfycbzftyTcWVrRTetm2Oo3lweuMFQn94ApuX9HkvCspzgE7f7lK6rtuslT4BNPFncJQ8oE/exec";

const form = document.getElementById("studentForm");
const messageBox = document.getElementById("message");
const offersSection = document.getElementById("offers");
const offerCards = document.getElementById("offerCards");
const offerBtn = document.getElementById("offerBtn");

let currentStudent = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ime = document.getElementById("ime").value.trim();
  const indeks = document.getElementById("indeks").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();

  currentStudent = { ime, indeks, email };

  if (!email.endsWith("@gs.viser.edu.rs")) {
    showMessage("Za prijavu je potrebno koristiti studentski imejl koji se završava sa @gs.viser.edu.rs.", "error");
    return;
  }

  setLoading(true, "Učitavanje ponuđenih setova...");

  try {
    const data = await callApi({
      action: "getOffer",
      ime,
      indeks,
      email
    });

    if (!data.ok) {
      showMessage(data.message || "Došlo je do greške.", "error");
      return;
    }

    if (data.mode === "assigned") {
      renderAssigned(data.chosen, data.message);
      return;
    }

    renderOffers(data.offer);
    showMessage(data.message || "Prikazana su vam tri ponuđena seta.", "success");

  } catch (error) {
    showMessage("Nije moguće učitati podatke. Proverite internet vezu ili pokušajte ponovo.", "error");
  } finally {
    setLoading(false, "Prikaži ponuđene setove");
  }
});

async function chooseSet(setId) {
  if (!currentStudent) {
    showMessage("Prvo unesite podatke.", "error");
    return;
  }

  setLoading(true, "Upisivanje izbora...");

  try {
    const data = await callApi({
      action: "chooseSet",
      indeks: currentStudent.indeks,
      email: currentStudent.email,
      set_id: setId
    });

    if (!data.ok) {
      showMessage(data.message || "Došlo je do greške.", "error");
      return;
    }

    renderAssigned(data.chosen, data.message);

  } catch (error) {
    showMessage("Nije moguće upisati izbor. Pokušajte ponovo.", "error");
  } finally {
    setLoading(false, "Prikaži ponuđene setove");
  }
}

async function callApi(params) {
  const url = new URL(API_URL);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  return response.json();
}

function renderOffers(offers) {
  offersSection.classList.remove("hidden");
  offerCards.innerHTML = "";

  offers.forEach((set, index) => {
    const card = document.createElement("article");
    card.className = "offer-card";

    card.innerHTML = `
      <img src="${escapeHtml(set.thumb)}" alt="Thumbnail za set ${escapeHtml(set.set_id)}" loading="lazy" />
      <h3>Set ${String.fromCharCode(65 + index)} — ${escapeHtml(set.set_id)}</h3>
      <p class="offer-meta">${escapeHtml(set.casopis)}</p>
      <div class="card-actions">
        <a class="button-link secondary" href="${escapeHtml(set.pdf_url)}" target="_blank" rel="noopener">
          Pogledaj PDF
        </a>
        <button class="choose" type="button" data-set-id="${escapeHtml(set.set_id)}">
          Izaberi ovaj set
        </button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => chooseSet(set.set_id));
    offerCards.appendChild(card);
  });

  offersSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAssigned(set, message) {
  offersSection.classList.remove("hidden");

  offerCards.innerHTML = `
    <div class="assigned-box">
      <h3>Izabrani set: ${escapeHtml(set.set_id)}</h3>
      <p>${escapeHtml(set.casopis)}</p>
      <p>${escapeHtml(message || "Već ste izabrali set.")}</p>
      <p>
        <a class="button-link" href="${escapeHtml(set.pdf_url)}" target="_blank" rel="noopener">
          Otvori PDF
        </a>
      </p>
    </div>
  `;

  showMessage(message || "Izbor je evidentiran.", "success");
  offersSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type || ""}`;
}

function setLoading(isLoading, text) {
  offerBtn.disabled = isLoading;
  offerBtn.textContent = text;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}