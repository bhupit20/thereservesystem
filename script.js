const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

function getFormStatus(form) {
  let status = form.parentElement ? form.parentElement.querySelector("[data-form-status]") : null;
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.dataset.formStatus = "";
    form.insertAdjacentElement("afterend", status);
  }
  return status;
}

function setupSubscribeForm(form, options = {}) {
  if (!form || form.dataset.subscribeReady === "true") return;
  form.dataset.subscribeReady = "true";

  const status = getFormStatus(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button ? button.textContent : "";
    const fd = new FormData(form);
    const body = {
      email: fd.get("EMAIL"),
      firstName: fd.get("FNAME"),
      source: fd.get("SOURCE"),
      tags: String(form.dataset.tags || "").split(","),
      website: fd.get("website"),
    };

    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }
    status.className = "form-status";
    status.textContent = "Sending securely...";

    function finish() {
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }

    fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok && data.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          status.className = "form-status success";
          status.textContent =
            form.dataset.success ||
            "Thank you. You are on the list. Please check your inbox for the next step.";
          if (!options.preserveValues) form.reset();
          finish();
          if (typeof options.onSuccess === "function") options.onSuccess(data);
        } else {
          status.className = "form-status error";
          status.textContent =
            (data && data.error) ||
            form.dataset.error ||
            "That did not go through. Please check the email address and try again.";
          finish();
        }
      })
      .catch(() => {
        status.className = "form-status error";
        status.textContent =
          form.dataset.error || "That did not go through. Please refresh the page and try again.";
        finish();
      });
  });
}

document.querySelectorAll("form[data-subscribe]").forEach((form) => setupSubscribeForm(form));

const quizMount = document.querySelector("[data-quiz]");
if (quizMount) {
  if (typeof gtag === "function") gtag("event", "quiz_started");

  // No-JS fallback only: native submission goes straight to this Mailchimp
  // embed URL, which needs numeric tag IDs rather than the tag names used
  // by the /api/subscribe path below.
  const mailchimpAction =
    "https://thelongevitylab.us19.list-manage.com/subscribe/post?u=6c3200ab5c7b624854df21a77&id=bee36545c8&f_id=0083a0e3f0";
  const numericTagIds = {
    BOOK_READER: "6333533",
    PYR_FOUNDATION: "6333813",
    PYR_STABILIZATION: "6333816",
    PYR_PRECISION: "6333814",
  };
  const questions = [
    {
      tier: "Mental Reserve",
      key: "mental",
      text:
        "Do you have a deliberate, daily practice for regulating stress — not distraction, but something that measurably lowers your baseline?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Foundation",
      key: "foundation",
      text:
        "Do you exercise with deliberate cardiovascular effort — zone 2 intensity, where you can speak in short sentences but not comfortably hold conversation — at least three times per week?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Stabilization",
      key: "stabilization",
      text: "Has a bed partner ever noticed pauses in your breathing, or loud snoring, during sleep?",
      options: [
        { label: "Yes, and I’ve been formally evaluated", value: "evaluated" },
        { label: "Yes, but I haven’t been evaluated", value: "gap" },
        { label: "No or I don’t know", value: "clear" },
      ],
      gapValue: "gap",
    },
    {
      tier: "Foundation",
      key: "foundation",
      text: "Is your sleep schedule consistent within forty-five minutes, seven days a week, including weekends?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Stabilization",
      key: "stabilization",
      text: "Do you know your current blood pressure, and is it consistently below 130/80 — whether naturally or with treatment?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Foundation",
      key: "foundation",
      text:
        "Do you have at least two people in your life with whom you have substantive, regular in-person contact — the kind that would produce someone in your hospital room if you were admitted tomorrow?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Stabilization",
      key: "stabilization",
      text: "Have you had a fasting glucose and HbA1c measured in the past two years, and do you know whether either is trending — not just whether it is currently normal?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Stabilization",
      key: "stabilization",
      text:
        "Are you current on the cancer screenings appropriate for your age and sex — colonoscopy, mammography, lung CT if eligible — not as an intention but as a completed appointment?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
        { label: "Not yet eligible", value: "not_eligible" },
      ],
    },
    {
      tier: "Precision",
      key: "precision",
      text: "Do you know your ApoB level?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Precision",
      key: "precision",
      text: "Have you had your Lp(a) measured at least once?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      tier: "Precision",
      key: "precision",
      text: "Has your cardiorespiratory fitness ever been formally assessed — not estimated, but measured with a VO₂ max test or equivalent protocol?",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
  ];

  let index = 0;
  const answers = Array(questions.length).fill(null);

  function score() {
    const gapsByTier = { mental: 0, foundation: 0, stabilization: 0, precision: 0 };
    answers.forEach((answer, i) => {
      const q = questions[i];
      const isGap = q.gapValue ? answer === q.gapValue : answer === "no";
      if (isGap) gapsByTier[q.key] += 1;
    });
    if (gapsByTier.mental + gapsByTier.foundation >= 3) return { key: "foundation", tag: "PYR_FOUNDATION", label: "Mental Reserve + Foundation", url: "./results/foundation.html" };
    if (gapsByTier.stabilization >= 2) return { key: "stabilization", tag: "PYR_STABILIZATION", label: "Stabilization", url: "./results/stabilization.html" };
    if (gapsByTier.precision >= 1) return { key: "precision", tag: "PYR_PRECISION", label: "Precision", url: "./results/precision.html" };
    return { key: "precision", tag: "PYR_PRECISION", label: "Precision", url: "./results/precision.html" };
  }

  function render() {
    const q = questions[index];
    const progress = ((index + 1) / questions.length) * 100;
    quizMount.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-topline">
          <span>Question ${index + 1} of ${questions.length}</span>
          <span>${q.tier}</span>
        </div>
        <div class="progress" aria-hidden="true"><span style="--progress:${progress}%"></span></div>
        <p class="eyebrow">The Reserve System Score™ · ${q.tier}</p>
        <h1 class="quiz-question">${q.text}</h1>
        <div class="quiz-options" role="group" aria-label="Answer choices">
          ${q.options
            .map(
              (option) =>
                `<button class="quiz-option ${answers[index] === option.value ? "selected" : ""}" data-answer="${option.value}">${option.label}</button>`,
            )
            .join("")}
        </div>
        <div class="quiz-nav">
          <button class="button-secondary" data-back ${index === 0 ? "disabled" : ""}>Back</button>
          <button class="button" data-next ${answers[index] ? "" : "disabled"}>${index === questions.length - 1 ? "Review" : "Next"}</button>
        </div>
      </div>
    `;
  }

  function renderReview() {
    const result = score();
    const resultTags = ["BOOK_READER", result.tag].filter(Boolean).join(",");
    const numericTags = [numericTagIds.BOOK_READER, numericTagIds[result.tag]].filter(Boolean).join(",");
    quizMount.innerHTML = `
      <div class="quiz-card">
        <p class="eyebrow">Your Reserve Score is ready</p>
        <h1 style="font-size:var(--text-2xl);max-width:13ch;">Send me my score.</h1>
        <p class="lead">Enter your email to unlock your Reserve Score, chapter recommendations, and educational interpretation of your result.</p>
        <div class="mailchimp-placeholder result-gate">
          <div class="result-gate-header">
            <h3>What you’ll receive</h3>
            <p>We’ll show your result on the next screen and send the reader follow-up that matches your capacity, load, and reserve pattern.</p>
          </div>
          <ul class="result-benefits" aria-label="Score result benefits">
            <li>Your Reserve Score result</li>
            <li>The chapters to read next</li>
            <li>The clinical question to bring into your next conversation</li>
          </ul>
          <form class="form-grid" data-subscribe data-tags="${resultTags}" data-result-url="${result.url}" action="${mailchimpAction}" method="post" data-success="Your score is ready. Opening your result now." data-error="That did not go through. Please check the email address and try again.">
            <input type="hidden" name="SOURCE" value="quiz" />
            <input type="hidden" name="tags" value="${numericTags}" />
            <label>Email address <input type="email" name="EMAIL" required placeholder="you@example.com" autocomplete="email" /></label>
            <label>First name <input type="text" name="FNAME" placeholder="Optional" autocomplete="given-name" /></label>
            <button class="button" type="submit">Show my Reserve Score</button>
          </form>
          <p class="form-status" data-form-status aria-live="polite"></p>
          <p class="privacy-note">The Reserve System Score™ is educational, not diagnostic, and does not create a physician–patient relationship. We do not share your quiz responses.</p>
        </div>
      </div>
    `;
    const form = quizMount.querySelector("form");
    setupSubscribeForm(form, {
      preserveValues: true,
      onSuccess: () => {
        const button = form.querySelector("button");
        if (button) {
          button.textContent = "Opening your result...";
          button.disabled = true;
        }
        window.setTimeout(() => {
          window.location.href = form.dataset.resultUrl || result.url;
        }, 900);
      },
    });
  }

  quizMount.addEventListener("click", (event) => {
    const answer = event.target.closest("[data-answer]");
    if (answer) {
      answers[index] = answer.dataset.answer;
      render();
      return;
    }
    if (event.target.closest("[data-back]") && index > 0) {
      index -= 1;
      render();
      return;
    }
    if (event.target.closest("[data-next]") && answers[index]) {
      if (index === questions.length - 1) {
        if (typeof gtag === "function") gtag("event", "quiz_completed");
        renderReview();
      } else {
        index += 1;
        render();
      }
    }
  });

  render();
}
