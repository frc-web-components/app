/* eslint-disable import/extensions */
import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { open } from "@tauri-apps/api/dialog";
import { desktopDir } from "@tauri-apps/api/path";
import { Plugin, writePluginConfig, getPlugins } from "../plugins";

@customElement("dashboard-plugins-dialog-body")
export class PluginsDialogBody extends LitElement {
  @state() plugins: Plugin[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 500px;
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

    .plugins {
      display: flex;
      flex-direction: column;
      padding: 10px 15px;
    }

    .plugin {
      width: 100%;
      display: flex;
      flex-wrap: nowrap;
      gap: 10px;
      align-items: center;
    }

    p {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      margin: 0;
      direction: rtl;
    }

    vaadin-button {
      cursor: pointer;
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
    const selected = await open({
      directory: true,
      defaultPath: await desktopDir(),
    });
    if (!Array.isArray(selected) && selected !== null) {
      let plugins = await getPlugins();
      plugins = plugins.concat({
        directory: selected,
        name: `Plugin ${plugins.length + 1}`,
      });
      await writePluginConfig(plugins);
      this.plugins = plugins;
    }
  }

  private async removePlugin(index: number) {
    const plugins = [...this.plugins];
    plugins.splice(index, 1);
    await writePluginConfig(plugins);
    this.plugins = plugins;
  }

  render(): TemplateResult {
    return html`
      <header
        style="border-bottom: 1px solid var(--lumo-contrast-10pct); padding: var(--lumo-space-m) var(--lumo-space-l);"
      >
        <h2
          style="font-size: var(--lumo-font-size-xl); font-weight: 600; line-height: var(--lumo-line-height-xs); margin: 0;"
        >
          Manage Plugins
        </h2>
      </header>
      <div class="plugins">
        ${this.plugins.length === 0
          ? html` <p style="direction: ltr; padding-left: 10px">
              No plugins loaded
            </p>`
          : null}
        ${this.plugins.map(
          (plugin, index) => html`
            <div class="plugin">
              <p>${plugin.directory}</p>
              <vaadin-button
                theme="icon tertiary error"
                @click=${() => this.removePlugin(index)}
              >
                <vaadin-icon icon="vaadin:close"></vaadin-icon>
              </vaadin-button>
            </div>
          `
        )}
      </div>
      <footer
        style="padding: 10px 20px; display: flex; justify-content: end; gap: 10px;"
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
