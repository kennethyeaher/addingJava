// retain the two booleans from the exercise; neither is true before a choice
let isGoing = false;
let isNotGoing = false;
let previousResponse = null;
const draftKey = 'rsvp-card.draft.v1';

// select controls once, after the HTML has loaded
const nameInput = document.querySelector('#name-input');
const guestInput = document.querySelector('#guest-input');
const guestField = document.querySelector('#guest-field');
const btnYes = document.querySelector('#btn-yes');
const btnNo = document.querySelector('#btn-no');
const confirmation = document.querySelector('#confirmation');
const regret = document.querySelector('#regret');
const guestError = document.querySelector('#guest-error');
const guestTotal = document.querySelector('#guest-total');
const rememberDraft = document.querySelector('#remember-draft');
const draftStatus = document.querySelector('#draft-status');
const resetButton = document.querySelector('#reset-button');
const undoButton = document.querySelector('#undo-button');
const actionStatus = document.querySelector('#action-status');
const summaryName = document.querySelector('#summary-name');
const summaryChoice = document.querySelector('#summary-choice');
const summaryParty = document.querySelector('#summary-party');
const summaryStatus = document.querySelector('#summary-status');
const downloadButton = document.querySelector('#download-button');
const downloadHint = document.querySelector('#download-hint');

/** @returns {string} the trimmed name, or Someone when the input is blank. */
const getName = () => nameInput.value.trim() || 'Someone';

/** @returns {number} the guest input converted from a string to a number. */
const getGuests = () => Number(guestInput.value);

/** @returns {boolean} whether the guest entry is a whole number from 0 to 10. */
const hasValidGuests = () => guestInput.value !== ''
  && guestInput.validity.valid && Number.isInteger(getGuests());

/** updates the confirmation and validation feedback from the current inputs. */
const updateConfirmation = () => {
  const validGuests = hasValidGuests();
  guestInput.setAttribute('aria-invalid', String(!validGuests));
  guestError.textContent = validGuests ? '' : 'Enter a whole number from 0 to 10.';
  confirmation.classList.toggle('hidden', !validGuests);
  guestTotal.textContent = '';

  if (!validGuests) {
    confirmation.textContent = '';
    return;
  }

  const guests = getGuests();
  let guestLine = 'flying solo.';
  if (guests === 1) {
    guestLine = 'bringing 1 guest.';
  } else if (guests > 1) {
    guestLine = `bringing ${guests} guests.`;
  }
  confirmation.textContent = `${getName()} is coming, ${guestLine}`;
  const totalPeople = guests + 1;
  guestTotal.textContent = `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'} in your party, including you.`;
};

/** updates the regret text using the current name. */
const updateRegret = () => {
  regret.textContent = `We'll miss you, ${getName()}!`;
};

/** updates the summary and enables downloads only for a valid response. */
const updateSummary = () => {
  const canDownload = isNotGoing || (isGoing && hasValidGuests());
  summaryName.textContent = nameInput.value.trim() || 'Your name goes here';
  summaryChoice.textContent = isGoing ? 'Going' : isNotGoing ? "Can't make it" : "Choose Going or Can't make it";
  summaryStatus.textContent = canDownload ? 'Ready to download' : isGoing ? 'Check guest count' : 'Not selected';
  summaryParty.textContent = isNotGoing ? 'Not attending' : 'No response yet';
  if (isGoing) {
    summaryParty.textContent = hasValidGuests() ? guestTotal.textContent : 'Enter 0 to 10 whole guests';
  }
  downloadButton.disabled = !canDownload;
  downloadHint.textContent = canDownload ? 'A text copy for your records. Nothing is submitted.'
    : isGoing ? 'Correct the guest count to download your response.' : 'Choose a response to download a text copy.';
};

/** synchronizes all visible and accessible states without changing the response. */
const updateResponse = () => {
  btnYes.classList.toggle('active', isGoing);
  btnNo.classList.toggle('active', isNotGoing);
  btnYes.setAttribute('aria-pressed', String(isGoing));
  btnNo.setAttribute('aria-pressed', String(isNotGoing));
  guestField.classList.toggle('hidden', !isGoing);
  confirmation.classList.add('hidden');
  regret.classList.toggle('hidden', !isNotGoing);
  guestInput.setAttribute('aria-invalid', 'false');
  guestError.textContent = '';
  guestTotal.textContent = '';
  confirmation.textContent = '';
  regret.textContent = '';
  if (isGoing) updateConfirmation();
  if (isNotGoing) updateRegret();
  updateSummary();
};

/** @returns {object} the current draft, including the explicit storage preference. */
const captureResponse = () => ({
  version: 1,
  name: nameInput.value,
  guests: guestInput.value,
  choice: isGoing ? 'going' : isNotGoing ? 'notGoing' : null,
  remember: rememberDraft.checked,
});

/** saves only opted in drafts, or removes this card's saved draft; reports failure. */
const saveDraft = () => {
  try {
    if (rememberDraft.checked) {
      localStorage.setItem(draftKey, JSON.stringify(captureResponse()));
      draftStatus.textContent = 'Draft saved on this browser. Reset response clears it.';
    } else {
      localStorage.removeItem(draftKey);
      draftStatus.textContent = 'Saving is off. No draft is kept on this browser.';
    }
  } catch {
    draftStatus.textContent = rememberDraft.checked
      ? 'This browser could not save the draft. You can still use and download your response.'
      : 'This browser could not clear saved data. Clear this site’s browser data to remove any earlier draft.';
  }
};

/** @param {object} draft a validated snapshot to apply to the controls. */
const applyResponse = (draft) => {
  nameInput.value = draft.name;
  guestInput.value = draft.guests;
  isGoing = draft.choice === 'going';
  isNotGoing = draft.choice === 'notGoing';
  rememberDraft.checked = draft.remember;
  updateResponse();
};

/** restores only recognized draft data; storage errors leave the card usable. */
const restoreDraft = () => {
  try {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    const draft = JSON.parse(saved);
    const validDraft = draft && draft.version === 1 && draft.remember === true
      && typeof draft.name === 'string' && draft.name.length <= 80
      && typeof draft.guests === 'string' && draft.guests.length <= 20
      && (draft.guests === '' || Number.isFinite(Number(draft.guests)))
      && [null, 'going', 'notGoing'].includes(draft.choice);
    if (!validDraft) throw new Error('Unrecognized draft');
    applyResponse(draft);
    draftStatus.textContent = 'Your saved draft is restored. Changes stay on this browser.';
  } catch {
    draftStatus.textContent = 'A saved draft could not be read. Start a new response or reset to clear it.';
  }
};

/** clears the previous Undo action after the user starts another edit. */
const clearUndo = () => {
  previousResponse = null;
  undoButton.classList.add('hidden');
  actionStatus.textContent = '';
};

/** refreshes live feedback and saves edits only when storage was selected. */
const handleInput = () => {
  clearUndo();
  updateResponse();
  if (rememberDraft.checked) saveDraft();
};

/** selects Going while keeping the two attendance booleans mutually exclusive. */
const chooseGoing = () => {
  isGoing = true;
  isNotGoing = false;
  handleInput();
};

/** selects Can't make it while keeping the guest count for a possible return. */
const chooseNotGoing = () => {
  isGoing = false;
  isNotGoing = true;
  handleInput();
};

/** applies the storage preference immediately and removes any available Undo. */
const changeRemember = () => {
  clearUndo();
  saveDraft();
};

/** clears the response and saved draft, retaining one snapshot in memory for Undo. */
const resetCard = () => {
  previousResponse = captureResponse();
  applyResponse({ name: '', guests: '0', choice: null, remember: false });
  saveDraft();
  undoButton.classList.remove('hidden');
  actionStatus.textContent = 'Response reset. Undo is available until your next edit or reload.';
  nameInput.focus();
};

/** restores the last reset snapshot and its storage preference once. */
const undoReset = () => {
  if (!previousResponse) return;
  applyResponse(previousResponse);
  saveDraft();
  clearUndo();
  actionStatus.textContent = 'Your previous response is restored.';
  resetButton.focus();
};

/** downloads a plain text response using a temporary URL; sends no network request. */
const downloadResponse = () => {
  if (!(isNotGoing || (isGoing && hasValidGuests()))) return;
  const message = isGoing ? confirmation.textContent : regret.textContent;
  const text = `RSVP | End of Semester Party\nFriday, May 9 | 7pm | Someone's Rooftop\n\n${message}\n${isGoing ? guestTotal.textContent + '\n' : ''}\nPractice invitation. This response has not been sent to an organizer.\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rsvp-response.txt';
  document.body.append(link);
  link.click();
  link.remove();
  // allow the browser to begin reading the file before releasing its URL
  /** releases the temporary file URL after the download starts. */
  const releaseDownload = () => URL.revokeObjectURL(url);
  setTimeout(releaseDownload, 1000);
  actionStatus.textContent = 'Your response download has started.';
};

/** @returns {object} the current values and types for console inspection. */
const checkStatus = () => ({
  isGoing, isNotGoing, name: getName(), guests: getGuests(),
  guestType: typeof getGuests(), inputType: typeof guestInput.value,
});

// the original click and input events still drive every required interaction
btnYes.addEventListener('click', chooseGoing);
btnNo.addEventListener('click', chooseNotGoing);
nameInput.addEventListener('input', handleInput);
guestInput.addEventListener('input', handleInput);
rememberDraft.addEventListener('change', changeRemember);
resetButton.addEventListener('click', resetCard);
undoButton.addEventListener('click', undoReset);
downloadButton.addEventListener('click', downloadResponse);
updateResponse();
restoreDraft();
