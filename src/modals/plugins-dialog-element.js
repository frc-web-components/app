const { css, html } = window.FwcDashboard.lit;
const { DialogElement } = require('./dialog-element');

class PluginsDialog extends DialogElement {

  static styles = css`
    .plugins-dialog-content {
      width: 250px;
    }
    .plugins-dialog-content p {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 5px;
    }
    .plugins-dialog-content vaadin-text-field {
      width: 100%;
    }
    .plugins-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .plugins-dialog-buttons vaadin-button {
      margin-left: 5px;
    }

    .item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item:hover {
      background: #eee;
    }

    .item vaadin-button {
      margin: 0;
      height: 20px;
      cursor: pointer;
    }

    .item iron-icon {
      color: red;
    }
  `;

  static properties = {
    address: { state: true },
  };

  constructor() {
    super();
    this.plugins = [
      { name: 'Plugin 1', enabled: true },
      { name: 'Plugin 2', enabled: false },
      { name: 'Plugin 3', enabled: true },
    ]
  }

  onClose() {
    this.closeDialog();
  }

  onConfirm() {
    this.closeDialog();
  }

  render() {
    const selectedPlugins = [];
    this.plugins.forEach(({ enabled }, index) => {
      if (enabled) {
        selectedPlugins.push(index);
      }
    });
    return html`
      <div class="plugins-dialog-content">
        <p>Plugins</p>
        ${this.plugins.map(plugin => html`
          <div class="item">
            <div>
              <vaadin-checkbox ?checked=${plugin.enabled}></vaadin-checkbox>
              <span>${plugin.name}</span>
            </div>
            <vaadin-button theme="icon small tertiary">
              <iron-icon icon="vaadin:close-small"></iron-icon>
            </vaadin-button>
          </div>
        `)}
        <div class="plugins-dialog-buttons">
          <vaadin-button part="confirm-button" theme="success primary small" @click=${this.onConfirm}>Confirm</vaadin-button>
          <vaadin-button part="close-button" theme="small" @click=${this.onClose}>Close</vaadin-button>
        </div>
      </div>
    `;
  }
}

customElements.define('plugins-dialog', PluginsDialog);