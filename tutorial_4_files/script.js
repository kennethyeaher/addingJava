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

/** @returns {string} the trimmed name, or Someone when the input is blank. */
const getName = () => nameInput.value.trim() || 'Someone';

/** @returns {number} the guest input converted from a string to a number. */
const getGuests = () => Number(guestInput.value);

/** updates the confirmation text using the current name and guest count. */
const updateConfirmation = () => {
  const guests = getGuests();
  let guestLine = 'flying solo.';

  if (guests === 1) {
    guestLine = 'bringing 1 guest.';
  } else if (guests > 1) {
    guestLine = `bringing ${guests} guests.`;
  }

  confirmation.textContent = `${getName()} is coming, ${guestLine}`;
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
  guestField.classList.add('hidden');
  confirmation.classList.add('hidden');
  regret.classList.add('hidden');
  confirmation.textContent = '';
  regret.textContent = '';
};
