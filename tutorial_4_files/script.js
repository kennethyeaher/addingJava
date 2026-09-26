// track the response separately from the name string and guest number
let isGoing = false;
let isNotGoing = false;

// find the card controls once, after the HTML has loaded
const nameInput = document.querySelector('#name-input');
const guestInput = document.querySelector('#guest-input');
const guestField = document.querySelector('#guest-field');
const btnYes = document.querySelector('#btn-yes');
const btnNo = document.querySelector('#btn-no');
const confirmation = document.querySelector('#confirmation');
const regret = document.querySelector('#regret');
const guestError = document.querySelector('#guest-error');
const guestTotal = document.querySelector('#guest-total');

/** @returns {string} the trimmed name, or Someone when the input is blank. */
const getName = () => nameInput.value.trim() || 'Someone';

/** @returns {number} the guest input converted from a string to a number. */
const getGuests = () => Number(guestInput.value);

/** updates the confirmation text using the current name and guest count. */
const updateConfirmation = () => {
  const guests = getGuests();
  const hasValidGuests = guestInput.value !== ''
    && guestInput.validity.valid
    && Number.isInteger(guests);

  // explain invalid entries without silently changing what the user typed
  guestInput.setAttribute('aria-invalid', String(!hasValidGuests));
  guestError.textContent = hasValidGuests ? '' : 'Enter a whole number from 0 to 10.';
  confirmation.classList.toggle('hidden', !hasValidGuests);
  guestTotal.textContent = '';

  if (!hasValidGuests) {
    confirmation.textContent = '';
    return;
  }

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

/** selects Going and shows the guest field and confirmation. */
const chooseGoing = () => {
  isGoing = true;
  isNotGoing = false;
  btnYes.classList.add('active');
  btnNo.classList.remove('active');
  btnYes.setAttribute('aria-pressed', 'true');
  btnNo.setAttribute('aria-pressed', 'false');
  guestField.classList.remove('hidden');
  confirmation.classList.remove('hidden');
  regret.classList.add('hidden');
  updateConfirmation();
};

/** selects Can't make it and hides the guest field and confirmation. */
const chooseNotGoing = () => {
  isGoing = false;
  isNotGoing = true;
  btnNo.classList.add('active');
  btnYes.classList.remove('active');
  btnYes.setAttribute('aria-pressed', 'false');
  btnNo.setAttribute('aria-pressed', 'true');
  guestField.classList.add('hidden');
  confirmation.classList.add('hidden');
  regret.classList.remove('hidden');
  updateRegret();
};

/** refreshes the selected response without making a choice for the user. */
const updateResponse = () => {
  if (isGoing) {
    updateConfirmation();
  } else if (isNotGoing) {
    updateRegret();
  }
};

// clicks choose a response; typing keeps the selected response current
btnYes.addEventListener('click', chooseGoing);
btnNo.addEventListener('click', chooseNotGoing);
nameInput.addEventListener('input', updateResponse);
guestInput.addEventListener('input', updateResponse);

/** @returns {object} the current values and types for console inspection. */
const checkStatus = () => ({
  isGoing,
  isNotGoing,
  name: getName(),
  guests: getGuests(),
  guestType: typeof getGuests(),
  inputType: typeof guestInput.value,
});

/** clears the inputs, response messages, and selected button states. */
const resetCard = () => {
  isGoing = false;
  isNotGoing = false;
  nameInput.value = '';
  guestInput.value = '0';
  btnYes.classList.remove('active');
  btnNo.classList.remove('active');
  btnYes.setAttribute('aria-pressed', 'false');
  btnNo.setAttribute('aria-pressed', 'false');
  guestInput.setAttribute('aria-invalid', 'false');
  guestError.textContent = '';
  guestTotal.textContent = '';
  guestField.classList.add('hidden');
  confirmation.classList.add('hidden');
  regret.classList.add('hidden');
  confirmation.textContent = '';
  regret.textContent = '';
};
