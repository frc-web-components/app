const { css, html } = window.FwcDashboard.lit;
const { DialogElement } = require('./dialog-element');
const { preferences } = require('../preferences.js');

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

  constructor() {
    super();
  }

  firstUpdated() {
    preferences.onPluginsChange(() => {
      this.requestUpdate();
    });
  }

  onClose() {
    this.closeDialog();
  }

  onAdd() {

  }

  onRemove(plugin) {
    preferences.removePlugin(plugin.path);
  }

  onEnableToggle(ev, plugin) {
    console.log('toggle:', ev);
    // preferences.enablePlugin(plugin.path, ev.detail.checked);
  }

  render() {
    return html`
      <div class="plugins-dialog-content">
        <p>Plugins</p>
        ${preferences.plugins.map(plugin => html`
          <div class="item">
            <div>
              <vaadin-checkbox 
                ?checked=${plugin.enabled}
                @change=${ev => this.onEnableToggle(ev, plugin)}
              ></vaadin-checkbox>
              <span>${plugin.name}</span>
            </div>
            <vaadin-button theme="icon small tertiary" @click=${() => this.onRemove(plugin)}>
              <iron-icon icon="vaadin:close-small"></iron-icon>
            </vaadin-button>
          </div>
        `)}
        <div class="plugins-dialog-buttons">
          <vaadin-button 
            part="add-plugin-button" 
            theme="success primary small" 
            @click=${this.onAdd}
          >
            Add Plugin
          </vaadin-button>
          <vaadin-button part="close-button" theme="small" @click=${this.onClose}>Close</vaadin-button>
        </div>
      </div>
    `;
  }
}

customElements.define('plugins-dialog', PluginsDialog);