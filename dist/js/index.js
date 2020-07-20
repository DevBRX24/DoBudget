const form = document.querySelector('form');
const nameInput = document.getElementById('name');
const costInput = document.getElementById('cost');
const errorMessageForm = document.getElementById('error');

function addItem() {
  if (nameInput.value.trim() && costInput.value.trim()) {
    const item = {
      name: nameInput.value,
      cost: parseInt(costInput.value),
    };

    db.collection('expenses')
      .add(item)
      .then((res) => {
        errorMessageForm.textContent = null;
        nameInput.value = null;
        costInput.value = null;
      });
  } else {
    error.textContent = 'Please enter values before submitting';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addItem();
});
