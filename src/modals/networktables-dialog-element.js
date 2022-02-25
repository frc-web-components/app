const { css, html } = window.FwcDashboard.lit;
const { preferences } = require('../preferences.js');
const { DialogElement } = require('./dialog-element');

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
    address: { state: true },
  };

  constructor() {
    super();
    this.address = preferences.ntAddress;
  }

  onClose() {
    this.closeDialog();
  }

  onConfirm() {
    if (this.address !== preferences.ntAddress) {
      preferences.ntAddress = this.address;
    }
    this.closeDialog();
  }

  onChange(ev) {
    const input = ev.target || ev.path[0];
    this.address = input.value;
  }

  render() {
    return html`
      <div class="networktables-dialog-content">
        <p>NetworkTables Settings</p>
        <vaadin-text-field label="Robot Address" theme="small" value=${this.address} @change=${this.onChange}></vaadin-text-field>
        <div class="networktables-dialog-buttons">
          <vaadin-button part="confirm-button" theme="success primary small" @click=${this.onConfirm}>Confirm</vaadin-button>
          <vaadin-button part="close-button" theme="small" @click=${this.onClose}>Close</vaadin-button>
        </div>
      </div>
    `;
  }
}

customElements.define('networktables-dialog', NetworkTablesDialog);