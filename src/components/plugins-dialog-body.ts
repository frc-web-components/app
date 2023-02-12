/* eslint-disable import/extensions */
import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { open } from "@tauri-apps/api/dialog";
import { desktopDir } from "@tauri-apps/api/path";
import {
  Plugin,
  writePluginConfig,
  getPlugins,
  getPluginInfo,
  PluginInfo,
} from "../plugins";
import { basename } from "@tauri-apps/api/path";

@customElement("dashboard-plugins-dialog-body")
export class PluginsDialogBody extends LitElement {
  @state() plugins: Plugin[] = [];
  @state() pluginInfo: PluginInfo = {};

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

    table {
      border-collapse: collapse;
      font-size: 0.9em;
      font-family: sans-serif;
      min-width: 400px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    }

    table thead tr {
      background-color: #555;
      color: #ffffff;
      text-align: left;
    }

    table th {
      text-align: left;
    }

    table th,
    table td {
      padding: 6px 12px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    table th.directory,
    table td.directory {
      max-width: 200px;
    }

    table tbody tr {
      border-bottom: 1px solid #dddddd;
    }

    table tbody tr:nth-of-type(even) {
      background-color: #f3f3f3;
    }

    table tbody tr.active-row {
      font-weight: bold;
      color: #009879;
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
    console.log("???");
    this.pluginInfo = await getPluginInfo();
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
        name: await basename(selected),
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
    console.log(
      "plugins:",
      this.plugins.map((plugin) => basename(plugin.directory))
    );

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
        <table>
          <thead>
            <tr>
              <th class="name">Name</th>
              <th class="directory">Location</th>
              <th class="version">Version</th>
              <th class="remove"></th>
            </tr>
          </thead>
          <tbody>
            ${this.plugins.length === 0
              ? html` <p style="direction: ltr; padding-left: 10px">
                  No plugins loaded
                </p>`
              : null}
            ${this.plugins.map((plugin, index) => {
              const info = this.pluginInfo[plugin.directory];
              const name = info?.name ?? 'N/A';
              const version = info?.version ?? 'N/A';
              const directory = plugin.directory;
              return html`
                <tr>
                  <td class="name">${name}</td>
                  <td class="directory" title=${directory}>
                    ${directory}
                  </td>
                  <td class="version">${version}</td>
                  <td class="remove">
                    <vaadin-button
                      theme="icon tertiary error"
                      @click=${() => this.removePlugin(index)}
                    >
                      <vaadin-icon icon="vaadin:close"></vaadin-icon>
                    </vaadin-button>
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
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
