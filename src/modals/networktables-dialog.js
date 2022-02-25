import './networktables-dialog-element.js';

export default class NetworkTablesDialog {

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
    this._dialog.renderer = function(root, dialog) {
      if (!root.firstElementChild) {
        const div = window.document.createElement('div');
        div.innerHTML = `<networktables-dialog></networktables-dialog>`;
        div.addEventListener('closeDialog', () => {
          this.close();
        });
        root.appendChild(div);
      }
    }
  }
}
