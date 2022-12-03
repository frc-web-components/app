/* eslint-disable import/extensions */
import { LitElement, html, TemplateResult, render } from "lit";
import { customElement, state } from "lit/decorators.js";
import { guard } from "lit/directives/guard.js";
import './plugins-dialog-body';
import { appWindow } from "@tauri-apps/api/window";

@customElement("dashboard-plugins-dialog")
export class DashboardPluginsDialog extends LitElement {
  @state() dialogOpened = false;


  firstUpdated() {
    appWindow.listen("openPluginsDialog", () => {
      this.dialogOpened = true;
      console.log('...');
    });
  }
 
  render(): TemplateResult {
    return html`
      <vaadin-dialog
        theme="no-padding"
        @opened-changed=${(e: CustomEvent) => {
          this.dialogOpened = e.detail.value;
        }}
        .opened=${this.dialogOpened}
        .renderer=${guard([], () => (root: HTMLElement) => {
          render(
            html`
              <dashboard-plugins-dialog-body
                @closeDialog=${() => {
                  this.dialogOpened = false;
                }}
              ></dashboard-plugins-dialog-body>
            `,
            root
          );
        })}
      ></vaadin-dialog>
    `;
  }
}
