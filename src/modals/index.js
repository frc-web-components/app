class NetworkTablesDialog {

  constructor() {
    this._dialog = document.createElement('vaadin-dialog');
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
        div.innerHTML = `<networktables-dialog></networktables-dialog>`;
        div.addEventListener('closeDialog', () => {
          that.close();
        });
        root.appendChild(div);
      }
    }
  }
}

const ntDialog = new NetworkTablesDialog();

export function openModal() {
  ntDialog.open();
}
