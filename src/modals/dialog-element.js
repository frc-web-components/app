const { LitElement } = window.FwcDashboard.lit;

class DialogElement extends LitElement {
  closeDialog() {
    this.dispatchEvent(new CustomEvent('closeDialog', {
      bubbles: true,
      composed: true
    }));
  }
}

module.exports.DialogElement = DialogElement;
