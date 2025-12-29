// =========================
// LeadSquared Config (GLOBAL)
// =========================
const LEADSQUARED_ACCESS_KEY = "sample";
const LEADSQUARED_SECRET_KEY = "sample";
const LEADSQUARED_REGION = "IN21";

// =========================
// MAIN SCRIPT
// =========================
document.addEventListener('DOMContentLoaded', () => {

  const steps = document.querySelectorAll('.step');
  const topSteps = document.querySelectorAll('.top-step');
  const progress = document.getElementById('progressFill');
  const form = document.getElementById('assessmentForm');
  const mobileInput = document.querySelector('input[type="tel"]');

  let current = 0;
  let formState = JSON.parse(localStorage.getItem('hairAssessmentData')) || {};

  /* =========================
     PHONE INPUT (INTL TEL)
  ========================= */
  const iti = window.intlTelInput(mobileInput, {
    initialCountry: "in",
    separateDialCode: true,
    nationalMode: false,
    autoPlaceholder: "polite",
    preferredCountries: ["in", "us", "gb"],
    utilsScript:
      "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js"
  });

  // Allow ONLY digits + enforce India = 10 digits
  mobileInput.addEventListener('input', () => {
    const country = iti.getSelectedCountryData();
    let digits = mobileInput.value.replace(/\D/g, '');

    if (country.iso2 === 'in' && digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    mobileInput.value = digits;
  });

  mobileInput.addEventListener('keydown', e => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });

  /* =========================
     STEP DISPLAY
  ========================= */
  function showStep(index) {
    if (index < 0 || index >= steps.length) return;

    steps.forEach((step, i) => {
      step.classList.toggle('active', i === index);
    });

    restoreStepValues(steps[index]);
    updateTopStage(index);
    updateProgress(index);
  }

  function updateTopStage(stepIndex) {
    const stageIndex = steps[stepIndex].dataset.stage;
    topSteps.forEach((step, i) => {
      step.classList.toggle('active', i == stageIndex);
    });
  }

  function updateProgress(stepIndex) {
    const totalSteps = steps.length - 1;
    progress.style.width = (stepIndex / totalSteps) * 100 + '%';
  }

  /* =========================
     VALIDATION
  ========================= */
  function validateStep(stepEl) {
    let isValid = true;

    stepEl.querySelectorAll('.form-group').forEach(group => {
      const error = group.querySelector('.error-text');
      if (error) error.textContent = '';
      group.classList.remove('shake');

      const input = group.querySelector(
        'input:not([type="radio"]):not([type="checkbox"])'
      );

      if (input) {
        if (input.type === 'tel') {
          if (!iti.isValidNumber()) {
            error.textContent = 'Enter a valid mobile number';
            isValid = false;
          }
        } else if (!input.value.trim()) {
          error.textContent = 'This field is required';
          isValid = false;
        }
      }

      if (group.dataset.required === 'radio' &&
          !group.querySelector('input[type="radio"]:checked')) {
        error.textContent = 'Please select an option';
        isValid = false;
      }

      if (group.dataset.required === 'checkbox' &&
          !group.querySelector('input[type="checkbox"]:checked')) {
        error.textContent = 'Select at least one option';
        isValid = false;
      }

      if (!isValid) group.classList.add('shake');
    });

    return isValid;
  }

  /* =========================
     NAVIGATION
  ========================= */
  document.addEventListener('click', e => {

    if (e.target.classList.contains('next')) {
  if (!validateStep(steps[current])) return;

  // 🔥 PARTIAL LEAD SEND (ONLY AFTER STEP 0)
  if (current === 0) {
    // Ensure latest values are saved
    saveState();

    // Send partial lead
    sendPartialLead(formState);
  }

  current++;
  showStep(current);
}


    if (e.target.classList.contains('prev')) {
      current--;
      showStep(current);
    }
  });

  /* =========================
     SAVE STATE
  ========================= */
  function saveState() {
    document.querySelectorAll('input').forEach(input => {
      if (!input.name) return;

      if (input.type === 'checkbox') {
        formState[input.name] = formState[input.name] || [];
        input.checked
          ? formState[input.name].push(input.value)
          : formState[input.name] =
              formState[input.name].filter(v => v !== input.value);
      }
      else if (input.type === 'radio') {
        if (input.checked) formState[input.name] = input.value;
      }
      else if (input.type === 'tel') {
  const digits = input.value.replace(/\D/g, '');
  formState[input.name] = digits;
}
      else {
        formState[input.name] = input.value;
      }
    });

    localStorage.setItem('hairAssessmentData', JSON.stringify(formState));
  }

  document.addEventListener('input', saveState);
  document.addEventListener('change', saveState);

  /* =========================
     RESTORE STATE
  ========================= */
  function restoreStepValues(stepEl) {
    stepEl.querySelectorAll('input').forEach(input => {
      if (!(input.name in formState)) return;

      if (input.type === 'radio') {
        input.checked = input.value === formState[input.name];
      }
      else if (input.type === 'checkbox') {
        input.checked = formState[input.name]?.includes(input.value);
      }
      else if (input.type === 'tel') {
  input.value = formState[input.name];
}
      else {
        input.value = formState[input.name];
      }
    });
  }

  /* =========================
     NONE CHECKBOX LOGIC
  ========================= */
  document.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;

    const chip = e.target.closest('.chip');
    const group = chip?.closest('.chip-grid');
    if (!group) return;

    const isNone = chip.innerText.trim().toLowerCase() === 'none';
    const checkboxes = group.querySelectorAll('input[type="checkbox"]');

    if (isNone && e.target.checked) {
      checkboxes.forEach(cb => cb !== e.target && (cb.checked = false));
    }

    if (!isNone && e.target.checked) {
      checkboxes.forEach(cb => {
        if (cb.closest('.chip')?.innerText.trim().toLowerCase() === 'none') {
          cb.checked = false;
        }
      });
    }

    saveState();
  });

  /* =========================
     INITIAL LOAD
  ========================= */
  showStep(current);
});

/* =========================
   LEADSQUARED SEND (READY)
========================= */


function buildPartialLeadPayload(formState) {
  return [
    { Attribute: "FirstName", Value: formState.full_name || "" },
    { Attribute: "Age", Value: formState.age || "" },
    { Attribute: "Phone", Value: formState.mobile || "" },
    { Attribute: "LeadSource", Value: "Hair Assessment - Partial" },
    { Attribute: "LeadStage", Value: "Incomplete" }
  ];
}

function sendToLeadSquared(payload) {
  const url =
    `https://api-${LEADSQUARED_REGION}.leadsquared.com/v2/LeadManagement.svc/Lead.Create` +
    `?accessKey=${LEADSQUARED_ACCESS_KEY}&secretKey=${LEADSQUARED_SECRET_KEY}`;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => console.log("LeadSquared SUCCESS:", data))
    .catch(err => console.error("LeadSquared ERROR:", err));
}

function sendPartialLead(formState) {
  const alreadySent = localStorage.getItem('partialLeadSent');

  if (alreadySent === 'true') return;

  // Only send if mobile exists (critical)
  if (!formState.mobile) return;

  const payload = buildPartialLeadPayload(formState);

  console.log("Sending PARTIAL lead:", payload);

  sendToLeadSquared(payload);

  localStorage.setItem('partialLeadSent', 'true');
  // Override lead type
payload.push(
  { Attribute: "LeadSource", Value: "Hair Assessment - Completed" },
  { Attribute: "LeadStage", Value: "Completed" }
);

sendToLeadSquared(payload);

// Cleanup
localStorage.removeItem('hairAssessmentData');
localStorage.removeItem('partialLeadSent');
}


function buildLeadSquaredPayload(type = "partial") {
  const data = JSON.parse(localStorage.getItem('hairAssessmentData')) || {};

  // Base payload (minimum required by LeadSquared)
  const payload = {
    FirstName: data["Full Name"] || data["full name"] || "",
    Phone: data["mobile"] || "",
    Age: data["Age"] || "",
    LeadSource: "Hair Assessment Form",
    LeadStage: type === "partial" ? "Partial Lead" : "Complete Lead"
  };

  // Add extended fields ONLY for full submission
  if (type === "full") {
    payload.Gender = data.gender || "";
    payload.HairLossDuration = data.duration || "";
    payload.HairLossPattern = data.pattern || "";
    payload.LossType = data.lossType || "";
    payload.ScalpSymptoms = (data.scalpSymptoms || []).join(", ");
    payload.MedicalConditions = (data.medicalConditions || []).join(", ");
    payload.PreviousTreatments = (data.previousTreatments || []).join(", ");
    payload.Goal = data.goal || "";
    payload.EmailAddress = data.email || "";
  }

  return payload;
}
