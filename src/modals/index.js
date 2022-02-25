class NetworkTablesDialog {

  constructor(dialogElementName) {
    this._dialog = document.createElement('vaadin-dialog');
    this._dialogElementName = dialogElementName;
    document.body.append(this._dialog);
    this._initDialog();
  }

  open() {
    this._dialog.opened = true;
  }

  close() {
    this._dialog.opened = false;
  }

  _initDialog() {
    const that = this;
    this._dialog.renderer = function(root, dialog) {
      if (!root.firstElementChild) {
        const div = window.document.createElement('div');
        div.innerHTML = `<${that._dialogElementName}></${that._dialogElementName}>`;
        div.addEventListener('closeDialog', () => {
          that.close();
        });
        root.appendChild(div);
      }
    }
  }
}

const ntDialog = new NetworkTablesDialog('networktables-dialog');
const pluginsDialog = new NetworkTablesDialog('plugins-dialog');

export function openNtDialog() {
  ntDialog.open();
}

export function openPluginsDialog() {
  pluginsDialog.open();
}
