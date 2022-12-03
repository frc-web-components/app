/* eslint-disable import/extensions */
import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { open } from "@tauri-apps/api/dialog";
import { appDir } from "@tauri-apps/api/path";
import { Plugin, writePluginConfig, getPlugins } from '../plugins';

@customElement("dashboard-plugins-dialog-body")
export class SettingsDialog extends LitElement {
  @state() plugins: Plugin[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 350px;
    }

    .form {
      flex: 1;
      width: 100%;
      padding: 15px 20px;
      box-sizing: border-box;
    }

    .form-item {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .form-item label {
      width: 100px;
    }

    .form-item .input {
      flex: 1;
    }
  `;

  onClose(): void {
    this.dispatchEvent(
      new CustomEvent("closeDialog", {
        bubbles: true,
        composed: true,
      })
    );
  }

  async firstUpdated() {
    this.plugins = await getPlugins();
  }


  private async onLoadPlugin() {
    // invoke("load_plugin");
    const selected = await open({
      directory: true,
      defaultPath: await appDir(),
    });
    if (!Array.isArray(selected) && selected !== null) {
      let plugins = await getPlugins();
      plugins = plugins.concat({
        directory: selected,
        name: `Plugin ${(plugins.length + 1)}`
      });
      await writePluginConfig(plugins);
      this.plugins = plugins;
    }
  }

  render(): TemplateResult {

    return html`
      <header
        style="border-bottom: 1px solid var(--lumo-contrast-10pct); padding: var(--lumo-space-m) var(--lumo-space-l);"
      >
        <h2
          style="font-size: var(--lumo-font-size-xl); font-weight: 600; line-height: var(--lumo-line-height-xs); margin: 0;"
        >
          Dashboard Settings
        </h2>
      </header>
      <div>
        ${this.plugins.map(plugin => html`
          <p>${plugin.name}: ${plugin.directory}</p>
        `)}
      </div>
      <footer
        style="padding: var(--lumo-space-s) var(--lumo-space-m); display: flex; justify-content: end; gap: 10px;"
      >
        <vaadin-button
          theme="primary"
          @click="${() => {
            this.onLoadPlugin();
          }}"
        >
          Load Plugin
        </vaadin-button>
        <vaadin-button
          @click="${() => {
            this.onClose();
          }}"
        >
          Close
        </vaadin-button>
      </footer>
    `;
  }
}
