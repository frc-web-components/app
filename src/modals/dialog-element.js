import { LitElement } from 'lit';

export default class DialogElement extends LitElement {
  closeDialog() {
    this.dispatchEvent(new CustomEvent('closeDialog', {
      bubbles: true,
      composed: true
    }));
  }
}
