import { css, html } from 'lit';
import preferences from '../preferences.js';
import DialogElement from './dialog-element';

class NetworkTablesDialog extends DialogElement {

  static styles = css`
    .networktables-dialog-content {
      width: 250px;
    }
    .networktables-dialog-content p {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 5px;
    }
    .networktables-dialog-content vaadin-text-field {
      width: 100%;
    }
    .networktables-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .networktables-dialog-buttons vaadin-button {
      margin-left: 5px;
    }
  `;

  static properties = {
    serverInput: { state: true },
  };

  constructor() {
    super();
    this.serverInput = preferences.ntAddress;
  }

  onClose() {
    this.closeDialog();
  }

  onConfirm() {
    if (serverInput.value !== preferences.ntAddress) {
      preferences.ntAddress = serverInput.value;
    }
    this.closeDialog();
  }

  render() {
    return html`
      <div class="networktables-dialog-content">
        <p>NetworkTables Settings</p>
        <vaadin-text-field label="Robot Address" theme="small" value=${this.serverInput}></vaadin-text-field>
        <div class="networktables-dialog-buttons">
          <vaadin-button part="confirm-button" theme="success primary small" @click=${this.onConfirm}>Confirm</vaadin-button>
          <vaadin-button part="close-button" theme="small" @click=${this.onClose}>Close</vaadin-button>
        </div>
      </div>
    `;
  }
}

customElements.define('networktables-dialog', NetworkTablesDialog);